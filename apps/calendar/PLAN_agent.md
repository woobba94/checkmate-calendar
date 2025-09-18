## 에이전트 패널(대화/명령) 설계 계획

### 목표

- 메시지 상태/스토어 도입, 전송/스트리밍/이력 관리
- 캘린더 생성/이벤트 추가 등 명령을 데이터 훅과 안전하게 연동

### 중복 방지/참조

- 이벤트 변이는 `PLAN_calendar-data.md`의 변이 훅 전략을 재사용합니다.
- UI 컴포넌트/토큰 사용은 `PLAN_theme.md`를 따릅니다.

### 현황 이슈

- `AgentHistory`는 임시 배열, `AgentInput`은 콘솔 출력만 수행

### 설계 제안

1. 상태 관리
   - 경량 Zustand 또는 React Context로 대화 스토어 구현
   - 메시지 엔티티: id, role(user|assistant), content, createdAt, toolCalls(optional)

2. 실행 파이프라인
   - 서버 함수(예: Edge Function/Route) 호출로 LLM 응답 스트리밍 수신
   - 함수 호출 패턴: intent 파싱 → 캘린더/이벤트 변이 훅 호출 → 결과 메시지 반영

3. UI
   - 이력 가상 스크롤(Optional), 전송 중 상태, 에러 표시

### 작업 순서

- 스토어/타입 추가 → 입력/히스토리 연결 → 서버 연동 스텁 → 변이 훅 연동
