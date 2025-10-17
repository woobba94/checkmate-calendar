-- =====================================================
-- Checkmate Calendar - Database Schema
-- =====================================================
-- 생성일: 2024-10-17
-- 설명: 캘린더 애플리케이션의 전체 데이터베이스 스키마
--       - 캘린더 및 이벤트 관리
--       - 사용자 인증 및 권한 관리
--       - 구글 캘린더 연동
--       - AI 에이전트 통합
-- =====================================================

-- =====================================================
-- 테이블 정의
-- =====================================================

-- AI 에이전트 요청 로그 (Rate Limiting용)
create table "public"."agent_request_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "user_email" text not null,
    "requested_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."agent_request_logs" enable row level security;

-- 캘린더 초대 정보
-- 이메일로 다른 사용자를 캘린더에 초대할 때 사용
create table "public"."calendar_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "calendar_id" uuid not null,
    "inviter_id" uuid not null,
    "invitee_email" text not null,
    "role" text not null default 'member'::text,  -- admin | member
    "status" text not null default 'pending'::text,  -- pending | accepted | rejected
    "invitation_token" text not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "expires_at" timestamp with time zone default (now() + '7 days'::interval),  -- 7일 후 만료
    "calendar_name" text
);

alter table "public"."calendar_invitations" enable row level security;

-- 캘린더 멤버 (다대다 관계)
-- 한 캘린더에 여러 사용자, 한 사용자가 여러 캘린더 소속 가능
create table "public"."calendar_members" (
    "id" uuid not null default gen_random_uuid(),
    "calendar_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'member'::text,  -- owner | admin | member
    "created_at" timestamp with time zone default now()
);

alter table "public"."calendar_members" enable row level security;

-- 캘린더 메타데이터
create table "public"."calendars" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "color" character varying(7) default '#02B1F0'::character varying  -- HEX 색상 (#RRGGBB)
);

alter table "public"."calendars" enable row level security;

-- 이벤트-캘린더 관계 (다대다 관계)
-- 하나의 이벤트가 여러 캘린더에 표시될 수 있음 (공유)
create table "public"."event_calendars" (
    "event_id" uuid not null,
    "calendar_id" uuid not null,
    "google_event_id" text,  -- 구글 캘린더 연동 시 사용
    "google_updated" timestamp with time zone,  -- 구글 캘린더 최종 수정 시간
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."event_calendars" enable row level security;

-- 이벤트 (일정)
create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "start" timestamp with time zone not null,
    "end" timestamp with time zone,
    "allDay" boolean not null default true,
    "description" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."events" enable row level security;

-- 구글 캘린더 OAuth 토큰 저장
create table "public"."google_integrations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "access_token" text not null,  -- 구글 액세스 토큰
    "refresh_token" text not null,  -- 구글 리프레시 토큰
    "expires_at" timestamp with time zone not null,
    "google_email" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "sync_token" text  -- 증분 동기화용 토큰
);

alter table "public"."google_integrations" enable row level security;

-- 사용자 정보 (auth.users의 확장 테이블)
-- auth.users는 Supabase 관리, public.users는 애플리케이션에서 추가 정보 관리
create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "display_name" text,  -- 사용자 표시 이름
    "avatar_url" text,  -- 프로필 이미지 URL
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);

alter table "public"."users" enable row level security;

-- =====================================================
-- 인덱스 (성능 최적화)
-- =====================================================

-- Primary Keys
CREATE UNIQUE INDEX agent_request_logs_pkey ON public.agent_request_logs USING btree (id);
CREATE UNIQUE INDEX calendar_invitations_pkey ON public.calendar_invitations USING btree (id);
CREATE UNIQUE INDEX calendar_members_pkey ON public.calendar_members USING btree (id);
CREATE UNIQUE INDEX calendars_pkey ON public.calendars USING btree (id);
CREATE UNIQUE INDEX event_calendars_pkey ON public.event_calendars USING btree (event_id, calendar_id);
CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);
CREATE UNIQUE INDEX google_integrations_pkey ON public.google_integrations USING btree (id);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

-- Unique Constraints
CREATE UNIQUE INDEX calendar_invitations_invitation_token_unique ON public.calendar_invitations USING btree (invitation_token);
CREATE UNIQUE INDEX calendar_members_calendar_id_user_id_key ON public.calendar_members USING btree (calendar_id, user_id);
CREATE UNIQUE INDEX event_calendars_google_unique ON public.event_calendars USING btree (calendar_id, google_event_id);
CREATE UNIQUE INDEX google_integrations_user_id_unique ON public.google_integrations USING btree (user_id);

