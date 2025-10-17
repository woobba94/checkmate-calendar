import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/services/supabase';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const email = searchParams.get('email');
  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    // 이미 로그인된 사용자는 대시보드로 리다이렉트
    if (user) {
      navigate(redirect);
    }
  }, [user, navigate, redirect]);

  useEffect(() => {
    // 카운트다운 타이머
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [resendCountdown]);

  const handleCheckVerification = async () => {
    if (!email) return;

    setIsChecking(true);
    try {
      // 이메일로 로그인 시도하여 인증 상태 확인
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'temp-check', // 임시 비밀번호로 시도
      });

      // 이메일이 인증되었다면 다른 에러가 발생할 것임
      if (error && error.message !== 'Email not confirmed') {
        setIsVerified(true);
        // 인증 완료 안내 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate(`/login?redirect=${encodeURIComponent(redirect)}`, {
            state: { message: '이메일 인증이 완료되었습니다. 로그인해주세요.' },
          });
        }, 2000);
      }
    } catch (err) {
      // 에러 무시
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email || resendDisabled) return;

    setResendDisabled(true);
    setResendCountdown(60); // 60초 카운트다운

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        alert('인증 메일 재전송에 실패했습니다.');
        setResendDisabled(false);
        setResendCountdown(0);
      } else {
        alert('인증 메일이 재전송되었습니다.');
      }
    } catch (err) {
      alert('인증 메일 재전송 중 오류가 발생했습니다.');
      setResendDisabled(false);
      setResendCountdown(0);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">이메일 인증 완료!</h1>
          <p className="text-gray-600 mb-4">
            잠시 후 로그인 페이지로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">이메일 인증이 필요합니다</h1>
          <p className="text-gray-600">
            회원가입이 완료되었습니다!
            <br />
            {email ? (
              <>
                <strong>{email}</strong>로 전송된 인증 메일을 확인해주세요.
              </>
            ) : (
              '입력하신 이메일로 전송된 인증 메일을 확인해주세요.'
            )}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">인증 방법:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>이메일 받은함을 확인하세요</li>
            <li>"Confirm your mail" 버튼을 클릭하세요</li>
            <li>인증이 완료되면 로그인할 수 있습니다</li>
          </ol>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCheckVerification}
            disabled={isChecking}
            className="w-full"
            size="lg"
          >
            {isChecking ? '확인 중...' : '인증 완료 확인'}
          </Button>

          <Button
            onClick={handleResendEmail}
            disabled={resendDisabled}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {resendDisabled
              ? `인증 메일 재전송 (${resendCountdown}초)`
              : '인증 메일 재전송'}
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="w-full"
          >
            나중에 하기
          </Button>
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-semibold mb-1">메일이 오지 않나요?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>스팸 또는 프로모션 폴더를 확인하세요</li>
            <li>이메일 주소가 올바른지 확인하세요</li>
            <li>잠시 후 다시 시도해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
