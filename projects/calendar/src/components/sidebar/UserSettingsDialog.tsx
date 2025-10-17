import { useState } from 'react';
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
import { supabase } from '@/services/supabase';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';

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

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 1. auth.users의 user_metadata 업데이트
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (authError) throw authError;

      // 2. public.users 테이블 업데이트
      // INSERT 권한이 없으므로 UPDATE만 시도 (레코드는 회원가입 시 트리거로 자동 생성됨)
      const { error: dbError } = await supabase
        .from('users')
        .update({ display_name: displayName })
        .eq('id', user.id);

      // 레코드가 없는 경우는 무시 (트리거가 없는 경우를 대비)
      // RLS 정책상 INSERT 권한이 없으므로 UPDATE만 시도
      if (dbError && dbError.code !== 'PGRST116') {
        throw dbError;
      }

      // 3. auth 쿼리 무효화하여 최신 데이터 가져오기
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });

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

  const getUserInitials = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>사용자 설정</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
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