-- Performance Indexes
-- AI 에이전트 로그: 사용자별 요청 조회 최적화
CREATE INDEX idx_agent_request_logs_user_email ON public.agent_request_logs USING btree (user_email);
CREATE INDEX idx_agent_request_logs_user_id_date ON public.agent_request_logs USING btree (user_id, requested_at DESC);

-- 캘린더 초대: 빠른 조회를 위한 인덱스
CREATE INDEX idx_calendar_invitations_calendar_id ON public.calendar_invitations USING btree (calendar_id);
CREATE INDEX idx_calendar_invitations_email ON public.calendar_invitations USING btree (invitee_email);
CREATE INDEX idx_calendar_invitations_email_status ON public.calendar_invitations USING btree (invitee_email, status);
CREATE INDEX idx_calendar_invitations_expires_at ON public.calendar_invitations USING btree (expires_at);
CREATE INDEX idx_calendar_invitations_token ON public.calendar_invitations USING btree (invitation_token);

-- 캘린더 멤버: 사용자별 캘린더 조회 최적화
CREATE INDEX calendar_members_user_id_idx ON public.calendar_members USING btree (user_id);

-- 이벤트-캘린더 관계: 양방향 조회 최적화
CREATE INDEX idx_event_calendars_calendar ON public.event_calendars USING btree (calendar_id);
CREATE INDEX idx_event_calendars_event ON public.event_calendars USING btree (event_id);
CREATE INDEX idx_event_calendars_google ON public.event_calendars USING btree (calendar_id, google_event_id) WHERE (google_event_id IS NOT NULL);

-- 이벤트: 날짜별, 작성자별 조회 최적화
CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);
CREATE INDEX idx_events_start ON public.events USING btree (start);

-- 사용자: 이메일 조회 최적화
CREATE INDEX users_email_idx ON public.users USING btree (email);

-- =====================================================
-- 제약조건 (Constraints)
-- =====================================================

-- Primary Keys
alter table "public"."agent_request_logs" add constraint "agent_request_logs_pkey" PRIMARY KEY using index "agent_request_logs_pkey";
alter table "public"."calendar_invitations" add constraint "calendar_invitations_pkey" PRIMARY KEY using index "calendar_invitations_pkey";
alter table "public"."calendar_members" add constraint "calendar_members_pkey" PRIMARY KEY using index "calendar_members_pkey";
alter table "public"."calendars" add constraint "calendars_pkey" PRIMARY KEY using index "calendars_pkey";
alter table "public"."event_calendars" add constraint "event_calendars_pkey" PRIMARY KEY using index "event_calendars_pkey";
alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";
alter table "public"."google_integrations" add constraint "google_integrations_pkey" PRIMARY KEY using index "google_integrations_pkey";
alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

-- Foreign Keys & Cascade Deletes
-- 사용자 삭제 시 관련 로그도 함께 삭제
alter table "public"."agent_request_logs" add constraint "agent_request_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."agent_request_logs" validate constraint "agent_request_logs_user_id_fkey";

-- 캘린더 삭제 시 초대도 함께 삭제
alter table "public"."calendar_invitations" add constraint "calendar_invitations_calendar_id_fkey" FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE not valid;
alter table "public"."calendar_invitations" validate constraint "calendar_invitations_calendar_id_fkey";

-- 캘린더 삭제 시 멤버 관계도 함께 삭제
alter table "public"."calendar_members" add constraint "calendar_members_calendar_id_fkey" FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE not valid;
alter table "public"."calendar_members" validate constraint "calendar_members_calendar_id_fkey";

-- 사용자 삭제 시 멤버 관계도 함께 삭제
alter table "public"."calendar_members" add constraint "calendar_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;
alter table "public"."calendar_members" validate constraint "calendar_members_user_id_fkey";

-- 캘린더/이벤트 삭제 시 관계도 함께 삭제
alter table "public"."event_calendars" add constraint "event_calendars_calendar_fkey" FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE not valid;
alter table "public"."event_calendars" validate constraint "event_calendars_calendar_fkey";
alter table "public"."event_calendars" add constraint "event_calendars_event_fkey" FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE not valid;
alter table "public"."event_calendars" validate constraint "event_calendars_event_fkey";

