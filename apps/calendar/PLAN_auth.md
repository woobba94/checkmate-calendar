## 인증/권한 관리 개선 계획

### 목표

- 인증 상태 조회 오버헤드 축소, 서비스 계층에서 재사용성 향상
- 캘린더 멤버십/권한 체크 일관성 강화

### 중복 방지/참조

- 데이터 훅/캐시/낙관적 업데이트는 `PLAN_calendar-data.md`를 참조합니다.

### 현황 이슈

- 서비스 계층(`eventService`/`calendarService`)에서 매 호출마다 `supabase.auth.getUser()` 호출 → 다중 요청 시 비용
- 일부 API는 클라이언트에서 RLS 보안 전제로 동작하나, 호출자/컨텍스트로부터 userId 주입이 더 명확

### 개선안

1. 컨텍스트 주입
   - `AuthContext` 혹은 상위에서 획득한 `userId`를 서비스 호출자에서 인자로 전달(선택 인자)
   - 서비스 내부에서 userId 없을 때만 fallback으로 getUser()

2. 권한 헬퍼
   - `checkCalendarMembership(calendarId, userId)` 래퍼 제공 및 사용하는 컴포넌트/훅에서 선행 호출

3. 캐시
   - `['auth','user']` 쿼리에 `staleTime` 연장, focus refetch 비활성화 유지

### 작업 순서

- 서비스 함수 시그니처 확장(userId?: string)
- 호출부(Dashboard, 변이 훅 등)에서 context userId 전달

### 검증

- 다중 변이 중 중복 getUser 호출 감소, 네트워크/CPU 비용 감소
