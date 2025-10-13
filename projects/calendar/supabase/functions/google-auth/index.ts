import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const rateLimitMap = new Map<string, number[]>();

async function isRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false;

  const now = Date.now();
  const windowMs = 60 * 1000; // 1분
  const maxRequests = 5; // 1분에 최대 5번까지

  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return true;
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return false;
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // IP 기반 rate limiting
    const clientIP =
      req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
    if (await isRateLimited(clientIP)) {
      throw new Error('Rate limit exceeded');
    }

    // 필수 parameter 검증
    if (!code || !state) {
      throw new Error('Missing required parameters');
    }

    // state parameter 검증
    if (!isValidUUID(state)) {
      throw new Error('Invalid state format');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    const { data: user, error: userError } =
      await supabase.auth.admin.getUserById(state);

    if (userError || !user) {
      console.error('User validation failed:', userError);
      throw new Error('Invalid user');
    }

    // Google OAuth2 토큰 교환
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-auth`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Token exchange failed:', error);
      return Response.redirect(
        `${Deno.env.get('FRONTEND_URL')}?google_auth=error&reason=token_exchange`,
        302
      );
    }

    const tokens = await tokenResponse.json();

    // Google 사용자 정보 가져오기
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return Response.redirect(
        `${Deno.env.get('FRONTEND_URL')}?google_auth=error&reason=user_info`,
        302
      );
    }

    const userInfo = await userInfoResponse.json();

    // DB에 토큰 저장
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const { error } = await supabase.from('google_integrations').upsert(
      {
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        google_email: userInfo.email,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      console.error('Database error:', error);
      return Response.redirect(
        `${Deno.env.get('FRONTEND_URL')}?google_auth=error&reason=database`,
        302
      );
    }

    return Response.redirect(
      `${Deno.env.get('FRONTEND_URL')}?google_auth=success&email=${encodeURIComponent(userInfo.email)}`,
      302
    );
  } catch (error) {
    console.error('Google auth error:', error);

    const isSecurityError =
      error.message.includes('Rate limit') ||
      error.message.includes('Invalid state') ||
      error.message.includes('Invalid user');

    const redirectUrl = isSecurityError
      ? `${Deno.env.get('FRONTEND_URL')}?google_auth=forbidden`
      : `${Deno.env.get('FRONTEND_URL')}?google_auth=error`;

    return Response.redirect(redirectUrl, 302);
  }
});
