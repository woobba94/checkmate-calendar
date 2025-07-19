import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './LoginPage.scss';
import { Button } from "@chakra-ui/react";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user, login, isLoading, error } = useAuth();

  useEffect(() => {
    if (!!user) {
      navigate('/');
    }
  }, [user, navigate]);

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
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>로그인</h2>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <div className="error-message">{error}</div>}
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
        <div className="login-links">
          <Link to="/signup">회원가입</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;