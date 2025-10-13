import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

// 구글 캘린더 API 호출
async function fetchGoogleCalendarEvents(accessToken, syncToken, pageToken) {
  const apiUrl = new URL(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  );

  if (syncToken) {
    // 일부 sync
    apiUrl.searchParams.set('syncToken', syncToken);
    console.log('증분 동기화 사용 중');
  } else {
    // 전체 sync( nextSyncToken 받기 위한 최소 설정)
    apiUrl.searchParams.set('maxResults', '2500');
    apiUrl.searchParams.set('singleEvents', 'true');
    apiUrl.searchParams.set('showDeleted', 'true');
    if (pageToken) {
      apiUrl.searchParams.set('pageToken', pageToken);
    }
  }

  const response = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[구글 캘린더 API 오류] response.status: ${response.status}, errorText: ${errorText}`
    );
  }

  return await response.json();
}

// fetch event full
async function getAllGoogleEvents(accessToken, syncToken) {
  const allEvents = [];
  let nextPageToken = null;
  let nextSyncToken = null;

  do {
    const data = await fetchGoogleCalendarEvents(
      accessToken,
      syncToken,
      nextPageToken
    );
    if (data.items) {
      allEvents.push(...data.items);
    }
    nextPageToken = data.nextPageToken;
    nextSyncToken = data.nextSyncToken;
    if (syncToken) {
      break;
    }
  } while (nextPageToken);

  console.log(`Total count of patch events: ${allEvents.length}`);
  console.log('최종 nextSyncToken:', nextSyncToken);

  return {
    events: allEvents,
    nextSyncToken,
  };
}

// 이벤트 처리
async function processEvents(supabase, events, calendarId, userId) {
  let processedCount = 0;

  for (const event of events) {
    try {
      if (event.status === 'cancelled') {
        // 삭제된 이벤트 처리
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('google_event_id', event.id)
          .eq('created_by', userId);

        if (!error) {
          processedCount++;
        }
      } else {
        // 새로운/수정된 이벤트 처리
        const eventData = {
          title: event.summary || '제목 없음',
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          allDay: !event.start?.dateTime,
          description: event.description || null,
          calendar_id: calendarId,
          created_by: userId,
          google_event_id: event.id,
          google_updated: event.updated,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('events').upsert(eventData, {
          onConflict: 'google_event_id,created_by',
          ignoreDuplicates: false,
        });

        if (!error) {
          processedCount++;
        } else {
          console.error(`이벤트 처리 오류 (${event.id}):`, error);
        }
      }
    } catch (error) {
      console.error(`이벤트 처리 예외 (${event.id}):`, error);
    }
  }

  return processedCount;
}

// 캘린더 생성 또는 가져오기
async function getOrCreateCalendar(supabase, userId, googleEmail) {
  let { data: calendar } = await supabase
    .from('calendars')
    .select('id')
    .eq('created_by', userId)
    .eq('name', googleEmail)
    .maybeSingle();

  if (!calendar) {
    const { data: newCalendar, error } = await supabase
      .from('calendars')
      .insert({
        name: googleEmail,
        description: `구글 캘린더 (${googleEmail})`,
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) throw error;
    calendar = newCalendar;
    console.log('구글캘린더 기반 신규 캘린더 생성완료');
  }

  // 캘린더에 current user 를 owner 로 추가 (신규/기존 관계없음)
  const { data: member } = await supabase
    .from('calendar_members')
    .select('id')
    .eq('calendar_id', calendar.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!member) {
    const { error: memberError } = await supabase
      .from('calendar_members')
      .insert({
        calendar_id: calendar.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      throw memberError;
    }
  }

  return calendar;
}

// syncToken 업데이트
async function updateSyncToken(supabase, userId, syncToken) {
  const { error } = await supabase
    .from('google_integrations')
    .update({
      sync_token: syncToken,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('sync_token');

  if (error) {
    console.error('syncToken 저장 오류:', error);
    return false;
  } else {
    return true;
  }
}

// 토큰 갱신 함수
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`토큰 갱신 실패: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

// 토큰 유효성 검사 및 갱신
async function getValidAccessToken(supabase, integration) {
  const now = new Date();
  const expiresAt = new Date(integration.expires_at);

  if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
    console.log('토큰 만료됨, 갱신 중...');
    const tokenData = await refreshAccessToken(integration.refresh_token);
    const newExpiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);

    const { error } = await supabase
      .from('google_integrations')
      .update({
        access_token: tokenData.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', integration.user_id);

    if (error) throw error;
    console.log('갱신 완료');
    return tokenData.access_token;
  }

  return integration.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 구글 연동 정보 가져오기
    const { data: integration, error } = await supabase
      .from('google_integrations')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error || !integration) {
      throw new Error('구글 연동 정보를 찾을 수 없음');
    }

    // 액세스 토큰 가져오기
    const validAccessToken = await getValidAccessToken(supabase, integration);

    // 캘린더 신규생성 또는 가져오기
    const calendar = await getOrCreateCalendar(
      supabase,
      user_id,
      integration.google_email
    );

    // 동기화 타입 결정
    const useSyncToken =
      integration.sync_token && integration.sync_token.trim() !== '';
    const syncType = useSyncToken ? 'incremental' : 'full';

    // 구글 이벤트 가져오기
    const { events, nextSyncToken } = await getAllGoogleEvents(
      validAccessToken,
      useSyncToken ? integration.sync_token : null
    );

    // 이벤트 동기화 처리
    const processedCount = await processEvents(
      supabase,
      events,
      calendar.id,
      user_id
    );

    // syncToken 최신화
    if (nextSyncToken) {
      await updateSyncToken(supabase, user_id, nextSyncToken);
    }

    console.log(`동기화 완료 - 처리된 이벤트: ${processedCount}개`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `patched ${processedCount} events.`,
        sync_type: syncType,
        total_events: events.length,
        processed_events: processedCount,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('동기화 오류:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