-- auth.users 삭제 시 public.users도 함께 삭제
alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."users" validate constraint "users_id_fkey";

-- Unique Constraints
alter table "public"."calendar_invitations" add constraint "calendar_invitations_invitation_token_unique" UNIQUE using index "calendar_invitations_invitation_token_unique";
alter table "public"."calendar_members" add constraint "calendar_members_calendar_id_user_id_key" UNIQUE using index "calendar_members_calendar_id_user_id_key";
alter table "public"."event_calendars" add constraint "event_calendars_google_unique" UNIQUE using index "event_calendars_google_unique";
alter table "public"."google_integrations" add constraint "google_integrations_user_id_unique" UNIQUE using index "google_integrations_user_id_unique";

-- Check Constraints (데이터 유효성 검증)
-- 초대 role은 admin 또는 member만 가능
alter table "public"."calendar_invitations" add constraint "calendar_invitations_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text]))) not valid;
alter table "public"."calendar_invitations" validate constraint "calendar_invitations_role_check";

-- 초대 상태는 pending, accepted, rejected만 가능
alter table "public"."calendar_invitations" add constraint "calendar_invitations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text]))) not valid;
alter table "public"."calendar_invitations" validate constraint "calendar_invitations_status_check";

-- 색상은 HEX 형식(#RRGGBB)만 가능
alter table "public"."calendars" add constraint "check_color_format" CHECK (((color)::text ~ '^#[0-9A-Fa-f]{6}$'::text)) not valid;
alter table "public"."calendars" validate constraint "check_color_format";

-- =====================================================
-- 함수 (Functions)
-- =====================================================

set check_function_bodies = off;

-- 캘린더 초대 수락 함수
-- 초대 토큰과 사용자 ID로 캘린더 멤버로 추가
CREATE OR REPLACE FUNCTION public.accept_calendar_invitation(p_invitation_token text, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
  v_calendar_id UUID;
BEGIN
  -- 사용자 이메일 조회
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 초대 정보 조회 및 검증 (FOR UPDATE로 동시성 제어)
  SELECT * INTO v_invitation
  FROM calendar_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW())
  FOR UPDATE;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  -- 이메일 검증 (초대받은 이메일과 일치하는지)
  IF v_invitation.invitee_email != v_user_email THEN
    RAISE EXCEPTION 'This invitation is for a different email address';
  END IF;

  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM calendar_members
    WHERE calendar_id = v_invitation.calendar_id
      AND user_id = p_user_id
  ) THEN
    -- 이미 멤버면 초대 상태만 업데이트
    UPDATE calendar_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id
    WHERE id = v_invitation.id;
    
    RETURN v_invitation.calendar_id;
  END IF;

  -- calendar_members에 추가
  INSERT INTO calendar_members (calendar_id, user_id, role)
  VALUES (v_invitation.calendar_id, p_user_id, v_invitation.role);

  -- 초대 상태 업데이트
  UPDATE calendar_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = p_user_id
  WHERE id = v_invitation.id;

  v_calendar_id := v_invitation.calendar_id;
  
  RETURN v_calendar_id;
END;
$function$
;

-- 오래된 AI 에이전트 로그 삭제 함수
-- 7일 이상 된 로그를 정리 (Cron Job에서 호출)
CREATE OR REPLACE FUNCTION public.delete_old_agent_logs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM agent_request_logs 
  WHERE requested_at < NOW() - INTERVAL '7 days';
END;
$function$
;

-- 신규 사용자 처리 함수 (트리거 함수)
-- auth.users에 새 사용자 생성 시 public.users에 자동으로 레코드 생성
-- display_name은 user_metadata에 있으면 사용, 없으면 이메일 사용
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$
;

-- created_by 자동 설정 함수 (사용하지 않음 - 참고용)
-- 향후 트리거로 사용할 수 있음
CREATE OR REPLACE FUNCTION public.set_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$function$
;

-- =====================================================
-- 권한 (Grants)
-- Supabase RLS와 함께 작동 - 넓은 권한 부여 후 RLS로 세밀 제어
-- =====================================================

