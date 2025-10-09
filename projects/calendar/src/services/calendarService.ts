import { supabase } from './supabase';
import { ensureUserId } from './authService';
import type { Calendar, CalendarMember } from '@/types/calendar';

// 캘린더 생성
export const createCalendar = async (
  name: string,
  color: string = '#ffffff',
  inviteEmails: string[] = [],
  description?: string,
  userId?: string
): Promise<Calendar> => {
  // userId 확인 및 획득
  const validUserId = await ensureUserId(userId);

  // 캘린더 생성 시작
  const { data: calendar, error: calendarError } = await supabase
    .from('calendars')
    .insert({
      name,
      description,
      color,
      created_by: validUserId,
    })
    .select()
    .single();

  if (calendarError) {
    throw new Error(`Failed to create calendar: ${calendarError.message}`);
  }

  // 생성자를 owner 로 세팅
  const { error: memberError } = await supabase
    .from('calendar_members')
    .insert({
      calendar_id: calendar.id,
      user_id: validUserId,
      role: 'owner',
    });

  if (memberError) {
    // 캘린더는 생성되었지만 멤버 추가에 실패한 경우
    // 이상적으로는 트랜잭션으로 처리해야 하지만, supabase에서는 클라이언트 측 트랜잭션이 제한적
    throw new Error(`Failed to add owner to calendar: ${memberError.message}`);
  }

  // 이메일 초대 처리
  if (inviteEmails.length > 0) {
    console.log('[createCalendar] 이메일 초대 처리 시작:', inviteEmails);

    // 초대자 정보 가져오기
    const { data: userData } = await supabase.auth.getUser();
    const inviterName =
      userData?.user?.user_metadata?.name || userData?.user?.email || '사용자';

    console.log('[createCalendar] 초대자 정보:', { inviterName, validUserId });

    // 초대장 생성 및 DB 저장
    const invitationsWithTokens = inviteEmails.map((email) => ({
      calendar_id: calendar.id,
      calendar_name: calendar.name,
      inviter_id: validUserId,
      invitee_email: email,
      role: 'member' as const,
      invitation_token: crypto.randomUUID(), // 토큰 생성
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후 만료
    }));

    console.log(
      '[createCalendar] 초대장 생성 시도:',
      invitationsWithTokens.length,
      '건'
    );

    // RLS 정책 문제 회피를 위해 select() 제거
    const { data: createdInvitations, error: inviteError } = await supabase
      .from('calendar_invitations')
      .insert(invitationsWithTokens);

    if (inviteError) {
      console.error('[createCalendar] ❌ 초대장 DB 저장 실패:', inviteError);
      // 초대 실패는 캘린더 생성을 막지 않음
    } else {
      console.log(
        '[createCalendar] ✅ 초대장 DB 저장 성공 (추정):',
        invitationsWithTokens.length,
        '건'
      );

      // 각 초대에 대해 이메일 발송 (select() 없이 직접 처리)
      for (const invitation of invitationsWithTokens) {
        try {
          console.log(
            '[createCalendar] 이메일 발송 시도:',
            invitation.invitee_email
          );
          await sendCalendarInvitation(
            calendar.id,
            calendar.name,
            inviterName,
            invitation.invitee_email,
            invitation.invitation_token
          );
          console.log(
            '[createCalendar] ✅ 이메일 발송 성공:',
            invitation.invitee_email
          );
        } catch (emailError) {
          console.error(
            `[createCalendar] ❌ 이메일 발송 실패 (${invitation.invitee_email}):`,
            emailError
          );
          // 이메일 발송 실패는 캘린더 생성을 막지 않음
        }
      }
    }
  }

  return calendar;
};

// 사용자가 접근할 수 있는 모든 캘린더 조회
export const getCalendars = async (): Promise<Calendar[]> => {
  const { data, error } = await supabase.from('calendars').select('*');

  if (error) {
    throw new Error(`Failed to fetch calendars: ${error.message}`);
  }

  return data || [];
};

