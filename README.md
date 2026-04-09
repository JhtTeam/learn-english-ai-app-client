# LearnEng - Ứng dụng học tiếng Anh cho trẻ em

Ứng dụng React Native cho trẻ em học tiếng Anh thông qua **hội thoại giọng nói thời gian thực với AI**.

## Công nghệ sử dụng

- React Native 0.85.0 + TypeScript
- Zustand (quản lý state)
- React Navigation (điều hướng)
- Axios (networking)
- OpenAI Realtime API (hội thoại giọng nói AI)
- Hermes Engine

## Cấu trúc dự án

```
src/
├── app/                  # Entry point
├── features/             # Các tính năng (auth, home, conversation, lessons, settings)
├── components/           # UI components tái sử dụng
├── services/             # Dịch vụ (AI, audio, network, permissions)
├── hooks/                # Custom hooks
├── navigation/           # Điều hướng (Stack + Tab + Auth flow)
├── store/                # Zustand store (app, auth, conversation)
├── types/                # TypeScript interfaces
├── config/               # Theme, biến môi trường
├── utils/                # Logger, responsive dimensions
└── assets/               # Hình ảnh, fonts, animations
```

## Yêu cầu hệ thống

- Node.js >= 22.11.0
- Xcode (cho iOS)
- Android Studio (cho Android)
- CocoaPods (cho iOS)

## Cài đặt

```bash
# Clone repo
git clone git@github.com:JhtTeam/learn-english-ai-app-client.git
cd learn-english-ai-app-client

# Cài đặt dependencies
npm install

# Cấu hình biến môi trường
cp .env.example .env
# Sửa file .env, thêm OPENAI_API_KEY của bạn

# Cài CocoaPods (iOS)
cd ios && bundle install && bundle exec pod install && cd ..
```

## Chạy ứng dụng

```bash
# Chạy trên iOS Simulator
npx react-native run-ios

# Chạy trên Android Emulator / Device
npx react-native run-android

# Chạy trên thiết bị Android cụ thể
npx react-native run-android --deviceId=<DEVICE_ID>
```

## Build APK (Android)

```bash
# Build APK debug
cd android && ./gradlew assembleDebug
# File APK: android/app/build/outputs/apk/debug/app-debug.apk

# Build APK release (cần cấu hình signing key)
cd android && ./gradlew assembleRelease
# File APK: android/app/build/outputs/apk/release/app-release.apk

# Build AAB (để upload Google Play Store)
cd android && ./gradlew bundleRelease
# File AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### Cấu hình signing key cho bản release

1. Tạo keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/learneng.keystore -alias learneng -keyalg RSA -keysize 2048 -validity 10000
```

2. Thêm vào `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=learneng.keystore
MYAPP_UPLOAD_KEY_ALIAS=learneng
MYAPP_UPLOAD_STORE_PASSWORD=***
MYAPP_UPLOAD_KEY_PASSWORD=***
```

3. Cập nhật `android/app/build.gradle` phần `signingConfigs` và `buildTypes`.

## Các lệnh hữu ích

```bash
# Kiểm tra TypeScript
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Chạy tests
npm test

# Xem log React Native trên thiết bị Android
npx react-native log-android

# Hoặc dùng adb logcat với filter
adb -s <DEVICE_ID> logcat *:S ReactNative:V ReactNativeJS:V
```

## Tính năng

- Đăng nhập / Đăng ký
- Màn hình chủ với danh sách chủ đề
- Hội thoại giọng nói với AI (OpenAI Realtime API)
- Danh sách bài học với tiến độ
- Cài đặt (Dark/Light mode, ngôn ngữ)
- Giao diện thân thiện cho trẻ em (nút lớn, UI đơn giản)
