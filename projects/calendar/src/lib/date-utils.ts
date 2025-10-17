/**
 * 일관된 날짜/시간 처리를 위한 Date 유틸리티
 */

/**
 * 값이 ISO 문자열 형식인지 확인
 * @param value - Date 객체 또는 문자열
 * @returns ISO 문자열
 */
export function ensureIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  // 이미 문자열인 경우, 유효성 검사 후 정규화
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date.toISOString();
}

/**
 * 날짜 값을 Date 객체로 변환
 * @param value - Date 객체 또는 문자열
 * @returns Date 객체
 */
export function ensureDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}

/**
 * 날짜를 "0월 0일 (요일)" 형식으로 포맷팅
 * @param date - Date 객체
 * @returns 포맷된 날짜 문자열
 */
export function formatDateKorean(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}
