import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar, updateProfile } from '@/services/authService';
import { Moon, Sun, Camera, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import imageCompression from 'browser-image-compression';
import {
  getUserInitials,
  PROFILE_IMAGE_COMPRESSION_OPTIONS,
  validateProfileImageFile,
} from '@/lib/user-utils';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
}

export function UserSettingsDialog({
  open,
  onOpenChange,
  colorMode,
  toggleColorMode,
}: UserSettingsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ''
  );
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // user 정보가 변경되면 state 업데이트
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.display_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
      setPreviewUrl('');
      setSelectedFile(null);
    }
  }, [user]);

  // previewUrl 변경 및 cleanup (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    setPreviewUrl('');
    setSelectedFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 검증
    const validation = validateProfileImageFile(file, 10);
    if (!validation.valid) {
      toast({
        title: '오류 발생',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    // 파일 저장 및 미리보기 URL 생성
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let finalAvatarUrl: string | null = avatarUrl || null;

      // 새로운 파일이 선택되었으면 업로드
      if (selectedFile) {
        // 이미지 압축
        const compressedFile = await imageCompression(
          selectedFile,
          PROFILE_IMAGE_COMPRESSION_OPTIONS
        );

        // 파일 업로드
        finalAvatarUrl = await uploadAvatar(user.id, compressedFile);
      }

      // 프로필 업데이트 (빈 문자열은 null로 변환)
      await updateProfile(user.id, {
        display_name: displayName,
        avatar_url: finalAvatarUrl || undefined,
      });

      // Supabase Auth가 완전히 반영될 때까지 짧은 딜레이
      await new Promise((resolve) => setTimeout(resolve, 300));

      // auth 쿼리 무효화하여 최신 데이터 가져오기
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });

      // 미리보기 URL 정리 (useEffect cleanup이 자동 처리)
      setPreviewUrl('');

      toast({
        title: '프로필이 업데이트되었습니다',
        description: '변경사항이 성공적으로 저장되었습니다.',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast({
        title: '오류 발생',
        description: '프로필 업데이트 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>사용자 설정</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar
                className="h-20 w-20 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <AvatarImage
                  src={previewUrl || avatarUrl}
                  className="object-contain"
                />
                <AvatarFallback className="text-2xl">
                  {getUserInitials(displayName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Camera className="h-6 w-6 text-white" />
              </div>
              {(avatarUrl || previewUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-0 -right-0 bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 z-10 hover:ring-1 hover:ring-white hover:ring-inset transition-all"
                  aria-label="프로필 사진 제거"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="displayName">표시 이름</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="dark-mode" className="cursor-pointer">
                다크 모드
              </Label>
              {colorMode === 'dark' ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Switch
              id="dark-mode"
              checked={colorMode === 'dark'}
              onCheckedChange={toggleColorMode}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