-- agent_request_logs: AI 에이전트 요청 로그
grant delete on table "public"."agent_request_logs" to "anon";
grant insert on table "public"."agent_request_logs" to "anon";
grant references on table "public"."agent_request_logs" to "anon";
grant select on table "public"."agent_request_logs" to "anon";
grant trigger on table "public"."agent_request_logs" to "anon";
grant truncate on table "public"."agent_request_logs" to "anon";
grant update on table "public"."agent_request_logs" to "anon";

grant delete on table "public"."agent_request_logs" to "authenticated";
grant insert on table "public"."agent_request_logs" to "authenticated";
grant references on table "public"."agent_request_logs" to "authenticated";
grant select on table "public"."agent_request_logs" to "authenticated";
grant trigger on table "public"."agent_request_logs" to "authenticated";
grant truncate on table "public"."agent_request_logs" to "authenticated";
grant update on table "public"."agent_request_logs" to "authenticated";

grant delete on table "public"."agent_request_logs" to "service_role";
grant insert on table "public"."agent_request_logs" to "service_role";
grant references on table "public"."agent_request_logs" to "service_role";
grant select on table "public"."agent_request_logs" to "service_role";
grant trigger on table "public"."agent_request_logs" to "service_role";
grant truncate on table "public"."agent_request_logs" to "service_role";
grant update on table "public"."agent_request_logs" to "service_role";

-- calendar_invitations: 캘린더 초대
grant delete on table "public"."calendar_invitations" to "anon";
grant insert on table "public"."calendar_invitations" to "anon";
grant references on table "public"."calendar_invitations" to "anon";
grant select on table "public"."calendar_invitations" to "anon";
grant trigger on table "public"."calendar_invitations" to "anon";
grant truncate on table "public"."calendar_invitations" to "anon";
grant update on table "public"."calendar_invitations" to "anon";

grant delete on table "public"."calendar_invitations" to "authenticated";
grant insert on table "public"."calendar_invitations" to "authenticated";
grant references on table "public"."calendar_invitations" to "authenticated";
grant select on table "public"."calendar_invitations" to "authenticated";
grant trigger on table "public"."calendar_invitations" to "authenticated";
grant truncate on table "public"."calendar_invitations" to "authenticated";
grant update on table "public"."calendar_invitations" to "authenticated";

grant delete on table "public"."calendar_invitations" to "service_role";
grant insert on table "public"."calendar_invitations" to "service_role";
grant references on table "public"."calendar_invitations" to "service_role";
grant select on table "public"."calendar_invitations" to "service_role";
grant trigger on table "public"."calendar_invitations" to "service_role";
grant truncate on table "public"."calendar_invitations" to "service_role";
grant update on table "public"."calendar_invitations" to "service_role";

-- calendar_members: 캘린더 멤버 관계
grant delete on table "public"."calendar_members" to "anon";
grant insert on table "public"."calendar_members" to "anon";
grant references on table "public"."calendar_members" to "anon";
grant select on table "public"."calendar_members" to "anon";
grant trigger on table "public"."calendar_members" to "anon";
grant truncate on table "public"."calendar_members" to "anon";
grant update on table "public"."calendar_members" to "anon";

grant delete on table "public"."calendar_members" to "authenticated";
grant insert on table "public"."calendar_members" to "authenticated";
grant references on table "public"."calendar_members" to "authenticated";
grant select on table "public"."calendar_members" to "authenticated";
grant trigger on table "public"."calendar_members" to "authenticated";
grant truncate on table "public"."calendar_members" to "authenticated";
grant update on table "public"."calendar_members" to "authenticated";

grant delete on table "public"."calendar_members" to "service_role";
grant insert on table "public"."calendar_members" to "service_role";
grant references on table "public"."calendar_members" to "service_role";
grant select on table "public"."calendar_members" to "service_role";
grant trigger on table "public"."calendar_members" to "service_role";
grant truncate on table "public"."calendar_members" to "service_role";
grant update on table "public"."calendar_members" to "service_role";

-- calendars: 캘린더
grant delete on table "public"."calendars" to "anon";
grant insert on table "public"."calendars" to "anon";
grant references on table "public"."calendars" to "anon";
grant select on table "public"."calendars" to "anon";
grant trigger on table "public"."calendars" to "anon";
grant truncate on table "public"."calendars" to "anon";
grant update on table "public"."calendars" to "anon";

grant delete on table "public"."calendars" to "authenticated";
grant insert on table "public"."calendars" to "authenticated";
grant references on table "public"."calendars" to "authenticated";
grant select on table "public"."calendars" to "authenticated";
grant trigger on table "public"."calendars" to "authenticated";
grant truncate on table "public"."calendars" to "authenticated";
grant update on table "public"."calendars" to "authenticated";

