import { supabase } from './supabase';
import type { Calendar, CalendarMember } from '@/types/calendar';

// 캘린더 생성
export const createCalendar = async (
    name: string,
    description?: string
): Promise<Calendar> => {
    // current user 가져오기
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    // 캘린더 생성 시작
    const { data: calendar, error: calendarError } = await supabase
        .from('calendars')
        .insert({
            name,
            description,
            created_by: userId
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
            user_id: userId,
            role: 'owner'
        });

    if (memberError) {
        // 캘린더는 생성되었지만 멤버 추가에 실패한 경우
        // 이상적으로는 트랜잭션으로 처리해야 하지만, supabase에서는 클라이언트 측 트랜잭션이 제한적
        throw new Error(`Failed to add owner to calendar: ${memberError.message}`);
    }

    return calendar;
};

// 사용자가 접근할 수 있는 모든 캘린더 조회
export const getCalendars = async (): Promise<Calendar[]> => {
    const { data, error } = await supabase
        .from('calendars')
        .select('*');

    if (error) {
        throw new Error(`Failed to fetch calendars: ${error.message}`);
    }

    return data || [];
};

// 특정 캘린더 조회
export const getCalendarById = async (calendarId: string): Promise<Calendar> => {
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
    updates: Partial<Pick<Calendar, 'name' | 'description'>>
): Promise<Calendar> => {
    const { data, error } = await supabase
        .from('calendars')
        .update({
            ...updates,
            updated_at: new Date()
        })
        .eq('id', calendarId)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to update calendar: ${error.message}`);
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
export const getCalendarMembers = async (calendarId: string): Promise<CalendarMember[]> => {
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
    const { error } = await supabase
        .from('calendar_members')
        .insert({
            calendar_id: calendarId,
            user_id: userId,
            role
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
    // 사용자 ID가 제공되지 않은 경우 현재 로그인한 사용자의 ID 사용
    if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData.user?.id;

        if (!userId) {
            return { isMember: false };
        }
    }

    const { data, error } = await supabase
        .from('calendar_members')
        .select('role')
        .eq('calendar_id', calendarId)
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // 결과가 없는 경우
            return { isMember: false };
        }
        throw new Error(`Failed to check membership: ${error.message}`);
    }

    return {
        isMember: true,
        role: data.role
    };
};

// 이메일로 사용자 찾기 (캘린더에 초대 시 필요)
export const findUserByEmail = async (email: string): Promise<string | null> => {
    // TODO Supabase는 이메일로 직접 사용자를 찾는 API를 제공하지 않음. 대신 사용자 테이블을 별도로 관리하는 방법을 고려해야 함

    // 임시 방편으로 RLS 정책이 허용하는 범위 내에서 검색
    const { data, error } = await supabase
        .from('profiles') // 프로필 테이블이 있다고 가정
        .select('id')
        .eq('email', email)
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // 결과가 없는 경우
            return null;
        }
        throw new Error(`Failed to find user: ${error.message}`);
    }

    return data.id;
};