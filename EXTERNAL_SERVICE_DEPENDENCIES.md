# External Service Dependencies

목표: 외부 의존성, 자격증명, 배포 파이프라인, 장애 대응을 한 파일로 관리.

> 범위: GitHub Actions, Vercel, Supabase(Edge Functions), Google Cloud Console, Resend, OpenAI API

---

## 0. 운영 원칙

- **단일 진실원본(SSOT)**: 이 문서와 `.env.example`가 기준.
- **환경 분리**: `dev`/`prod` 기준. 필요 시 `preview` 추가.
- **키 로테이션 표준화**: 반기 1회 또는 유출 의심 시 즉시.
- **권한 최소화**: 서비스 계정은 역할 최소화. 개인 키 사용 금지.
- **감사 가능성**: 모든 변경은 Issue + PR로 추적.

---

## 1. 아키텍처 개요

```
GitHub (main push)
  └─ GitHub Actions build
      └─ Vercel Deploy (projects/landing, projects/calendar)
          └─ 런타임 ENV 로드 (VITE_*)
Supabase (DB + Auth + Edge Functions)
  ├─ google-auth              → Google Cloud OAuth Client
  ├─ sync-google-calendar     → Google Calendar API
  ├─ send-calendar-invitation → Resend (Email)
  └─ agent-chat               → OpenAI API
관찰(Observability): Vercel Logs, Supabase Logs, Resend Dashboard, OpenAI Usage
```

---

## 2. 환경 매트릭스

| 항목       | dev                                 | prod                                | 비고                            |
| ---------- | ----------------------------------- | ----------------------------------- | ------------------------------- |
| Git 브랜치 | feature/\*, dev                     | main                                | main 보호 필요                  |
| CI 트리거  | PR→dev, push→dev                    | push→main                           | PR 체크 필수                    |
| 빌드 대상  | projects/landing, projects/calendar | projects/landing, projects/calendar | Workspace 기준                  |
| 배포       | Vercel `Development`                | Vercel `Production`                 | 같은 프로젝트 내 환경 분리 권장 |
| ENV 보관   | GitHub Actions Secrets              | GitHub Actions Secrets              | 레포 레벨                       |
| 런타임 ENV | Vercel Env(Development)             | Vercel Env(Production)              | `VITE_*` 노출 주의              |
| DB         | Supabase project (dev)              | Supabase project (prod)             | 분리 권장                       |

---

## 3. 자격증명 인벤토리

> 저장 위치와 소유자 명시. 만료/회수 절차 포함.

### 3.1 GitHub Actions Secrets

| 키                           | 용도                 | 위치                         | 소유  | 로테이션                  |
| ---------------------------- | -------------------- | ---------------------------- | ----- | ------------------------- |
| `VERCEL_ORG_ID`              | Vercel 조직 식별     | GitHub→Repo→Settings→Secrets | Owner | 변경 드묾                 |
| `VERCEL_PROJECT_ID_CALENDAR` | calendar 앱 배포     | 동일                         | Owner | 프로젝트 변경 시 업데이트 |
| `VERCEL_PROJECT_ID_LANDING`  | landing 앱 배포      | 동일                         | Owner | 프로젝트 변경 시 업데이트 |
| `VERCEL_TOKEN`               | Vercel API 배포 토큰 | 동일                         | Owner | 분기 1회 재발급 권장      |
| `VITE_SUPABASE_URL`          | Supabase URL         | 동일                         | Owner | 변경 없음                 |
| `VITE_SUPABASE_ANON_KEY`     | Supabase anon 키     | 동일                         | Owner | 반기 1회 회전             |

### 3.2 Vercel Environment Variables

| 키                       | 환경     | 용도                | 소유  | 출처                 |
| ------------------------ | -------- | ------------------- | ----- | -------------------- |
| `VITE_GOOGLE_CLIENT_ID`  | Dev/Prod | OAuth 클라이언트 ID | Owner | Google Cloud Console |
| `VITE_SUPABASE_URL`      | Dev/Prod | Supabase URL        | Owner | Supabase             |
| `VITE_SUPABASE_ANON_KEY` | Dev/Prod | anon 키             | Owner | Supabase             |

### 3.3 Supabase Edge Functions 환경 변수

Edge Functions에서 사용하는 환경 변수는 Supabase Dashboard에서 직접 설정합니다.

| 키                          | 용도                      | 소유  | 사용 함수                         |
| --------------------------- | ------------------------- | ----- | --------------------------------- |
| `SUPABASE_URL`              | Supabase 프로젝트 URL     | Owner | 모든 함수                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키   | Owner | 모든 함수                         |
| `GOOGLE_CLIENT_ID`          | OAuth 클라이언트 ID       | Owner | google-auth, sync-google-calendar |
| `GOOGLE_CLIENT_SECRET`      | OAuth 클라이언트 Secret   | Owner | google-auth, sync-google-calendar |
| `RESEND_API_KEY`            | Resend 이메일 발송 키     | Owner | send-calendar-invitation          |
| `OPENAI_API_KEY`            | OpenAI API 키             | Owner | agent-chat                        |
| `FRONTEND_URL`              | 프론트엔드 리디렉션 URL   | Owner | google-auth (인증 후 리디렉션)    |
| `ENVIRONMENT` (선택)        | 환경 구분 (production 등) | Owner | agent-chat (디버깅 로그 제어)     |

