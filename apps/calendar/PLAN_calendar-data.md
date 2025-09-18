## 캘린더/이벤트 데이터 계층 리팩토링 계획

### 목표

- **단일 소스**로 이벤트 병합 제공(다중 캘린더 선택 반영)
- React Query 캐시 전략 수립, **중복 fetch 제거**
- 이벤트 생성/수정/삭제 **낙관적 업데이트** 도입

### 중복 방지/참조

- UI 성능/리사이즈/스크롤은 `PLAN_ui-performance.md`를 참조합니다.
- 스타일/토큰/컴포넌트 사용 원칙은 `PLAN_theme.md`를 참조합니다.

### 현황 이슈

- `useCalendarData`는 선택된 1개 캘린더 events만 관리하는데, `DashboardPage`에서 모든 캘린더 events를 `Promise.all`로 재수집. 캐시 이점 상실, 코드 중복.

### 설계 제안

1. 훅 분리
   - `useCalendars(userId)`: 캘린더 목록/생성만 담당
   - `useEventsByCalendars(selectedIds)`: 다중 캘린더 이벤트를 하나의 배열로 병합해서 반환
     - 내부적으로 `useQueries`로 각 캘린더 id별 `getEvents` 수행하거나 서버에서 `getEventsForCalendars` 제공
     - 캐시 키: `['events','byCalendars',selectedIdsSorted]`

2. 변이 훅
   - `useEventMutations()`: create/update/delete 랩핑, 낙관적 업데이트
     - `onMutate`: 기존 캐시 스냅샷 보관, 즉시 병합 배열에 반영
     - `onError`: 스냅샷 복구
     - `onSettled`: 해당 키 invalidate

3. 타입/포맷 유틸
   - `ensureIsoString(value: string|Date): string` 유틸로 서비스 I/O 표준화

### 작업 순서

Step A: 새 훅 구현(`hooks/useCalendars.ts`, `hooks/useEventsByCalendars.ts`, `hooks/useEventMutations.ts`)
Step B: `DashboardPage`에서 로컬 `eventsByCalendar`/`refetchEvents` 제거, 새 훅 적용
Step C: `EventModal` 저장/삭제 콜백을 변이 훅으로 교체

### 성공 기준

- 네트워크 호출 수 감소, 이벤트 생성 시 즉시 UI 반영, 코드 중복 제거
