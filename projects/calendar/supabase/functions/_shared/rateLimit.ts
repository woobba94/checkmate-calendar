import { SupabaseClient } from '@supabase/supabase-js';

interface RateLimitConfig {
  userId: string;
  userEmail: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

// 화이트리스트 이메일과 제한
const WHITELIST_EMAILS: Record<string, number> = {
  'jwj3199@gmail.com': 1000, // 개발자 계정
};

// 기본 제한
const DEFAULT_DAILY_LIMIT = 50;

/**
 * Agent 요청 Rate Limiting 체크
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { userId, userEmail } = config;

  // 사용자별 제한 확인
  const dailyLimit = WHITELIST_EMAILS[userEmail] || DEFAULT_DAILY_LIMIT;

  // 오늘 00:00부터 현재까지의 요청 수 조회
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error, count } = await supabase
    .from('agent_request_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('requested_at', today.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    throw new Error('Failed to check rate limit');
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, dailyLimit - requestCount);
  const allowed = requestCount < dailyLimit;

  // 다음날 00:00
  const resetAt = new Date(today);
  resetAt.setDate(resetAt.getDate() + 1);

  return {
    allowed,
    remaining,
    limit: dailyLimit,
    resetAt,
  };
}

/**
 * Agent 요청 로그 기록
 */
export async function logAgentRequest(
  supabase: SupabaseClient,
  config: RateLimitConfig
): Promise<void> {
  const { userId, userEmail } = config;

  const { error } = await supabase.from('agent_request_logs').insert({
    user_id: userId,
    user_email: userEmail,
    requested_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to log agent request:', error);
    // 로그 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * Rate Limit 초과 응답 생성
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `하루 요청 제한(${result.limit}회)을 초과했습니다. ${result.resetAt.toLocaleString('ko-KR')}에 초기화됩니다.`,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429, // Too Many Requests
      headers: {
        ...(corsHeaders || {}),
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Rate Limit 헤더 추가
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}