### 3.4 외부 서비스 자격증명

| 서비스       | 항목                                         | 위치                      | 소유  | 로테이션                             |
| ------------ | -------------------------------------------- | ------------------------- | ----- | ------------------------------------ |
| Google Cloud | OAuth Client(ID/Secret), 승인된 리디렉션 URI | GCP Console               | Owner | 비정상 트래픽 시 회전                |
| Resend       | API Key, 도메인 인증                         | Resend Dashboard          | Owner | 분기 1회 회전                        |
| OpenAI       | API Key, Org                                 | OpenAI Dashboard          | Owner | 월 1회 회전 권장                     |
| Supabase     | Service Role, anon 키                        | Supabase Project Settings | Owner | Service Role 보관 강화(1Password 등) |

---

## 4. 서비스별 런북

### 4.1 Google OAuth (`google-auth` Edge Function)

- **목적**: Google 로그인 토큰 교환.
- **의존성**: Google Cloud OAuth Client, 승인된 Redirect URI.
- **설정**:
  - Redirect URI: `https://<supabase-project>.supabase.co/functions/v1/google-auth` 또는 **커스텀 도메인 프록시** 사용 시 해당 경로 등록.
  - 클라이언트 ID는 프론트(`VITE_GOOGLE_CLIENT_ID`)에 주입.

- **테스트**: 로컬/Dev에서 OAuth 동작 확인 → Supabase Logs 확인.
- **장애 포인트**: 승인되지 않은 URI, 콘센트 스크린 미검수, 쿼터 초과.
- **복구**: GCP에 URI 추가→재시도. 토큰 교환 실패는 로그로 재현.

### 4.2 Google Calendar Sync (`sync-google-calendar`)

- **목적**: 사용자 캘린더 데이터 refetch.
- **의존성**: Google Calendar API, 사용자 동의 스코프.
- **운영**: 주기적 트리거(크론) 또는 사용자 액션 트리거. 실패 시 재시도 큐.
- **장애 포인트**: 토큰 만료/철회, API 할당량, 429/5xx.
- **복구**: Refresh Token 재획득, 지수 백오프, 실패 DLQ 테이블 확인.

### 4.3 Invite Email (`send-calendar-invitation`)

- **목적**: 캘린더 멤버 초대 메일 발송.
- **의존성**: Resend API, 발신 도메인 인증.
- **설정**: Resend 도메인 DNS 설정(TXT/MX/CNAME), 발신 주소 표준화 `noreply@<domain>`.
- **모니터링**: Resend Dashboard에서 배달률/바운스 확인.
- **장애 포인트**: 도메인 미인증, API 키 만료, 스팸 필터.
- **복구**: API 키 재발급, 템플릿 단순화, 바운스 유형별 대응.

### 4.4 Agent Chat (`agent-chat`)

- **목적**: AI 에이전트 대화 처리.
- **의존성**: OpenAI API, 모델 버전.
- **운영**: 요청 타임아웃 설정, 비용 모니터링(OpenAI Usage).
- **장애 포인트**: 레이트리밋, 모델 변경, 비용 초과.
- **복구**: 재시도 정책, 폴백 모델, 하드 쿼터 설정.

---

## 5. 배포 파이프라인

1. **Trigger**: `main` push → GitHub Actions
2. **Build**: workspace 빌드(`projects/landing`, `projects/calendar`)
3. **Deploy**: Vercel CLI/API로 각 프로젝트 배포
4. **Post**: Vercel 로그 확인, 상태 코멘트

### 필수 체크리스트

- [ ] Actions Secrets 최신성 확인
- [ ] Vercel Env와 Actions Env 불일치 없음
- [ ] Supabase 마이그레이션 적용
- [ ] Edge Functions 버전 태깅

---

## 6. 키 로테이션 절차(공통)

1. 새 키 발급(Dashboard)
2. **dev**에 적용→스모크 테스트
3. GitHub Actions Secrets 교체 → 새 배포
4. Vercel Env 교체 → 리디플로이
5. Edge Functions 재배포
6. 구키 폐기 및 로그 관찰(24h)

---

## 7. 건강 점검(Health Checks)

| 체크                | 방법                               | 주기   |
| ------------------- | ---------------------------------- | ------ |
| OAuth Redirect 정상 | 테스트 계정 로그인 → 200/토큰 확인 | 주 1회 |
| Resend 배달률       | Dashboard Delivery Rate>98%        | 주 1회 |
| OpenAI 비용         | Usage 대시보드 알림 임계치         | 매일   |
| Supabase 에러율     | 프로젝트 로그 4xx/5xx              | 매일   |
| Vercel 5xx          | 프로젝트 오류율                    | 매일   |

---

## 8. 안전 가드레일

- `VITE_*` 변수는 클라이언트 노출 가능. 민감 정보 금지.
- Service Role 키는 서버 전용 저장소에만 보관.
- Edge Function에 **레이트리밋**과 **타임아웃** 설정.
- 배포 전 DB 마이그레이션 dry-run.

---

## 9. 부록: `.env.example`

```bash
# Frontend (Vite) - Vercel Environment Variables에 설정
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com

# Edge Functions - Supabase Dashboard에서 설정
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
RESEND_API_KEY=re_xxxxx
OPENAI_API_KEY=sk-xxxxx
FRONTEND_URL=https://app.checkmate-calendar.com
ENVIRONMENT=production
```
