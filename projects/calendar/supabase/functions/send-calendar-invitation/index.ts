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
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 본문 파싱
    const {
      calendarId,
      calendarName,
      inviterName,
      inviteeEmail,
      invitationToken,
    } = (await req.json()) as InvitationRequest;

    // 초대 링크 생성
    const inviteLink = `https://app.checkmate-calendar.com/invite?token=${invitationToken}`;

    // 이메일 HTML 템플릿
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

    // 이메일 텍스트 버전
    const emailText = `
CheckMate Calendar 초대

안녕하세요!

${inviterName}님이 "${calendarName}" 캘린더에 초대했습니다.

아래 링크를 클릭하여 초대를 수락하고 캘린더에 참여하세요:
${inviteLink}

이 초대는 CheckMate Calendar에서 발송되었습니다.
    `;

    // TODO: 실제 이메일 발송 로직 구현
    // 예시: SendGrid, Resend, AWS SES 등 사용
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'CheckMate Calendar <noreply@checkmate-calendar.com>',
    //     to: inviteeEmail,
    //     subject: `${inviterName}님이 "${calendarName}" 캘린더에 초대했습니다`,
    //     html: emailHtml,
    //     text: emailText,
    //   }),
    // })

    // 임시로 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: '초대 이메일이 발송되었습니다.',
        inviteLink,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