grant delete on table "public"."calendars" to "service_role";
grant insert on table "public"."calendars" to "service_role";
grant references on table "public"."calendars" to "service_role";
grant select on table "public"."calendars" to "service_role";
grant trigger on table "public"."calendars" to "service_role";
grant truncate on table "public"."calendars" to "service_role";
grant update on table "public"."calendars" to "service_role";

-- event_calendars: 이벤트-캘린더 관계
grant delete on table "public"."event_calendars" to "anon";
grant insert on table "public"."event_calendars" to "anon";
grant references on table "public"."event_calendars" to "anon";
grant select on table "public"."event_calendars" to "anon";
grant trigger on table "public"."event_calendars" to "anon";
grant truncate on table "public"."event_calendars" to "anon";
grant update on table "public"."event_calendars" to "anon";

grant delete on table "public"."event_calendars" to "authenticated";
grant insert on table "public"."event_calendars" to "authenticated";
grant references on table "public"."event_calendars" to "authenticated";
grant select on table "public"."event_calendars" to "authenticated";
grant trigger on table "public"."event_calendars" to "authenticated";
grant truncate on table "public"."event_calendars" to "authenticated";
grant update on table "public"."event_calendars" to "authenticated";

grant delete on table "public"."event_calendars" to "service_role";
grant insert on table "public"."event_calendars" to "service_role";
grant references on table "public"."event_calendars" to "service_role";
grant select on table "public"."event_calendars" to "service_role";
grant trigger on table "public"."event_calendars" to "service_role";
grant truncate on table "public"."event_calendars" to "service_role";
grant update on table "public"."event_calendars" to "service_role";

-- events: 이벤트
grant delete on table "public"."events" to "anon";
grant insert on table "public"."events" to "anon";
grant references on table "public"."events" to "anon";
grant select on table "public"."events" to "anon";
grant trigger on table "public"."events" to "anon";
grant truncate on table "public"."events" to "anon";
grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";
grant insert on table "public"."events" to "authenticated";
grant references on table "public"."events" to "authenticated";
grant select on table "public"."events" to "authenticated";
grant trigger on table "public"."events" to "authenticated";
grant truncate on table "public"."events" to "authenticated";
grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";
grant insert on table "public"."events" to "service_role";
grant references on table "public"."events" to "service_role";
grant select on table "public"."events" to "service_role";
grant trigger on table "public"."events" to "service_role";
grant truncate on table "public"."events" to "service_role";
grant update on table "public"."events" to "service_role";

-- google_integrations: 구글 캘린더 연동
grant delete on table "public"."google_integrations" to "anon";
grant insert on table "public"."google_integrations" to "anon";
grant references on table "public"."google_integrations" to "anon";
grant select on table "public"."google_integrations" to "anon";
grant trigger on table "public"."google_integrations" to "anon";
grant truncate on table "public"."google_integrations" to "anon";
grant update on table "public"."google_integrations" to "anon";

grant delete on table "public"."google_integrations" to "authenticated";
grant insert on table "public"."google_integrations" to "authenticated";
grant references on table "public"."google_integrations" to "authenticated";
grant select on table "public"."google_integrations" to "authenticated";
grant trigger on table "public"."google_integrations" to "authenticated";
grant truncate on table "public"."google_integrations" to "authenticated";
grant update on table "public"."google_integrations" to "authenticated";

grant delete on table "public"."google_integrations" to "service_role";
grant insert on table "public"."google_integrations" to "service_role";
grant references on table "public"."google_integrations" to "service_role";
grant select on table "public"."google_integrations" to "service_role";
grant trigger on table "public"."google_integrations" to "service_role";
grant truncate on table "public"."google_integrations" to "service_role";
grant update on table "public"."google_integrations" to "service_role";

-- users: 사용자
grant delete on table "public"."users" to "anon";
grant insert on table "public"."users" to "anon";
grant references on table "public"."users" to "anon";
grant select on table "public"."users" to "anon";
grant trigger on table "public"."users" to "anon";
grant truncate on table "public"."users" to "anon";
grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";
grant insert on table "public"."users" to "authenticated";
grant references on table "public"."users" to "authenticated";
grant select on table "public"."users" to "authenticated";
grant trigger on table "public"."users" to "authenticated";
grant truncate on table "public"."users" to "authenticated";
grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";
grant insert on table "public"."users" to "service_role";
grant references on table "public"."users" to "service_role";
grant select on table "public"."users" to "service_role";
grant trigger on table "public"."users" to "service_role";
grant truncate on table "public"."users" to "service_role";
grant update on table "public"."users" to "service_role";