// 특정 캘린더 조회
export const getCalendarById = async (
  calendarId: string
): Promise<Calendar> => {
  const { data, error } = await supabase
    .from('calendars')
    .select('*')
    .eq('id', calendarId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch calendar: ${error.message}`);
  }

  return data;
};

// 캘린더 업데이트
export const updateCalendar = async (
  calendarId: string,
  updates: Partial<Pick<Calendar, 'name' | 'description' | 'color'>>,
  inviteEmails: string[] = []
): Promise<Calendar> => {
  const { data, error } = await supabase
    .from('calendars')
    .update({
      ...updates,
      updated_at: new Date(),
    })
    .eq('id', calendarId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update calendar: ${error.message}`);
  }

  // 이메일 초대 처리
  if (inviteEmails.length > 0) {
    console.log('[updateCalendar] 이메일 초대 처리 시작:', inviteEmails);

    // 초대자 정보 가져오기
    const { data: userData } = await supabase.auth.getUser();
    const inviterName =
      userData?.user?.user_metadata?.name || userData?.user?.email || '사용자';
    const validUserId = userData?.user?.id;

    console.log('[updateCalendar] 초대자 정보:', { inviterName, validUserId });

    if (!validUserId) {
      throw new Error('User not authenticated');
    }

    // 초대장 생성 및 DB 저장
    const invitationsWithTokens = inviteEmails.map((email) => ({
      calendar_id: calendarId,
      calendar_name: data.name, // 캘린더 이름 추가
      inviter_id: validUserId,
      invitee_email: email,
      role: 'member' as const,
      invitation_token: crypto.randomUUID(), // 토큰 생성
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후 만료
    }));

    console.log(
      '[updateCalendar] 초대장 생성 시도:',
      invitationsWithTokens.length,
      '건'
    );

    // RLS 정책 문제 회피를 위해 select() 제거
    const { data: createdInvitations, error: inviteError } = await supabase
      .from('calendar_invitations')
      .insert(invitationsWithTokens);

    if (inviteError) {
      console.error('[updateCalendar] ❌ 초대장 DB 저장 실패:', inviteError);
      // 초대 실패는 캘린더 수정을 막지 않음
    } else {
      console.log(
        '[updateCalendar] ✅ 초대장 DB 저장 성공 (추정):',
        invitationsWithTokens.length,
        '건'
      );

      // 각 초대에 대해 이메일 발송 (select() 없이 직접 처리)
      for (const invitation of invitationsWithTokens) {
        try {
          console.log(
            '[updateCalendar] 이메일 발송 시도:',
            invitation.invitee_email
          );
          await sendCalendarInvitation(
            calendarId,
            data.name,
            inviterName,
            invitation.invitee_email,
            invitation.invitation_token
          );
          console.log(
            '[updateCalendar] ✅ 이메일 발송 성공:',
            invitation.invitee_email
          );
        } catch (emailError) {
          console.error(
            `[updateCalendar] ❌ 이메일 발송 실패 (${invitation.invitee_email}):`,
            emailError
          );
          // 이메일 발송 실패는 캘린더 수정을 막지 않음
        }
      }
    }
  }

  return data;
};

// 캘린더 삭제
export const deleteCalendar = async (calendarId: string): Promise<void> => {
  const { error } = await supabase
    .from('calendars')
    .delete()
    .eq('id', calendarId);

  if (error) {
    throw new Error(`Failed to delete calendar: ${error.message}`);
  }
};

// 캘린더 멤버 조회
export const getCalendarMembers = async (
  calendarId: string
): Promise<CalendarMember[]> => {
  const { data, error } = await supabase
    .from('calendar_members')
    .select('*')
    .eq('calendar_id', calendarId);

  if (error) {
    throw new Error(`Failed to fetch calendar members: ${error.message}`);
  }

  return data || [];
};

// 캘린더에 멤버 추가
export const addCalendarMember = async (
  calendarId: string,
  userId: string,
  role: 'member' | 'admin' = 'member'
): Promise<void> => {
  const { error } = await supabase.from('calendar_members').insert({
    calendar_id: calendarId,
    user_id: userId,
    role,
  });

  if (error) {
    throw new Error(`Failed to add member to calendar: ${error.message}`);
  }
};

// 캘린더 멤버 역할 업데이트
export const updateCalendarMemberRole = async (
  calendarId: string,
  userId: string,
  role: 'member' | 'admin' | 'owner'
): Promise<void> => {
  const { error } = await supabase
    .from('calendar_members')
    .update({ role })
    .eq('calendar_id', calendarId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`);
  }
};

// 캘린더에서 멤버 제거
export const removeCalendarMember = async (
  calendarId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('calendar_members')
    .delete()
    .eq('calendar_id', calendarId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove member from calendar: ${error.message}`);
  }
};

