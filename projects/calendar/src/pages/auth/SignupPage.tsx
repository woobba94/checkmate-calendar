import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, login, isLoading, error } = useAuth();
  
  // redirect 파라미터 읽기
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      // 회원가입
      await signup(email, password);
      
      // 자동 로그인 시도
      try {
        await login(email, password);
        // 로그인 성공 시 redirect 페이지로 이동
        navigate(redirect);
      } catch (loginError) {
        // 자동 로그인 실패 시 로그인 페이지로 이동
        navigate(`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, {
          state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' },
        });
      }
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
          회원가입
        </h2>
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
              autoComplete="new-password"
              required
              className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] rounded-md px-[14px] py-3 text-base w-full focus:outline-[var(--accent-color)] focus:outline-2 focus:border-[var(--accent-color)]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
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
          {isLoading ? '회원가입 중...' : '회원가입'}
        </Button>
        <div className="mt-2.5 text-center text-[15px]">
          <Link
            to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-[var(--accent-color)] no-underline font-medium hover:underline"
          >
            로그인
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
