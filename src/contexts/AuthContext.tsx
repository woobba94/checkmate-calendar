import React, { createContext, useContext } from 'react';
import type { User } from '@/types/calendar';
import { getCurrentUser, signIn, signOut, signUp } from '@/services/authService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // 현재 로그인된 유저 정보 쿼리
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // 로그인 뮤테이션
  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) => signIn(payload.email, payload.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // 회원가입 뮤테이션
  const signupMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) => signUp(payload.email, payload.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // 로그아웃 뮤테이션
  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // 에러 메시지 통합
  const errorMsg: string =
    (loginMutation.isError && (loginMutation.error as Error)?.message) ||
    (signupMutation.isError && (signupMutation.error as Error)?.message) ||
    (logoutMutation.isError && (logoutMutation.error as Error)?.message) ||
    (error instanceof Error ? error.message : (error ? error as string : '')) ||
    '';

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const signup = async (email: string, password: string) => {
    await signupMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading || loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending,
        error: errorMsg,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};