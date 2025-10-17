import { supabase } from './supabase';
import type { User } from '@/types/calendar';

// 회원가입
export const signUp = async (
  email: string,
  password: string
): Promise<User | null> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.user) {
    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  }

  return null;
};

// 로그인
export const signIn = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error details:', error);
      throw new Error(`Login failed: ${error.message}`);
    }

    if (data?.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
      };
    }

    return null;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};

// 로그아웃
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};

// current user 가져오기
export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    // 세션이 없으면 null 반환
    if (error.message === 'Auth session missing!') {
      return null;
    }
    throw new Error(error.message);
  }

  if (data?.user) {
    // user_metadata와 함께 반환
    return {
      id: data.user.id,
      email: data.user.email || '', // TODO 사용자 정보에 이메일이 없을 수 없을것같음. 무결하다면 그에 맞게 처리필요.
      user_metadata: data.user.user_metadata || {},
    };
  }

  return null;
};

// userId를 확인하고 필요시 현재 사용자 ID를 가져오는 헬퍼 함수
export const ensureUserId = async (userId?: string): Promise<string> => {
  if (userId) {
    return userId;
  }

  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData.user?.id;

  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  return currentUserId;
};

// userId로 사용자 정보 조회
export const getUserById = async (
  userId: string
): Promise<{ id: string; email: string; display_name?: string } | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 결과가 없는 경우
      return null;
    }
    console.error('Failed to fetch user:', error);
    return null;
  }

  return data;
};
