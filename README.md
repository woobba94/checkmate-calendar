# 테스트 계정
admin@checkmate.com/admin
(agent limit 100/day)

# Checkmate Calendar - Monorepo

### 연동과 일정 공유가 가능한 캘린더 서비스

---

## 프로젝트 구조

이 프로젝트는 모노레포 구조로 구성되어 있습니다:

```
checkmate-calendar/
├── projects/
│   ├── landing/     # 랜딩페이지 (checkmate-calendar.com)
│   └── calendar/    # 캘린더 앱 (app.checkmate-calendar.com)
└── package.json     # 워크스페이스 설정
```

## 서비스 특징

- **누구나 사용하기 쉬운 UI/UX**
- **구글 캘린더 연동 지원** (타 캘린더 추가 연동 지원 예정)
- **유저 간 캘린더 공유 가능**
- **복수 캘린더 선택/병합 보기**
- **모바일 앱** (지원 예정)
- **다양한 위젯** (지원 예정)

## 기술 스택

- **Frontend**
  - React
  - TypeScript
  - Vite
  - React Query
  - Sass/SCSS
- **Backend/Infra**
  - Supabase (인증, DB, Edge Functions, Google Calendar 연동)
  - Vercel (FE 배포)

## 시작하기

### 전체 프로젝트 설치

```bash
npm install
```

### 개발 서버 실행

```bash
# 랜딩페이지 개발 서버
npm run dev:landing

# 캘린더 앱 개발 서버
npm run dev:calendar
```

### 빌드

```bash
# 랜딩페이지 빌드
npm run build:landing

# 캘린더 앱 빌드
npm run build:calendar
```

## 배포

각 앱은 Vercel을 통해 자동 배포됩니다:

- **랜딩페이지**: `checkmate-calendar.com`
- **캘린더 앱**: `app.checkmate-calendar.com`

GitHub Actions를 통해 각 앱의 변경사항이 있을 때만 해당 앱이 배포됩니다.

### Vercel 프로젝트 설정

1. Vercel 대시보드에서 2개의 프로젝트 생성:
   - `checkmate-calendar-landing`
   - `checkmate-calendar-app`

2. 각 프로젝트의 Root Directory 설정:
   - Landing: `projects/landing`
   - Calendar: `projects/calendar`

3. 환경 변수 설정:
   - GitHub Secrets에 다음 값들 추가:
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_LANDING_PROJECT_ID`
     - `VERCEL_CALENDAR_PROJECT_ID`

---
