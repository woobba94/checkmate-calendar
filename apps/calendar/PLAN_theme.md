## 테마/컬러 모드 정리 계획

### 스타일 표준(shadcn)

- 컴포넌트는 shadcn/ui를 우선 사용하고, 가능한 경우 기존 shadcn 컴포넌트를 확장합니다.
- 색/간격/타이포 등은 shadcn 토큰과 프로젝트의 CSS 변수(`styles/_color-tokens.scss`, `styles/globals.scss`)를 사용합니다.
- 임의의 hex/inline-style 대신 토큰 기반 유틸리티 클래스를 사용합니다.

### 목표

- 테마 관리 단일화(NextThemes 기준), 스토리지 키/attribute 일치

### 현황 이슈

- `useTheme`, `useColorMode`, `Provider`가 혼재. SplashScreen은 로컬스토리지 직접 참조

### 개선안

1. 훅 표준화
   - `hooks/useTheme.ts`만 노출. `useColorMode.ts`는 내부에서 동일 소스를 래핑하거나 폐기

2. Provider 일치
   - `components/ui/provider`의 storageKey `checkmate-theme` 유지. `useTheme`도 동일 키/attribute 가정

3. SplashScreen 정리
   - NextThemes의 class를 읽어 판단하거나, 초기 theme 계산 로직을 Provider와 공유하는 util로 추출

### 작업 순서

- 훅/Provider 교차 의존 제거, SplashScreen util 사용

### 참고

- shadcn 관련 상세 컴포넌트 지침은 각 기능 PLAN에서 중복 기술하지 않고 이 문서를 참조합니다.
