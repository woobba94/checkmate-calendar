import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  getInvitationByToken,
  acceptInvitation,
} from '@/services/calendarService';
import type { CalendarInvitation } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [invitation, setInvitation] = useState<Pick<
    CalendarInvitation,
    'id' | 'calendar_id' | 'invitee_email' | 'role' | 'status' | 'calendar_name'
  > | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('초대 링크가 유효하지 않습니다.');
        setIsLoadingInvitation(false);
        return;
      }

      try {
        const invitationData = await getInvitationByToken(token);
        if (!invitationData) {
          setError('초대를 찾을 수 없습니다.');
        } else if (invitationData.status === 'accepted') {
          // 이미 수락된 초대
          navigate(`/dashboard?calendar=${invitationData.calendar_id}`);
        } else {
          setInvitation(invitationData);
        }
      } catch (err) {
        setError(`초대 정보를 불러오는 중 오류가 발생했습니다.: ${err}`);
      } finally {
        setIsLoadingInvitation(false);
      }
    };

    loadInvitation();
  }, [token, navigate]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setIsAccepting(true);
    setError(null);

    try {
      // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
      if (!user) {
        // 초대 토큰을 포함하여 로그인 페이지로 이동
        navigate(
          `/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`
        );
        return;
      }

      // 초대 수락
      const calendarId = await acceptInvitation(token, user.id);

      // 대시보드로 이동하면서 해당 캘린더 선택
      navigate(`/dashboard?calendar=${calendarId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '초대 수락 중 오류가 발생했습니다.'
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSignupAndAccept = () => {
    if (!token) return;
    // 회원가입 페이지로 이동 (redirect 파라미터 포함)
    navigate(
      `/signup?redirect=${encodeURIComponent(`/invite?token=${token}`)}`
    );
  };

  // 로딩 중
  if (isAuthLoading || isLoadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">오류</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            대시보드로 이동
          </Button>
        </div>
      </div>
    );
  }

  // 초대 정보 표시
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">캘린더 초대</h1>
          <p className="text-gray-600">다음 캘린더에 초대되었습니다:</p>
        </div>

        {invitation && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              {invitation.calendar_name}
            </h2>
            <p className="text-sm text-blue-700">
              역할: {invitation.role === 'admin' ? '관리자' : '멤버'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {!user ? (
            <>
              <p className="text-sm text-gray-600 text-center mb-4">
                초대를 수락하려면 계정이 필요합니다.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleAcceptInvitation}
                  className="w-full"
                  size="lg"
                >
                  기존 계정으로 로그인
                </Button>
                <Button
                  onClick={handleSignupAndAccept}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  새 계정 만들기
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {invitation?.invitee_email && (
                  <>
                    초대받은 이메일: <strong>{invitation.invitee_email}</strong>
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 text-center mb-4">
                {user.email}로 로그인되어 있습니다.
              </p>
              <Button
                onClick={handleAcceptInvitation}
                disabled={isAccepting}
                className="w-full"
                size="lg"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '초대 수락하기'
                )}
              </Button>
            </>
          )}

          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="w-full"
          >
            나중에 하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