-- =====================================================
-- RLS 정책 (Row Level Security Policies)
-- 실제 데이터 접근 제어 - 위의 GRANT는 기본 권한, RLS로 세밀하게 제어
-- =====================================================

-- agent_request_logs: AI 에이전트 요청 로그
-- Service role은 모든 작업 가능 (백엔드에서만 사용)
create policy "Service role can do everything"
on "public"."agent_request_logs"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));

-- 사용자는 자신의 로그만 조회 가능
create policy "Users can view own logs"
on "public"."agent_request_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));


-- calendar_invitations: 캘린더 초대
-- 익명 사용자도 유효한 토큰의 초대 정보 조회 가능 (초대 수락 페이지용)
create policy "Anyone can view invitations with valid token"
on "public"."calendar_invitations"
as permissive
for select
to anon
using ((((expires_at IS NULL) OR (expires_at > now())) AND (status = 'pending'::text)));

-- 인증된 사용자는 자신에게 온 초대 또는 관리자로서 초대 관리 가능
create policy "Authenticated users can view their invitations or manage as adm"
on "public"."calendar_invitations"
as permissive
for select
to authenticated
using (((invitee_email = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = calendar_invitations.calendar_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

-- 캘린더 소유자/관리자만 초대 생성 가능
create policy "Calendar owners and admins can create invitations"
on "public"."calendar_invitations"
as permissive
for insert
to authenticated
with check (((EXISTS ( SELECT 1
   FROM calendars c
  WHERE ((c.id = calendar_invitations.calendar_id) AND (c.created_by = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = calendar_invitations.calendar_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));

-- 캘린더 소유자/관리자만 초대 삭제 가능
create policy "Calendar owners and admins can delete invitations"
on "public"."calendar_invitations"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = calendar_invitations.calendar_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text]))))));

-- 초대받은 사람 또는 캘린더 소유자/관리자가 초대 상태 변경 가능
create policy "Invitees or calendar owners can update invitations"
on "public"."calendar_invitations"
as permissive
for update
to authenticated
using (((invitee_email = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = calendar_invitations.calendar_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))))
with check (((invitee_email = (auth.jwt() ->> 'email'::text)) OR (EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = calendar_invitations.calendar_id) AND (cm.user_id = auth.uid()) AND (cm.role = ANY (ARRAY['owner'::text, 'admin'::text])))))));


-- calendar_members: 캘린더 멤버
-- 모든 인증된 사용자는 멤버 관계 조회 가능 (캘린더 멤버 목록 확인용)
create policy "Authenticated users can view all calendar memberships"
on "public"."calendar_members"
as permissive
for select
to authenticated
using (true);

-- 캘린더 소유자가 멤버 추가 OR 초대받은 사용자가 자신을 멤버로 추가 가능
create policy "Owners can add members or users can accept invitations"
on "public"."calendar_members"
as permissive
for insert
to authenticated
with check ((((user_id = auth.uid()) AND (role = 'owner'::text) AND (EXISTS ( SELECT 1
   FROM calendars c
  WHERE ((c.id = calendar_members.calendar_id) AND (c.created_by = auth.uid()) AND (NOT (EXISTS ( SELECT 1
           FROM calendar_members existing
          WHERE ((existing.calendar_id = c.id) AND (existing.role = 'owner'::text))))))))) OR (EXISTS ( SELECT 1
   FROM calendars c
  WHERE ((c.id = calendar_members.calendar_id) AND (c.created_by = auth.uid())))) OR ((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM calendar_invitations ci
  WHERE ((ci.calendar_id = calendar_members.calendar_id) AND (ci.invitee_email = (auth.jwt() ->> 'email'::text)) AND (ci.status = ANY (ARRAY['pending'::text, 'accepted'::text])) AND ((ci.expires_at IS NULL) OR (ci.expires_at > now()))))))));

-- 캘린더 소유자만 멤버 권한 변경 가능
create policy "Owners can update members"
on "public"."calendar_members"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM calendars
  WHERE ((calendars.id = calendar_members.calendar_id) AND (calendars.created_by = auth.uid())))));