// 사용자가 캘린더의 멤버인지 확인
export const checkCalendarMembership = async (
  calendarId: string,
  userId?: string
): Promise<{ isMember: boolean; role?: string }> => {
  // userId 확인 - 여기서는 에러를 발생시키지 않고 false 반환
  try {
    const validUserId = await ensureUserId(userId);

    const { data, error } = await supabase
      .from('calendar_members')
      .select('role')
      .eq('calendar_id', calendarId)
      .eq('user_id', validUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 결과가 없는 경우
        return { isMember: false };
      }
      throw new Error(`Failed to check membership: ${error.message}`);
    }

    return {
      isMember: true,
      role: data.role,
    };
  } catch (error) {
    // 사용자가 인증되지 않은 경우 false 반환
    if (error instanceof Error && error.message === 'User not authenticated') {
      return { isMember: false };
    }
    throw error;
  }
};

// 이메일로 사용자 찾기 (캘린더에 초대 시 필요)
export const findUserByEmail = async (
  email: string
): Promise<string | null> => {
  // TODO Supabase는 이메일로 직접 사용자를 찾는 API를 제공하지 않음. 대신 사용자 테이블을 별도로 관리하는 방법을 고려해야 함

  // 임시 방편으로 RLS 정책이 허용하는 범위 내에서 검색
  const { data, error } = await supabase
    .from('profiles') // 프로필 테이블이 있다고 가정
    .select('id')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 결과가 없는 경우
      return null;
    }
    throw new Error(`Failed to find user: ${error.message}`);
  }

  return data.id;
};

// 초대 토큰으로 초대 정보 조회
export const getInvitationByToken = async (
  token: string
): Promise<{
  id: string;
  calendar_id: string;
  invitee_email: string;
  role: string;
  status: string;
  calendar_name: string;
} | null> => {
  const { data, error } = await supabase
    .from('calendar_invitations')
    .select('id, calendar_id, calendar_name, invitee_email, role, status')
    .eq('invitation_token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get invitation: ${error.message}`);
  }

  return {
    id: data.id,
    calendar_id: data.calendar_id,
    invitee_email: data.invitee_email,
    role: data.role,
    status: data.status,
    calendar_name: data.calendar_name || '캘린더',
  };
};

// 초대 수락
export const acceptInvitation = async (
  invitationToken: string,
  userId?: string
): Promise<string> => {
  // userId 확인
  const validUserId = await ensureUserId(userId);

  // Supabase RPC 함수를 사용해 초대 수락 처리
  // 이 함수는 이메일 검증과 트랜잭션 처리를 모두 수행
  const { data, error } = await supabase.rpc('accept_calendar_invitation', {
    p_invitation_token: invitationToken,
    p_user_id: validUserId,
  });

  if (error) {
    // 에러 메시지를 더 친화적으로 변환
    if (error.message.includes('different email')) {
      throw new Error('초대받은 이메일 계정만 수락가능합니다.');
    } else if (error.message.includes('not found or expired')) {
      throw new Error('초대가 만료되었거나 유효하지 않습니다.');
    } else if (error.message.includes('User not found')) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    throw new Error(`초대 수락 중 오류가 발생했습니다: ${error.message}`);
  }

  if (!data) {
    throw new Error('초대 수락에 실패했습니다.');
  }

  return data; // calendar_id 반환
};

// 이메일 초대 발송
export const sendCalendarInvitation = async (
  calendarId: string,
  calendarName: string,
  inviterName: string,
  inviteeEmail: string,
  invitationToken: string
): Promise<void> => {
  console.log('[sendCalendarInvitation] Edge Function 호출 시작:', {
    calendarId,
    calendarName,
    inviterName,
    inviteeEmail,
    invitationToken: invitationToken.substring(0, 8) + '...',
  });

  const { data, error } = await supabase.functions.invoke(
    'send-calendar-invitation',
    {
      body: {
        calendarId,
        calendarName,
        inviterName,
        inviteeEmail,
        invitationToken,
      },
    }
  );

  if (error) {
    console.error('[sendCalendarInvitation] ❌ Edge Function 에러:', error);
    console.error('[sendCalendarInvitation] ❌ 응답 데이터:', data);

    // Edge Function의 실제 에러 메시지를 확인
    const errorMessage = data?.error || error.message;
    throw new Error(`Failed to send invitation: ${errorMessage}`);
  }

  console.log('[sendCalendarInvitation] ✅ Edge Function 응답:', data);
  return data;
};
