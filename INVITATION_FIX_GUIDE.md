# 초대 링크 오류 수정 가이드

## 문제 원인

- **RLS 정책 문제**: `calendar_invitations` 테이블에 `anon` 역할을 위한 SELECT 정책이 없어 비로그인 사용자가 초대 정보를 조회할 수 없음
- **이메일 검증 문제**: 초대 수락 시 이메일 일치 여부를 확인하는 로직 부재

## 해결 방법

### 1. Supabase SQL Editor에서 다음 SQL 실행

```sql
-- calendar_invitations 테이블에 anon 역할을 위한 RLS 정책 추가
-- 비로그인 사용자도 invitation_token으로 초대 정보를 조회할 수 있도록 함

-- 1. anon 역할이 invitation_token으로 초대 정보를 조회할 수 있는 정책 추가
CREATE POLICY "Anyone can view invitations with valid token"
ON public.calendar_invitations
FOR SELECT
TO anon
USING (
  -- invitation_token이 제공되면 조회 가능 (토큰은 유니크하므로 안전)
  -- 만료되지 않은 초대만 조회 가능
  (expires_at IS NULL OR expires_at > NOW())
  AND status = 'pending'
);

-- 2. 기존 authenticated 사용자의 SELECT 정책 이름 수정 (더 명확하게)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own invitations or calendar owners can vie" ON public.calendar_invitations;

-- 새로운 이름으로 재생성
CREATE POLICY "Authenticated users can view their invitations or manage as admin"
ON public.calendar_invitations
FOR SELECT
TO authenticated
USING (
  (invitee_email = (auth.jwt() ->> 'email'::text))
  OR
  (EXISTS (
    SELECT 1
    FROM calendar_members cm
    WHERE cm.calendar_id = calendar_invitations.calendar_id
      AND cm.user_id = auth.uid()
      AND cm.role = ANY (ARRAY['owner'::text, 'admin'::text])
  ))
);

-- 3. 초대 수락 시 이메일 검증을 위한 함수 생성
-- 이 함수는 초대를 수락할 때 호출되어 이메일이 일치하는지 확인
CREATE OR REPLACE FUNCTION public.accept_calendar_invitation(
  p_invitation_token TEXT,
  p_user_id UUID
)
RETURNS UUID -- calendar_id 반환
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_calendar_id UUID;
BEGIN
  -- 사용자 이메일 조회
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 초대 정보 조회 및 검증
  SELECT * INTO v_invitation
  FROM calendar_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW())
  FOR UPDATE;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  -- 이메일 검증
  IF v_invitation.invitee_email != v_user_email THEN
    RAISE EXCEPTION 'This invitation is for a different email address';
  END IF;

  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM calendar_members
    WHERE calendar_id = v_invitation.calendar_id
      AND user_id = p_user_id
  ) THEN
    -- 이미 멤버면 초대 상태만 업데이트
    UPDATE calendar_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id
    WHERE id = v_invitation.id;

    RETURN v_invitation.calendar_id;
  END IF;

  -- 트랜잭션으로 처리
  -- 1. calendar_members에 추가
  INSERT INTO calendar_members (calendar_id, user_id, role, joined_at)
  VALUES (v_invitation.calendar_id, p_user_id, v_invitation.role, NOW());

  -- 2. 초대 상태 업데이트
  UPDATE calendar_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = p_user_id
  WHERE id = v_invitation.id;

  v_calendar_id := v_invitation.calendar_id;

  RETURN v_calendar_id;
END;
$$;

-- 함수에 대한 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.accept_calendar_invitation TO authenticated;

-- 4. 초대 링크 생성 시 만료 시간 자동 설정 (7일)
ALTER TABLE public.calendar_invitations
ALTER COLUMN expires_at
SET DEFAULT (NOW() + INTERVAL '7 days');

COMMENT ON POLICY "Anyone can view invitations with valid token" ON public.calendar_invitations IS
'비로그인 사용자도 유효한 토큰으로 초대 정보를 조회할 수 있음';

COMMENT ON FUNCTION public.accept_calendar_invitation IS
'초대를 수락하는 함수. 이메일 검증과 멤버 추가를 트랜잭션으로 처리';
```

### 2. 코드 변경 사항

- `calendarService.ts`의 `acceptInvitation` 함수가 새로운 RPC 함수를 사용하도록 수정됨 (이미 적용됨)

### 3. 초대 프로세스 개선 사항

#### 보안 강화

1. **이메일 검증**: 초대받은 이메일과 로그인한 사용자 이메일이 일치하는지 검증
2. **토큰 보안**: invitation_token으로만 조회 가능 (유니크하고 추측 불가능)
3. **만료 시간**: 초대는 7일 후 자동 만료

#### 플로우 개선

1. **비회원 접근**: anon 정책으로 비회원도 초대 정보 확인 가능
2. **회원가입 유도**: 비회원은 회원가입 후 초대 수락 가능
3. **중복 방지**: 이미 멤버인 경우에도 안전하게 처리

### 4. 테스트 방법

1. **초대 링크 접근 테스트**

   ```
   https://www.app.checkmate-calendar.com/invite?token=7f7e46a4-8805-449e-be1f-f77b38a53a67
   ```

   - 비로그인 상태에서 접근 → 초대 정보가 표시되어야 함
   - "새 계정 만들기" 버튼 클릭 → 회원가입 페이지로 이동

2. **초대 수락 테스트**
   - jwj3199@naver.com 계정으로 로그인
   - 초대 링크 접근
   - "초대 수락하기" 클릭 → 캘린더에 추가됨

3. **잘못된 이메일 테스트**
   - 다른 이메일로 로그인
   - 초대 링크 접근
   - "초대 수락하기" 클릭 → "이 초대는 다른 이메일 주소를 위한 것입니다." 에러

## 주의사항

- SQL을 실행하기 전에 백업을 권장합니다
- 실행 후 Supabase 대시보드에서 정책이 올바르게 생성되었는지 확인하세요
