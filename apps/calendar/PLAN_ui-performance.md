## UI/성능 최적화 계획

### 목표

- FullCalendar 리사이즈/전환 성능 향상, 레이아웃 전환 부드러움 개선
- 불필요한 리렌더 줄이기, 메모이제이션/가상화 고려

### 중복 방지/참조

- 스타일/토큰/컴포넌트 사용 원칙은 `PLAN_theme.md`를 참조합니다.

### 현황 이슈

- 사이드바/패널 토글 시 `setTimeout(320ms)`로 `updateSize` 호출 → 타이밍 의존
- 스크롤 기반 월 전환은 여러 `setTimeout` 사용 → 브라우저 스케줄러와 충돌 가능

### 개선안

1. 리사이즈 안정화
   - `ResizeObserver`로 컨테이너 크기 변화를 관찰해 `calendarApi.updateSize()` 호출
   - `transitionend` 이벤트로 CSS 전환 종료 시점에 1회 보정 호출

2. 스크롤 네비게이션 디바운스
   - `requestAnimationFrame`/시간 스로틀로 전환 빈도 제어, 불필요한 preventDefault 최소화
   - 키보드/버튼 내비게이션도 제공하여 접근성 향상

3. 메모이제이션
   - `mergedEvents` 계산에 `useMemo` 적용, props 비교 최적화(React.memo)

4. 번들 최적화(선택)
   - FullCalendar 플러그인 동적 임포트 검토, 에이전트 패널 코드 스플리팅

### 작업 순서

- `Calendar.tsx`에 ResizeObserver 추가, transitionend 핸들링 도입
- 스크롤 처리기를 rAF 기반 스로틀로 교체
- `DashboardPage` 메모이제이션 적용 및 React.memo 적용 후보 식별

### 검증 지표

- 사이드바 토글 시 프레임 드롭 감소, long task 비율 감소
