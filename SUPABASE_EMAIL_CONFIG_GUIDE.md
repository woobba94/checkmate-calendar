# Supabase 이메일 인증 설정 가이드

## 📌 문제

- 이메일 인증 링크가 `localhost:3000`으로 연결되어 프로덕션에서 작동하지 않음
- 회원가입 후 이메일 인증 없이 로그인 시도 시 "Email not confirmed" 에러 발생

## 🛠️ 해결 방법

### 1. Supabase Dashboard에서 이메일 템플릿 설정

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 으로 이동
   - 프로젝트 선택

2. **Authentication > URL Configuration 설정**
   - 왼쪽 메뉴에서 `Authentication` 클릭
   - `URL Configuration` 탭으로 이동
   - 다음 설정 확인 및 수정:

   ```
   Site URL: https://www.app.checkmate-calendar.com
   Redirect URLs (허용된 URL들):
   - https://www.app.checkmate-calendar.com/*
   - https://app.checkmate-calendar.com/*
   ```

3. **Authentication > Email Templates 설정**
   - `Email Templates` 탭으로 이동
   - **Confirm signup** 템플릿 선택
   - 다음 내용으로 수정:

   #### 이메일 제목:

   ```
   Checkmate Calendar - 이메일 인증
   ```

   #### 이메일 본문 (HTML):

   ```html
   <h2>Checkmate Calendar에 오신 것을 환영합니다!</h2>
   <p>안녕하세요,</p>
   <p>Checkmate Calendar 회원가입을 진행해주셔서 감사합니다.</p>
   <p>아래 버튼을 클릭하여 이메일 주소를 인증해주세요:</p>
   <p>
     <a
       href="{{ .ConfirmationURL }}"
       style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;"
     >
       이메일 인증하기
     </a>
   </p>
   <p>
     버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣으세요:
   </p>
   <p style="word-break: break-all; color: #6b7280;">{{ .ConfirmationURL }}</p>
   <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
     이 링크는 24시간 동안 유효합니다.<br />
     본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.
   </p>
   <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
   <p style="color: #9ca3af; font-size: 12px;">
     Checkmate Calendar Team<br />
     © 2025 Checkmate Calendar. All rights reserved.
   </p>
   ```

4. **이메일 리다이렉트 URL 설정**
   - 같은 `Email Templates` 섹션에서
   - **Confirmation URL** 설정을 다음과 같이 변경:
   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
   ```

### 2. 콜백 핸들러 생성 (선택사항)

만약 커스텀 콜백 처리가 필요한 경우:

```typescript
// src/pages/auth/AuthCallbackPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('Auth callback error:', error, errorDescription);
        navigate('/login', {
          state: {
            message: errorDescription || '인증 중 오류가 발생했습니다.'
          }
        });
        return;
      }

      // Supabase가 자동으로 처리하므로 추가 작업 불필요
      // 로그인 페이지로 리다이렉트
      navigate('/login', {
        state: { message: '이메일 인증이 완료되었습니다. 로그인해주세요.' }
      });
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallbackPage;
```

### 3. 환경별 설정

#### 개발 환경 (로컬)

`.env.local` 파일에 추가:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Supabase Dashboard에서 개발용 Redirect URL 추가:

```
http://localhost:5173/*
http://localhost:3000/*
```

#### 프로덕션 환경

Vercel 또는 배포 플랫폼의 환경 변수 설정:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. 테스트 방법

1. **회원가입 테스트**
   - `/signup` 페이지에서 새 계정 생성
   - 이메일 인증 안내 페이지로 리다이렉트 확인
   - 이메일 확인

2. **이메일 인증 테스트**
   - 받은 이메일의 "이메일 인증하기" 버튼 클릭
   - 올바른 도메인으로 리다이렉트되는지 확인
   - 인증 완료 후 로그인 페이지로 이동 확인

3. **로그인 테스트**
   - 인증 완료 메시지 표시 확인
   - 정상적으로 로그인 가능한지 확인

### 5. 추가 개선사항

#### Magic Link 로그인 설정 (선택사항)

비밀번호 없이 이메일로만 로그인하는 기능 추가:

```typescript
// services/authService.ts에 추가
export const signInWithMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};
```

#### 이메일 재전송 제한

스팸 방지를 위한 재전송 제한 (이미 구현됨):

- 60초 카운트다운
- 재전송 버튼 비활성화

### 6. 주의사항

1. **도메인 설정**
   - Supabase의 Redirect URL에 실제 프로덕션 도메인이 포함되어야 함
   - 와일드카드 (`/*`) 사용으로 모든 경로 허용

2. **이메일 전송 제한**
   - Supabase 무료 플랜: 시간당 3개 이메일
   - 프로덕션에서는 SMTP 설정 권장

3. **보안**
   - 이메일 인증 링크는 24시간 후 만료
   - 한 번 사용하면 무효화됨

### 7. 트러블슈팅

#### "Email not confirmed" 에러

- 이메일 인증을 완료하지 않은 경우
- 해결: 이메일 재전송 또는 새로 회원가입

#### 리다이렉트 URL 에러

- Supabase Dashboard의 Redirect URLs 설정 확인
- 프로토콜 (https://) 포함 여부 확인

#### 이메일이 오지 않는 경우

- 스팸 폴더 확인
- Supabase 이메일 전송 제한 확인
- SMTP 설정 고려
