## 구글 캘린더 연동/동기화 계획

### 목표

- OAuth 흐름/Edge Function 연계를 안전/명확하게, 에러 처리 강화
- 동기화 진행 상태/결과 UI 개선, 재시도/백오프 전략

### 중복 방지/참조

- 변이 상태/토스트/캐시 무효화는 `PLAN_calendar-data.md`의 패턴을 따릅니다.
- UI 구성/토큰은 `PLAN_theme.md`를 따릅니다.

### 현황

- `GoogleCalendarIntegration`: OAuth URL 구성 후 리다이렉트
- `GoogleCalendarSync`: Edge Function `sync-google-calendar` 호출, 결과 텍스트 표기

### 개선안

1. 상태/토스트
   - React Query 변이 상태 + 공통 토스트 훅 사용, 에러/성공 메시지 일원화

2. 백오프/재시도
   - 재시도 옵션(min-delay backoff), 장시간 동기화 시 폴링 혹은 서버사이드 이벤트로 진행률 표시 고려

3. 권한 범위/보안
   - 최소 권한 범위 설정 재검토, state 파라미터 검증, Supabase Edge Function에서 CSRF/state 체크

4. 동기화 후 캐시 무효화
   - 성공 시 이벤트 캐시 invalidate (선택된 캘린더 전부)

### 작업 순서

- 변이 훅 랩핑 + 토스트/상태 적용 → 진행률/결과 UI → 캐시 invalidation 연결
