import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './SignupPage.scss';
import { Button } from '@chakra-ui/react';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuth();

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
      await signup(email, password);
      navigate('/login', {
        state: { message: 'Account created successfully. Please log in.' },
      });
    } catch {
      // 에러는 useAuth에서 관리
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2>회원가입</h2>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <div className="error-message">{error}</div>}
        <Button
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          variant="surface"
        >
          {isLoading ? '회원가입 중...' : '회원가입'}
        </Button>
        <div className="signup-links">
          <Link to="/login">로그인</Link>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
