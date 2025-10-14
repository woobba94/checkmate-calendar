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

    // 410 에러: syncToken이 만료됨 (전체 동기화 필요)
    if (response.status === 410) {
      const error = new Error(
        'SyncToken이 만료되었습니다. 전체 동기화가 필요합니다.'
      );
      error.name = 'SYNC_TOKEN_INVALID';
      throw error;
    }

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
  let usedSyncToken = syncToken;

  try {
    do {
      const data = await fetchGoogleCalendarEvents(
        accessToken,
        usedSyncToken,
        nextPageToken
      );
      if (data.items) {
        allEvents.push(...data.items);
      }
      nextPageToken = data.nextPageToken;
      nextSyncToken = data.nextSyncToken;
      if (usedSyncToken) {
        break;
      }
    } while (nextPageToken);
  } catch (error) {
    // syncToken 만료 시 전체 동기화로 재시도
    if (error.name === 'SYNC_TOKEN_INVALID') {
      usedSyncToken = null;
      nextPageToken = null;
      allEvents.length = 0; // 배열 초기화

      do {
        const data = await fetchGoogleCalendarEvents(
          accessToken,
          null,
          nextPageToken
        );
        if (data.items) {
          allEvents.push(...data.items);
        }
        nextPageToken = data.nextPageToken;
        nextSyncToken = data.nextSyncToken;
      } while (nextPageToken);
    } else {
      throw error;
    }
  }

  return {
    events: allEvents,
    nextSyncToken,
    syncTokenInvalidated: syncToken && !usedSyncToken, // syncToken이 무효화되었는지 여부
  };
}

// 이벤트 처리
async function processEvents(supabase, events, calendarId, userId) {
  let processedCount = 0;

  for (const event of events) {
    try {
      if (event.status === 'cancelled') {
        // 삭제된 이벤트 처리 - event_calendars에서 찾아서 삭제
        const { data: eventCalendar } = await supabase
          .from('event_calendars')
          .select('event_id')
          .eq('google_event_id', event.id)
          .eq('calendar_id', calendarId)
          .maybeSingle();

        if (eventCalendar) {
          // 이벤트 삭제 (CASCADE로 event_calendars도 자동 삭제됨)
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventCalendar.event_id)
            .eq('created_by', userId);

          if (!error) {
            processedCount++;
          }
        }
      } else {
        // 기존 이벤트 찾기 (event_calendars를 통해)
        const { data: existingEventCalendar } = await supabase
          .from('event_calendars')
          .select('event_id, events(*)')
          .eq('google_event_id', event.id)
          .eq('calendar_id', calendarId)
          .maybeSingle();

        const eventData = {
          title: event.summary || '제목 없음',
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          allDay: !event.start?.dateTime,
          description: event.description || null,
          created_by: userId, // 명시적으로 설정
          updated_at: new Date().toISOString(),
        };

        let eventId;

        if (existingEventCalendar?.event_id) {
          // 기존 이벤트 업데이트
          const { error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', existingEventCalendar.event_id);

          if (error) {
            console.error(`이벤트 업데이트 오류 (${event.id}):`, error);
            continue;
          }

          eventId = existingEventCalendar.event_id;

          // event_calendars의 google_updated 업데이트
          await supabase
            .from('event_calendars')
            .update({ google_updated: event.updated })
            .eq('event_id', eventId)
            .eq('calendar_id', calendarId);
        } else {
          // 새 이벤트 생성
          const { data: newEvent, error: eventError } = await supabase
            .from('events')
            .insert(eventData)
            .select('id')
            .single();

          if (eventError || !newEvent) {
            console.error(`이벤트 생성 오류 (${event.id}):`, eventError);
            continue;
          }

          eventId = newEvent.id;

          // event_calendars에 관계 추가 (Google 정보 포함)
          const { error: relationError } = await supabase
            .from('event_calendars')
            .insert({
              event_id: eventId,
              calendar_id: calendarId,
              google_event_id: event.id,
              google_updated: event.updated,
            });

          if (relationError) {
            console.error(`관계 생성 오류 (${event.id}):`, relationError);
            // 이벤트 롤백
            await supabase.from('events').delete().eq('id', eventId);
            continue;
          }
        }

        processedCount++;
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

    // invalid_grant 에러 처리 (refresh_token 만료 또는 권한 취소)
    if (error.includes('invalid_grant')) {
      const reAuthError = new Error(
        '구글 인증이 만료되었거나 취소되었습니다. 다시 연동해주세요.'
      );
      reAuthError.name = 'REAUTH_REQUIRED';
      throw reAuthError;
    }

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
    const { events, nextSyncToken, syncTokenInvalidated } =
      await getAllGoogleEvents(
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

    // 실제 동기화 타입 결정 (syncToken이 무효화되면 full sync로 변경)
    const actualSyncType = syncTokenInvalidated ? 'full' : syncType;

    return new Response(
      JSON.stringify({
        success: true,
        message: `patched ${processedCount} events.`,
        sync_type: actualSyncType,
        total_events: events.length,
        processed_events: processedCount,
        sync_token_invalidated: syncTokenInvalidated || false,
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

    // 재인증 필요 에러는 401로 반환
    const status = error.name === 'REAUTH_REQUIRED' ? 401 : 400;

    return new Response(
      JSON.stringify({
        error: error.message,
        reauth_required: error.name === 'REAUTH_REQUIRED',
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
