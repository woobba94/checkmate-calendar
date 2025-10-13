/**
 * 캘린더 관련 메시지인지 확인하는 필터
 */
export function isCalendarRelated(message: string): boolean {
  const calendarKeywords = [
    // 일정 관련 명사
    '일정',
    '스케줄',
    '약속',
    '미팅',
    '회의',
    '이벤트',
    '행사',
    '모임',
    'schedule',
    'meeting',
    'appointment',
    'event',

    // 시간 관련 표현
    '오늘',
    '내일',
    '모레',
    '어제',
    '이번주',
    '다음주',
    '저번주',
    '지난주',
    '이번달',
    '다음달',
    '저번달',
    '지난달',
    '올해',
    '내년',
    '작년',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
    '일요일',
    '시',
    '분',
    '시간',
    '날짜',
    '언제',
    '며칠',
    '몇시',
    'today',
    'tomorrow',
    'yesterday',
    'week',
    'month',
    'year',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',

    // 동작 관련
    '추가',
    '생성',
    '만들',
    '잡아',
    '예약',
    '등록',
    '넣어',
    '적어',
    '삭제',
    '제거',
    '취소',
    '지워',
    '빼',
    '수정',
    '변경',
    '바꿔',
    '옮겨',
    '이동',
    '확인',
    '조회',
    '찾아',
    '알려',
    '보여',
    '뭐가',
    '있어',
    '있나',
    '없나',
    '겹치',
    '충돌',
    '비어',
    '가능',
    '빈',
    'add',
    'create',
    'delete',
    'remove',
    'cancel',
    'update',
    'modify',
    'change',
    'check',
    'find',
    'show',
    'list',

    // 캘린더 이름
    '캘린더',
    'calendar',
  ];

  const lowerMessage = message.toLowerCase();

  // 키워드가 포함되어 있는지 확인
  const hasKeyword = calendarKeywords.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );

  // 날짜 패턴 확인 (예: 2024-01-01, 01/01, 1월 1일 등)
  const datePatterns = [
    /\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/, // 2024-01-01
    /\d{1,2}[-/.]\d{1,2}/, // 01/01
    /\d{1,2}월\s*\d{1,2}일/, // 1월 1일
    /\d{1,2}시/, // 14시
    /\d{1,2}:\d{2}/, // 14:30
  ];

  const hasDatePattern = datePatterns.some((pattern) => pattern.test(message));

  return hasKeyword || hasDatePattern;
}
