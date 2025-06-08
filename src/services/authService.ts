import { supabase } from './supabase';
import type { User } from '../types/calendar';

// 회원가입
export const signUp = async (email: string, password: string): Promise<User | null> => {
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
export const signIn = async (email: string, password: string): Promise<User | null> => {
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
    throw new Error(error.message);
  }
  
  if (data?.user) {
    return {
      id: data.user.id,
      email: data.user.email || '', // TODO 사용자 정보에 이메일이 없을 수 없을것같음. 무결하다면 그에 맞게 처리필요.
    };
  }
  
  return null;
};