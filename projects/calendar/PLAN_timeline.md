## 실행 타임라인(권장)

### Phase 1: 데이터 계층/대시보드 정리 (1~2일)

- 훅 분리(`useCalendars`, `useEventsByCalendars`, `useEventMutations`)
- `DashboardPage` 로컬 이벤트 상태 제거/치환

### Phase 2: UI 성능 (0.5~1일)

- ResizeObserver/transitionend 적용, 스크롤 스로틀 개선
- 메모이제이션 적용/React.memo 후보 정리

### Phase 3: 인증/서비스 정리 (0.5일)

- userId 인자 주입 패턴 도입, 중복 getUser 제거

### Phase 4: 테마/스플래시 정리 (0.5일)

- 테마 훅/Provider 통일, SplashScreen 개선

### Phase 5: 구글 연동/동기화 UX (0.5~1일)

- 변이 훅/토스트/진행률, 캐시 무효화 연결

### Phase 6: 에이전트 패널 기초 (1일)

- 스토어/메시지, 전송 파이프라인 스텁, UI 반영

### Phase 7: 접근성/테스트 (지속)

- 핵심 흐름 유닛/E2E 커버리지 추가
