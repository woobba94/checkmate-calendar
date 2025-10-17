import React, { useState, useEffect } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, login, isLoading, error } = useAuth();

  // redirect 파라미터 읽기
  const redirect = searchParams.get('redirect') || '/';

  // location state에서 메시지 읽기
  const stateMessage = location.state?.message;

  useEffect(() => {
    if (user) {
      // redirect 파라미터가 있으면 해당 페이지로, 없으면 대시보드로
      navigate(redirect);
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    try {
      await login(email, password);
    } catch {
      // 에러는 useAuth에서 관리
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-secondary)] rounded-xl shadow-[var(--shadow-lg)] p-10 pb-8 w-full max-w-[380px] flex flex-col gap-[18px]"
      >
        <h2 className="mb-2 text-[2rem] text-[var(--accent-color)] text-center">
          로그인
        </h2>
        {stateMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-md px-3 py-2.5 text-[15px] text-center">
            {stateMessage}
          </div>
        )}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] rounded-md px-[14px] py-3 text-base w-full focus:outline-[var(--accent-color)] focus:outline-2 focus:border-[var(--accent-color)]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] rounded-md px-[14px] py-3 text-base w-full focus:outline-[var(--accent-color)] focus:outline-2 focus:border-[var(--accent-color)]"
            />
          </div>
        </div>
        {error && (
          <div className="bg-[var(--error-color)] text-white border border-[var(--error-color)] rounded-md px-3 py-2.5 mb-1 text-[15px] text-center">
            {error}
          </div>
        )}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
        <div className="mt-2.5 text-center text-[15px]">
          <Link
            to={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-[var(--accent-color)] no-underline font-medium hover:underline"
          >
            회원가입
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
