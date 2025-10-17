/**
 * 두 객체를 깊은 비교하여 변경사항이 있는지 확인
 * @param original - 원본 객체
 * @param updated - 수정된 객체
 * @param compareKeys - 비교할 키 배열 (지정하지 않으면 모든 키 비교)
 * @returns 변경사항 여부
 */
export const hasChanges = <T extends object>(
  original: T,
  updated: T,
  compareKeys?: (keyof T)[]
): boolean => {
  const keys = compareKeys || (Object.keys(updated) as (keyof T)[]);

  for (const key of keys) {
    const originalValue = original[key];
    const updatedValue = updated[key];

    // 배열 비교
    if (Array.isArray(originalValue) && Array.isArray(updatedValue)) {
      if (originalValue.length !== updatedValue.length) {
        return true;
      }
      const sortedOriginal = [...originalValue].sort();
      const sortedUpdated = [...updatedValue].sort();
      for (let i = 0; i < sortedOriginal.length; i++) {
        if (sortedOriginal[i] !== sortedUpdated[i]) {
          return true;
        }
      }
      continue;
    }

    // Date 또는 날짜 문자열 비교
    if (
      (originalValue instanceof Date || typeof originalValue === 'string') &&
      (updatedValue instanceof Date || typeof updatedValue === 'string')
    ) {
      const originalTime = new Date(originalValue).getTime();
      const updatedTime = new Date(updatedValue).getTime();
      if (!isNaN(originalTime) && !isNaN(updatedTime)) {
        if (originalTime !== updatedTime) {
          return true;
        }
        continue;
      }
    }

    // 문자열 비교 (trim 적용)
    if (typeof originalValue === 'string' && typeof updatedValue === 'string') {
      if (originalValue.trim() !== updatedValue.trim()) {
        return true;
      }
      continue;
    }

    // 일반 값 비교
    if (originalValue !== updatedValue) {
      return true;
    }
  }

  return false;
};
