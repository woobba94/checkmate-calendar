## 아키텍처 전반 리팩토링/성능 최적화 계획

### 문서 역할/참조

- 이 문서는 상위 방향성과 표준만 정의합니다. 구현 세부사항은 다음 문서를 참조하세요.
  - 데이터 계층/이벤트 병합: `PLAN_calendar-data.md`
  - UI 성능/리사이즈/스크롤: `PLAN_ui-performance.md`
  - 인증/권한: `PLAN_auth.md`
  - 테마/스타일 표준(shadcn): `PLAN_theme.md`
  - 구글 연동/동기화: `PLAN_google-integration.md`
  - 에이전트 패널: `PLAN_agent.md`
  - 접근성/테스트: `PLAN_accessibility-testing.md`
  - 일정: `PLAN_timeline.md`

### 스타일 표준(shadcn)

- 컴포넌트는 shadcn/ui를 우선 사용하고, 가능한 경우 기존 shadcn 컴포넌트를 확장합니다.
- 색/간격/타이포 등은 shadcn 토큰과 프로젝트의 CSS 변수(`styles/_color-tokens.scss`, `styles/globals.scss`)를 사용합니다.
- 임의의 hex/inline-style 대신 토큰 기반 유틸리티 클래스를 사용합니다.
- 애니메이션은 CSS 전환/키프레임을 우선 적용합니다(필요 시 JS는 보조로만 사용) .

### 목표

- **일관된 데이터 흐름**: React Query 캐시 전략 정립, 중복 fetch 제거, optimistic update 도입
- **컴포넌트 책임 분리**: `DashboardPage` 과도한 상태/로직 분리, 재사용 가능한 훅/유틸 계층화
- **UI 반응성 개선**: 레이아웃 전환/리사이즈 시 불필요한 리렌더/강제 updateSize 최소화
- **번들/네트워크 최적화**: 필요 시 코드 스플리팅, 불필요한 런타임 의존성 제거

### 현재 구조 요약

- 진입: `src/main.tsx` → `QueryClientProvider`/Theme `Provider` → `App` → `AppMain (BrowserRouter)`
- 라우팅: `/` 보호 라우트로 `DashboardPage`, 인증은 `AuthContext` + `authService`
- 데이터: 캘린더/이벤트는 `useCalendarData`(React Query) + 개별 `service`(Supabase)
- UI: FullCalendar 기반 `components/calendar/core/Calendar`, 헤더, 사이드바, 모달, 에이전트 패널

### 문제점(핫스팟)

※ 상세 해결책은 각 하위 PLAN 문서에 기술되어 있습니다.

1. 데이터 패칭 중복/불일치
   - `useCalendarData`에서 선택된 1개 캘린더의 `events`를 관리하는 한편, `DashboardPage`에서 모든 캘린더 이벤트를 `Promise.all`로 재조회하여 `eventsByCalendar`를 별도 상태로 관리함 → 캐시/소스 오브 트루스가 2곳.
   - `refetchEvents` 또한 동일 로직 반복. React Query 캐시 무시하는 수동 상태 동기화 비용 증가.

2. 뷰/레이아웃 전환 시 강제 리사이즈 타이밍 의존
   - 사이드바/에이전트 패널 토글 시 `setTimeout(320ms)`로 FullCalendar `updateSize` 호출. 애니메이션 지속시간과 결합되어 타이밍 드리프트 위험.

3. Theme/ColorMode 훅/Provider 중복
   - `components/ui/provider`의 NextThemesProvider와 `hooks/useTheme`, `hooks/useColorMode`가 혼재. 스토리지 키/소스 불일치 여지.

4. 통신 계층의 인증 반복 조회
   - `eventService`/`calendarService`가 매 호출마다 `supabase.auth.getUser()`로 사용자 확인. 다수 병렬 호출 시 오버헤드.

5. 타입/필드 포맷 불일치 가능성
   - `CalendarEvent`의 `start/end`가 string|Date 혼용. FullCalendar 변환 시 포맷 일관성 관리 필요.

### 리팩토링 방향

1. 데이터 계층 정리
   - 전략 A: "선택형"과 "다중 병합"을 분리. 대시보드에서 필요한 것은 다중 캘린더 병합 이벤트이므로, React Query 멀티 쿼리(useQueries) 혹은 서버 함수 `getEventsForCalendars(calendarIds)` 제공으로 단일 쿼리 키로 수집.
   - 전략 B: `useCalendarData`는 캘린더 목록/생성만 담당, 이벤트는 별도 훅 `useEventsByCalendars(selectedIds)`로 분리. 캐시 키: `['events','byCalendars',selectedIds.sort().join(',')]`.
   - 낙관적 업데이트: 생성/수정/삭제 시 `onMutate`로 캐시 병합/롤백 구현, `invalidateQueries` 남발 축소.

2. FullCalendar 리사이즈 안정화
   - ResizeObserver로 컨테이너 크기 변화를 감지해 `updateSize` 호출. CSS 트랜지션 종료 이벤트(`transitionend`)를 활용해 타이밍 의존 제거.

3. 테마 단일 소스화
   - NextThemes 기반으로 통일: `useTheme` 하나로 정리, `useColorMode`는 제거 혹은 래퍼로 유지하되 내부 소스 동일화. 스토리지 키/attribute 일치.

4. 인증 컨텍스트 활용
   - 서비스 계층에서 매번 `getUser()` 호출 대신, `AuthContext`에서 사용자 id를 훅/컨텍스트로 주입받아 호출자에서 전달. 서버 보안은 RLS로 담보.

5. 타입 일관성
   - 서비스 레이어 I/O는 ISO 문자열로 규격화. 컴포넌트 경계에서 Date 변환. 유틸 `ensureIsoString(date|str)` 도입.

### 단계별 작업

상세 일정은 `PLAN_timeline.md`를 따릅니다. 각 단계의 구현 지침은 해당 PLAN 문서를 참조하세요.

Step 1: 데이터 훅 분리/정비

- `useCalendarData`: 캘린더 목록/생성만 유지
- 신규 `useEventsByCalendars(selectedIds)` 구현 (React Query + 합성)
- 이벤트 변이 훅 `useEventMutations()`로 분리, 낙관적 업데이트 추가

Step 2: `DashboardPage` 정리

- 로컬 `eventsByCalendar`/`refetchEvents` 제거 → 훅 기반 단일 소스 사용
- `mergedEvents` 메모이제이션(useMemo) 적용

Step 3: FullCalendar 리사이즈 개선

- `ResizeObserver` + `transitionend` 이벤트로 `updateSize` 호출
- 스크롤 네비게이션 디바운스는 requestAnimationFrame + passive 이벤트 정책 재검토

Step 4: 테마 API 정리

- `useTheme` 만 남기고, 사이드바/헤더는 해당 훅 사용. 스토리지 키 `checkmate-theme` 유지.

Step 5: 서비스 계층 사용자 주입

- `createEvent/updateEvent/deleteEvent/createCalendar`에 `userId` 인자 선택 지원(호출자 전달) 후 내부 조회 제거

### 지표/검증

- 렌더 커밋 수/시간, 네트워크 호출 수, 메모리 스냅샷 비교
- 첫 진입부터 캘린더/이벤트 표시까지 TTI 감소 여부

### 리스크/롤백

- 캐시 키 변경으로 과거 캐시 무효화 필요
- 낙관적 업데이트 도입 시 롤백 정확성 테스트 필요
