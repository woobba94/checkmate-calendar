import { supabase } from './supabase';
import type { User } from '@/types/calendar';

// 사용자 정보 타입 (public.users 테이블)
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

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
      user_metadata: data.user.user_metadata || {},
    };
  }

  return null;
};

// 로그인
export const signIn = async (
  email: string,
  password: string
): Promise<User | null> => {
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
      user_metadata: data.user.user_metadata || {},
    };
  }

  return null;
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
): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, avatar_url')
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

// 프로필 사진 업로드
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  // 파일 크기 검증 (500KB - 압축된 파일은 대부분 100KB 이하지만 여유있게)
  if (file.size > 500 * 1024) {
    throw new Error('압축된 파일이 너무 큽니다. 다시 시도해주세요.');
  }

  // 파일명에 타임스탬프 포함 (캐시 버스팅)
  const fileExt =
    file.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${userId}_${timestamp}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // 기존 파일 삭제
  const { data: existingFiles, error: listError } = await supabase.storage
    .from('avatars')
    .list('avatars', {
      search: userId,
    });

  if (listError) {
    console.error('기존 파일 목록 조회 실패:', listError);
    // 조회 실패해도 계속 진행 (새 파일 업로드는 가능)
  } else if (existingFiles && existingFiles.length > 0) {
    try {
      const filesToDelete = existingFiles.map((f) => `avatars/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('기존 파일 삭제 실패:', deleteError);
      }
    } catch (error) {
      console.error('기존 파일 삭제 중 예외 발생:', error);
    }
  }

  // 새 파일 업로드
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`파일 업로드 실패: ${uploadError.message}`);
  }

  // 공개 URL 가져오기
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// 프로필 정보 업데이트 (표시 이름, 아바타 URL)
export const updateProfile = async (
  userId: string,
  updates: { display_name?: string; avatar_url?: string }
): Promise<void> => {
  // 현재 세션 유저 확인
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser || currentUser.id !== userId) {
    throw new Error('본인의 프로필만 수정할 수 있습니다.');
  }

  // 1. auth.users의 user_metadata 업데이트
  const { error: authError } = await supabase.auth.updateUser({
    data: updates,
  });

  if (authError) {
    throw new Error(`프로필 업데이트 실패: ${authError.message}`);
  }

  // 2. public.users 테이블 업데이트
  const { error: dbError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (dbError && dbError.code !== 'PGRST116') {
    throw new Error(`DB 업데이트 실패: ${dbError.message}`);
  }
};
