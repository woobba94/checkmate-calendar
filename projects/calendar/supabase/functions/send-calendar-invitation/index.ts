import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  calendarId: string;
  calendarName: string;
  inviterName: string;
  inviteeEmail: string;
  invitationToken: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      calendarId,
      calendarName,
      inviterName,
      inviteeEmail,
      invitationToken,
    } = (await req.json()) as InvitationRequest;

    console.log('[send-calendar-invitation] 요청 데이터:', {
      calendarId,
      calendarName,
      inviterName,
      inviteeEmail,
      invitationToken: invitationToken?.substring(0, 8) + '...',
    });

    // 환경 변수 확인
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    const inviteLink = `https://app.checkmate-calendar.com/invite?token=${invitationToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #02B1F0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #02B1F0; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CheckMate Calendar 초대</h1>
            </div>
            <div class="content">
              <h2>안녕하세요!</h2>
              <p><strong>${inviterName}</strong>님이 <strong>"${calendarName}"</strong> 캘린더에 초대했습니다.</p>
              <p>아래 버튼을 클릭하여 초대를 수락하고 캘린더에 참여하세요:</p>
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">초대 수락하기</a>
              </div>
              <p style="color: #666; font-size: 14px;">
                버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                <span style="color: #02B1F0;">${inviteLink}</span>
              </p>
            </div>
            <div class="footer">
              <p>이 초대는 CheckMate Calendar에서 발송되었습니다.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailText = `
CheckMate Calendar 초대

안녕하세요!

${inviterName}님이 "${calendarName}" 캘린더에 초대했습니다.

아래 링크를 클릭하여 초대를 수락하고 캘린더에 참여하세요:
${inviteLink}

이 초대는 CheckMate Calendar에서 발송되었습니다.
    `;

    // Resend를 사용한 이메일 발송
    const emailPayload = {
      from: 'CheckMate Calendar <noreply@mail.checkmate-calendar.com>',
      to: inviteeEmail,
      subject: `${inviterName}님이 "${calendarName}" 캘린더에 초대했습니다`,
      html: emailHtml,
      text: emailText,
    };

    console.log('[send-calendar-invitation] Resend API 호출 시작');
    console.log('[send-calendar-invitation] 이메일 발송 대상:', inviteeEmail);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    console.log('[send-calendar-invitation] Resend API 응답:', {
      status: response.status,
      ok: response.ok,
      result,
    });

    if (!response.ok) {
      throw new Error(
        `이메일 발송 실패: ${result.message || result.error || JSON.stringify(result)}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '초대 이메일이 발송되었습니다.',
        inviteLink,
        emailId: result.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[send-calendar-invitation] ❌ 에러 발생:', {
      message: error.message,
      stack: error.stack,
      error: error,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
