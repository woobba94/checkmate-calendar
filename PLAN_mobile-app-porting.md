# 📱 Checkmate Calendar 모바일 앱 포팅 계획

> ⚠️ **중요**: 이 계획은 **`projects/calendar`** 프로젝트만을 대상으로 합니다.  
> `projects/landing`은 포팅 대상이 아닙니다.

## 🎯 목표

- **데스크톱**: 기존 웹사이트 유지 (별도 앱 없음)
- **모바일**: 네이티브 앱으로 App Store/Google Play Store 배포
- **핵심 기능**: 크로스 플랫폼 알림 시스템

## 📊 기술 스택

### 현재 상태

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase
- **Calendar**: FullCalendar

### 포팅 기술

- **모바일 프레임워크**: Capacitor 6.x
- **푸시 알림**: Firebase Cloud Messaging (FCM)
- **로컬 알림**: Capacitor Local Notifications
- **빌드 도구**: Xcode (iOS), Android Studio (Android)

## 🗓️ 단계별 실행 계획

### Phase 1: 반응형 웹 구현 (2주)

#### Week 1: 모바일 UI/UX 개선

```bash
# 작업 위치
cd projects/calendar
```

**주요 작업:**

1. **브레이크포인트 전략**
   - Mobile: 320px - 767px
   - Tablet: 768px - 1023px
   - Desktop: 1024px+

2. **컴포넌트 반응형 개선**
   - `Calendar.tsx`: 모바일에서 월/일 뷰만 표시
   - `AppSidebar.tsx`: 모바일에서 햄버거 메뉴로 변환
   - `AgentPanel.tsx`: 모바일에서 바텀 시트 또는 풀스크린 모달
   - `CalendarHeader.tsx`: 모바일 최적화 네비게이션

3. **터치 최적화**
   - 최소 터치 영역 44x44px
   - 스와이프 제스처 추가
   - 모바일 친화적 날짜/시간 선택기

#### Week 2: PWA 기본 기능

**주요 작업:**

1. **Service Worker 구현**

   ```javascript
   // projects/calendar/public/sw.js
   - 오프라인 캐싱
   - 백그라운드 동기화
   ```

2. **Web App Manifest**

   ```json
   // projects/calendar/public/manifest.json
   {
     "name": "Checkmate Calendar",
     "short_name": "Checkmate",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#000000",
     "background_color": "#ffffff",
     "icons": [...]
   }
   ```

3. **웹 푸시 알림** (데스크톱 웹용)

### Phase 2: Capacitor 모바일 앱 개발 (3주)

#### Week 3: Capacitor 초기 설정

```bash
# Capacitor 설치 및 설정
cd projects/calendar
npm install @capacitor/core @capacitor/cli
npx cap init "Checkmate Calendar" "com.checkmate.calendar" --web-dir dist

# 플랫폼 추가
npx cap add ios
npx cap add android

# 필수 플러그인 설치
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
npm install @capacitor/preferences
npm install @capacitor/app
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
```

**설정 파일:**

```typescript
// projects/calendar/capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checkmate.calendar',
  appName: 'Checkmate Calendar',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

#### Week 4: 네이티브 기능 통합

**알림 시스템 구현:**

```typescript
// projects/calendar/src/services/mobileNotificationService.ts
- 푸시 알림 권한 요청
- FCM 토큰 관리
- 로컬 알림 스케줄링
- 알림 클릭 핸들링
```

**네이티브 연동:**

- Google Calendar 동기화 개선
- 생체 인증 (선택사항)
- 딥링크 처리
- 앱 라이프사이클 관리

#### Week 5: 플랫폼별 최적화

**iOS 최적화:**

- Safe Area 대응
- iOS 제스처 충돌 해결
- iOS 스타일 조정

**Android 최적화:**

- Material Design 가이드라인
- 뒤로가기 버튼 처리
- Android 12+ 스플래시 스크린

### Phase 3: 앱스토어 배포 준비 (2주)

#### Week 6: 빌드 및 테스트

**iOS:**

1. Apple Developer Program 가입 ($99/년)
2. Xcode에서 프로젝트 설정
   - Bundle ID 설정
   - 프로비저닝 프로파일
   - 앱 아이콘 (1024x1024)
   - 런치 스크린
3. TestFlight 베타 배포

**Android:**

1. Google Play Console 가입 ($25 일회)
2. Android Studio에서 빌드
   - 앱 서명 설정
   - ProGuard 설정
   - 앱 번들(.aab) 생성
3. 내부 테스트 트랙 배포

#### Week 7: 스토어 등록

**공통 준비물:**

- 앱 설명 (다국어)
- 스크린샷 (각 디바이스 크기별)
- 프로모션 이미지
- 개인정보 처리방침 URL
- 이용약관 URL

**심사 대응:**

- iOS 심사 가이드라인 준수
- Android 정책 준수
- 심사 리젝 대응 계획

## 📁 프로젝트 구조 변경사항

```
projects/calendar/
├── src/
│   ├── services/
│   │   ├── notificationService.ts      # 크로스 플랫폼 알림
│   │   └── mobileService.ts           # 모바일 전용 기능
│   └── hooks/
│       ├── useDeviceType.ts           # 디바이스 감지
│       └── useMobileGestures.ts       # 모바일 제스처
├── ios/                               # Capacitor iOS 프로젝트 (자동 생성)
├── android/                           # Capacitor Android 프로젝트 (자동 생성)
├── capacitor.config.ts
└── resources/                         # 앱 아이콘 및 스플래시 이미지
    ├── icon.png                       # 1024x1024
    └── splash.png                     # 2732x2732
```

## 🚀 빌드 및 배포 스크립트

```json
// projects/calendar/package.json 에 추가
{
  "scripts": {
    "build:mobile": "npm run build && npx cap sync",
    "ios": "npm run build:mobile && npx cap open ios",
    "android": "npm run build:mobile && npx cap open android",
    "mobile:dev": "npm run dev & npx cap run ios --livereload --external"
  }
}
```

## ⚠️ 주의사항

1. **환경 변수 관리**
   - Supabase URL/Key는 앱에 포함되므로 보안 주의
   - FCM 설정은 각 플랫폼별로 분리

2. **버전 관리**
   - 웹과 앱 버전 동기화 전략 필요
   - 강제 업데이트 메커니즘 고려

3. **성능 최적화**
   - 대용량 캘린더 데이터 처리
   - 이미지 최적화
   - 번들 사이즈 최소화

## 💰 예상 비용

- **개발자 계정**
  - Apple Developer: $99/년
  - Google Play Console: $25 (일회성)

- **서드파티 서비스**
  - Firebase (FCM): 무료 티어로 충분
  - 코드 서명 인증서: 필요시 추가

## 🎯 성공 지표

1. **기술적 목표**
   - 앱 크래시율 < 1%
   - 앱 시작 시간 < 3초
   - 알림 전달률 > 95%

2. **사용자 경험**
   - 앱스토어 평점 4.0 이상
   - 일일 활성 사용자(DAU) 증가
   - 알림 수신 동의율 > 70%

## 📅 타임라인 요약

- **Week 1-2**: 반응형 웹 + PWA
- **Week 3-5**: Capacitor 앱 개발
- **Week 6-7**: 앱스토어 배포

**총 소요 기간**: 7주

---

> 💡 이 계획은 상황에 따라 조정될 수 있으며, 각 단계별로 상세 태스크는 별도로 관리됩니다.
