# DB 스키마 관리 방법

## DB 스키마 파일: `schema.sql` (1개 파일)

마이그레이션 파일 여러 개 대신 **DB 스키마를 1개 파일로 관리**합니다.

### 포함 내용

1. **테이블 구조** (15개)
   - public 스키마: agent_request_logs, calendar_invitations, calendar_members, calendars, event_calendars, events, google_integrations, users
   - storage 스키마: buckets, objects, migrations 등

2. **함수** (33개)
   - public: accept_calendar_invitation, delete_old_agent_logs, handle_new_user 등
   - storage: filename, foldername, search 등 Storage 관련 유틸리티 함수

3. **인덱스** (23개)
   - 성능 최적화를 위한 모든 인덱스

4. **RLS 정책** (30개)
   - 테이블별 Row Level Security 정책
   - Storage 버킷 접근 정책 (avatars 버킷 포함)

5. **트리거**
   - 테이블 변경 시 자동 실행되는 트리거

6. **Foreign Key, Constraint**
   - 테이블 간 관계 및 제약조건

## DB 구조 업데이트 방법

### DB 변경 후 스키마 파일 업데이트

```bash
cd projects/calendar
npx supabase db dump -f supabase/schema.sql --schema public --schema storage
```

이 명령어 하나로:

- `schema.sql` 파일이 최신 DB 구조로 **덮어쓰기됨**
- Storage 정책도 포함됨
- 1개 파일로 전체 관리

### 새 에이전트 세션에서 DB 구조 파악

```bash
# schema.sql 파일 읽기
cat supabase/schema.sql
```

또는 `DATABASE_OVERVIEW.md` 참고

## 파일 구조

```
supabase/
├── schema.sql              # 전체 DB 스키마 (이것만 보면 됨)
├── STORAGE_SCHEMA.md       # Storage 설명 (참고용)
├── DATABASE_OVERVIEW.md    # DB 전체 개요 (참고용)
└── migrations/            # (사용 안 함 - 비워둠)
```

## 주의사항

- **migrations/ 폴더는 무시하세요** - 마이그레이션 방식 안 씁니다
- **schema.sql 하나만 관리**하면 됩니다
- DB 변경할 때마다 위 명령어로 업데이트하세요
