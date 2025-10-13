import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { AGENT_TOOLS, buildSystemPrompt } from './tools.ts';
import { isCalendarRelated } from './messageFilter.ts';
import {
  checkRateLimit,
  logAgentRequest,
  createRateLimitResponse,
  addRateLimitHeaders,
} from '../_shared/rateLimit.ts';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Calendar {
  id: string;
  name: string;
  color?: string;
}

interface UserContext {
  userId: string;
  currentDate: string;
  timezone: string;
  activeCalendarId?: string;
  calendarIds: string[];
  calendars?: Calendar[];
}

interface ChatRequest {
  message: string;
  conversation_history: ConversationMessage[];
  user_context: UserContext;
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 요청 본문 먼저 파싱
    const requestBody = await req.json();
    const { message, conversation_history, user_context }: ChatRequest =
      requestBody;

    // 비용 절감을 위해 production에서는 디버깅 로그 제거
    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log(
        'Request headers:',
        Object.fromEntries(req.headers.entries())
      );
      console.log('User context from request:', user_context);
    }

    const authHeader = req.headers.get('Authorization');
    let user = null;

    // Supabase 클라이언트 생성 (Service Role 사용)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader || '' },
        },
      }
    );

    if (authHeader) {
      const { data } = await supabaseClient.auth.getUser();
      user = data.user;
    }

    // 사용자 확인 - user_context에서도 확인
    if (!user && !user_context?.userId) {
      throw new Error('사용자 인증 정보를 찾을 수 없습니다');
    }

    const userId = user?.id || user_context.userId;
    const userEmail = user?.email || '';

    if (Deno.env.get('ENVIRONMENT') !== 'production') {
      console.log('Final userId:', userId);
    }

    // Rate Limiting 체크
    const rateLimitResult = await checkRateLimit(supabaseClient, {
      userId,
      userEmail,
    });

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // 요청 로그 기록 (비동기로 처리하여 성능 영향 최소화)
    logAgentRequest(supabaseClient, { userId, userEmail }).catch((err) =>
      console.error('Failed to log request:', err)
    );

    // 캘린더가 선택되지 않은 경우 경고
    if (!user_context.calendarIds || user_context.calendarIds.length === 0) {
      console.warn('No calendars selected');
    }

    // 캘린더 관련 메시지인지 사전 필터링
    if (!isCalendarRelated(message)) {
      return new Response(
        JSON.stringify({
          error:
            '일정 관련 요청만 처리할 수 있습니다. 일정 추가, 조회, 수정, 삭제 등의 요청을 해주세요.',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }

    // OpenAI API 호출
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다');
    }

    const systemPrompt = buildSystemPrompt({
      currentDate: user_context.currentDate,
      timezone: user_context.timezone,
      activeCalendarId: user_context.activeCalendarId,
      calendars: user_context.calendars,
    });

    const messages: ConversationMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.slice(-10), // 최근 10개 메시지만
      { role: 'user', content: message },
    ];

    const openaiResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          tools: AGENT_TOOLS,
          tool_choice: 'auto',
          stream: true,
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API 오류: ${error}`);
    }

    // 스트리밍 응답 전달
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        const maxBufferSize = 10000; // 버퍼 크기 제한

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 버퍼 크기 확인
          if (buffer.length > maxBufferSize) {
            console.error('Buffer overflow detected');
            buffer = buffer.slice(-maxBufferSize);
          }

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
                return;
              }

              try {
                // 도구 호출이 포함된 경우 처리
                const chunk = JSON.parse(data);
                if (chunk.choices?.[0]?.delta?.tool_calls) {
                  // 도구 호출 정보를 포함하여 전달
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                  );
                } else {
                  // 일반 텍스트 응답
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              } catch (e) {
                console.error('청크 파싱 오류:', e);
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: addRateLimitHeaders(
        {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
        rateLimitResult
      ),
    });
  } catch (error) {
    console.error('에러:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