-- 캘린더 소유자 또는 본인이 멤버 탈퇴 가능
create policy "Owners or self can delete members"
on "public"."calendar_members"
as permissive
for delete
to public
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM calendars
  WHERE ((calendars.id = calendar_members.calendar_id) AND (calendars.created_by = auth.uid()))))));


-- calendars: 캘린더
-- 누구나 캘린더 생성 가능 (인증된 사용자)
create policy "Anyone can create calendars"
on "public"."calendars"
as permissive
for insert
to public
with check ((auth.uid() = created_by));

-- 소유자만 캘린더 삭제 가능
create policy "Owners can delete calendars"
on "public"."calendars"
as permissive
for delete
to public
using ((created_by = auth.uid()));

-- 소유자만 캘린더 수정 가능
create policy "Owners can update calendars"
on "public"."calendars"
as permissive
for update
to public
using ((created_by = auth.uid()));

-- 소유한 캘린더 또는 멤버로 속한 캘린더 조회 가능
create policy "Users can view owned or member calendars"
on "public"."calendars"
as permissive
for select
to public
using (((created_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = calendars.id) AND (cm.user_id = auth.uid()))))));


-- event_calendars: 이벤트-캘린더 관계
-- 캘린더 멤버만 이벤트를 해당 캘린더에 연결 가능
create policy "Calendar members can create event_calendars"
on "public"."event_calendars"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM calendar_members cm
  WHERE ((cm.calendar_id = event_calendars.calendar_id) AND (cm.user_id = auth.uid())))));

-- 이벤트 작성자 및 캘린더 멤버가 관계 삭제 가능
create policy "Event creators and calendar admins can delete event_calendars"
on "public"."event_calendars"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM calendar_members
  WHERE ((calendar_members.calendar_id = event_calendars.calendar_id) AND (calendar_members.user_id = auth.uid())))));

-- 이벤트 작성자가 구글 동기화 정보 업데이트 가능
create policy "Event creators can update google sync info"
on "public"."event_calendars"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM calendar_members
  WHERE ((calendar_members.calendar_id = event_calendars.calendar_id) AND (calendar_members.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM calendar_members
  WHERE ((calendar_members.calendar_id = event_calendars.calendar_id) AND (calendar_members.user_id = auth.uid())))));

-- 자신의 캘린더에 속한 이벤트-캘린더 관계 조회 가능
create policy "Users can view event_calendars of their calendars"
on "public"."event_calendars"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM calendar_members
  WHERE ((calendar_members.calendar_id = event_calendars.calendar_id) AND (calendar_members.user_id = auth.uid())))));


-- events: 이벤트
-- 누구나 이벤트 생성 가능 (본인이 작성자로 설정)
create policy "Anyone can create events"
on "public"."events"
as permissive
for insert
to public
with check ((auth.uid() = created_by));

-- 작성자만 자신의 이벤트 삭제 가능
create policy "Event creators can delete their events"
on "public"."events"
as permissive
for delete
to public
using ((created_by = auth.uid()));

-- 작성자만 자신의 이벤트 수정 가능
create policy "Event creators can update their events"
on "public"."events"
as permissive
for update
to public
using ((created_by = auth.uid()))
with check ((created_by = auth.uid()));

-- 자신이 작성한 이벤트 또는 자신의 캘린더에 있는 이벤트 조회 가능
create policy "Users can view events in their calendars"
on "public"."events"
as permissive
for select
to public
using (((created_by = auth.uid()) OR (id IN ( SELECT ec.event_id
   FROM (event_calendars ec
     JOIN calendar_members cm ON ((cm.calendar_id = ec.calendar_id)))
  WHERE (cm.user_id = auth.uid())))));


-- google_integrations: 구글 캘린더 연동
-- 자신의 구글 연동 정보만 접근 가능
create policy "Users can only access their own google integration"
on "public"."google_integrations"
as permissive
for all
to public
using ((auth.uid() = user_id));


-- users: 사용자
-- 자신의 프로필만 수정 가능
create policy "Users can update own profile"
on "public"."users"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));

-- 모든 인증된 사용자의 기본 정보 조회 가능 (이름, 이메일 등)
create policy "Users can view other users basic info"
on "public"."users"
as permissive
for select
to authenticated
using (true);


