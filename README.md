# License & Use

본 프로젝트는 포트폴리오 목적으로 공개되었습니다.  
코드 열람은 자유로우나, 사용 시에는 사전 문의 부탁드립니다.

문의: [jwj3199@gmail.com](mailto:jwj3199@gmail.com)

# 서비스 링크

- **랜딩페이지**: [~https://checkmate-calendar.com~](https://checkmate-calendar.com) 도메인 만료. [fallback 도메인](https://checkmate-calendar-landing.vercel.app/)
- **캘린더 서비스**: [~https://app.checkmate-calendar.com~](https://app.checkmate-calendar.com) 도메인 만료. -> [fallback 도메인](https://checkmate-calendar.vercel.app/)

# 테스트 계정
### ID
```
admin@checkmate.com
```
### PW
```
admin
```

※ AI 에이전트 기능은 계정당 일일 100회로 제한됩니다.

# Checkmate Calendar - Monorepo

> **⚠️ 개발 중인 프로젝트입니다**  
> 현재 MVP 단계로, 핵심 기능은 동작하나 프로덕션 레벨의 안정성과 완성도를 위해 지속적으로 개선 중입니다.

### AI 에이전트 기반 스마트 캘린더 서비스

구글 캘린더 연동과 일정 공유가 가능한 웹 캘린더 애플리케이션입니다.  
자연어로 대화하는 AI 에이전트가 일정 관리를 도와드립니다.

---

## 프로젝트 구조

이 프로젝트는 모노레포 구조로 구성되어 있습니다:

```
checkmate-calendar/
├── projects/
│   ├── landing/     # 랜딩페이지 (checkmate-calendar.com)
│   └── calendar/    # 캘린더 앱 (app.checkmate-calendar.com)
│       ├── src/
│       │   ├── components/    # UI 컴포넌트
│       │   │   ├── calendar/  # 캘린더 관련 컴포넌트
│       │   │   ├── agent/     # AI 에이전트 패널
│       │   │   └── sidebar/   # 사이드바 및 캘린더 선택기
│       │   ├── hooks/         # 커스텀 훅
│       │   ├── services/      # API 서비스 레이어
│       │   └── contexts/      # React Context
│       └── supabase/          # Supabase 설정 및 Edge Functions
└── package.json               # 워크스페이스 설정
```

## 주요 기능

### 🤖 AI 에이전트

- **자연어 일정 관리**: "내일 오후 3시에 회의 일정 추가해줘"
- **일정 조회 및 분석**: "이번 주에 어떤 일정이 있어?"
- **대화형 인터페이스**: 채팅으로 쉽게 일정 관리

### 📅 캘린더 기능

- **간소화된 뷰 모드**: 월간, Today-Tomorrow 뷰
- **간소화된 일정 추가**: 제목과 메모만으로 일정 추가
- **여러 캘린더 한눈에 보기**: 여러 캘린더를 선택해서 한 번에 확인

### 🔗 연동 기능

- **구글 캘린더 연동**: Google Calendar와 양방향 동기화 (현재 구글 클라우드 앱 인증 관련하여 비활성화)
- **캘린더 공유**: 다른 사용자와 캘린더 공유 및 협업
- **이메일 초대**: 이메일로 캘린더 초대장 발송
- _향후 지원 예정_: Outlook, Apple Calendar, Notion Calendar

### 🎨 UI/UX

- **반응형 디자인**: 데스크톱, 태블릿, 모바일 최적화 (개발 진행중)
- **다크/라이트 모드**: 테마 전환 지원 (개발 진행중)
- **직관적인 인터페이스**: 누구나 쉽게 사용할 수 있는 UI

## 기술 스택

### Frontend

- **React 19**
- **TypeScript**
- **Vite**
- **React Router**
- **React Query**
- **Sass/SCSS**
- **TailwindCSS**
- **Sshadcn/ui**
- **FullCalendar**

### Backend & Infrastructure

- **Supabase**
  - 인증 (이메일, OAuth)
  - PostgreSQL
  - RLS (Row Level Security)
  - Edge Functions (AI 에이전트, Google Calendar 연동)
- **Vercel** - Frontend 배포 모니터링 및 호스팅
- **Google Calendar API** - 구글 캘린더 연동

### AI

- **OpenAI GPT** - AI 에이전트 모델

## 개발 환경

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase (Backend)
- Vercel (Deployment)

### 개발 명령어

```bash
# 개발 서버 실행
npm run dev:landing      # 랜딩페이지
npm run dev:calendar     # 캘린더 앱

# 빌드
npm run build:landing    # 랜딩페이지 빌드
npm run build:calendar   # 캘린더 앱 빌드
```

## DB 설계

**Supabase PostgreSQL + Row Level Security (RLS)**

주요 테이블:

- `users`: 사용자 인증 정보
- `calendars`: 캘린더 메타데이터 (소유자, 색상, 공유 설정)
- `events`: 일정 정보 (제목, 시간, 설명, 캘린더 참조)
- `calendar_shares`: 캘린더 공유 관계 (소유자-공유자 매핑)
- `google_calendar_tokens`: OAuth 토큰 저장
