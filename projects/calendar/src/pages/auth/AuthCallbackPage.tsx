import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error(
          'Auth callback error:',
          error,
          errorCode,
          errorDescription
        );

        // 에러 메시지를 더 친화적으로 변환
        let message = '인증 중 오류가 발생했습니다.';
        if (errorCode === 'otp_expired') {
          message = '인증 링크가 만료되었습니다. 다시 시도해주세요.';
        } else if (errorDescription) {
          message = errorDescription;
        }

        navigate('/login', {
          state: { message },
        });
        return;
      }

      // 성공적으로 인증된 경우
      // Supabase가 자동으로 세션을 처리하므로 추가 작업 불필요
      navigate('/login', {
        state: { message: '이메일 인증이 완료되었습니다. 로그인해주세요.' },
      });
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-gray-600">인증 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
