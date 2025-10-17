// 사용자 이니셜 가져오기
export const getUserInitials = (
  displayName?: string,
  email?: string
): string => {
  if (displayName) {
    return displayName.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
};

// 프로필 이미지 압축 옵션 상수
export const PROFILE_IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.1, // 최대 100KB
  maxWidthOrHeight: 500, // 최대 500px
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
};

// 프로필 이미지 파일 검증
export const validateProfileImageFile = (
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '이미지 파일만 업로드할 수 있습니다.' };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `파일이 너무 큽니다. ${maxSizeMB}MB 이하의 이미지를 선택해주세요.`,
    };
  }
  return { valid: true };
};
