# 🏠 Smart Board - IoT Home Automation System

A powerful, cross-platform smart home control system built with React, Capacitor, and Android, featuring real-time WebSocket communication, voice control, and automation capabilities.

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.4.4-blue.svg)](https://capacitorjs.com/)
[![Android](https://img.shields.io/badge/Android-SDK%2036-green.svg)](https://developer.android.com/)
[![Java](https://img.shields.io/badge/Java-JDK%2021-red.svg)](https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.16-38B2AC.svg)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Android Integration](#android-integration)
- [Hardware Setup](#hardware-setup)
- [Development](#development)
- [Building](#building)
- [API Documentation](#api-documentation)

---

## 🎯 Overview

Smart Board is a comprehensive IoT home automation system that allows you to control smart devices (switches, lights, appliances) through a beautiful mobile app. It features:

- **Real-time Control**: Instant device control via WebSocket communication
- **Voice Activation**: Wake word detection using TensorFlow Lite (OpenWakeWord)
- **Automation Rules**: Trigger-based automation (shake phone, proximity, face up/down)
- **Cross-Platform**: Works on web, Android, and iOS
- **Hardware Integration**: ESP32 or C++ server backend
- **Modern UI**: Beautiful, responsive design with dark mode

The system consists of three main components:
1. **Mobile App** (React + Capacitor) - The control interface
2. **Backend Server** (ESP32 or C++ WebSocket server) - Device communication hub
3. **Android Native Features** (Java) - Advanced automation and voice control

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Home     │  │ Automations  │  │   Settings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                │                  │              │
│           └────────────────┴──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Zustand Store  │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│           ┌────────────────┴────────────────┐                │
│           │                                 │                │
│    ┌──────▼──────┐                   ┌─────▼──────┐         │
│    │ SmartBoard  │                   │ WebSocket  │         │
│    │   Plugin    │                   │  Manager   │         │
│    └──────┬──────┘                   └─────┬──────┘         │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
            │ Capacitor Bridge                 │
            │                                  │
┌───────────▼──────────────────────────────────▼──────────────┐
│              Android Native Layer (Java)                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │ SmartBoard   │  │  Automation   │  │     OWW      │     │
│  │   Plugin     │  │    Service    │  │   Service    │     │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐      │
│  │  WebSocket  │    │   Sensors   │   │  TFLite     │      │
│  │   Manager   │    │  (Accel,    │   │  (Wake      │      │
│  │             │    │  Proximity)  │   │   Word)     │      │
│  └──────┬──────┘    └──────┬──────┘   └──────┬──────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  WebSocket (WS) │
                    │    Protocol     │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
    ┌─────▼──────┐                    ┌────────▼────────┐
    │    ESP32   │                    │  C++ WebSocket  │
    │   Server   │                    │     Server      │
    │            │                    │                 │
    │  ┌──────┐  │                    │  ┌──────────┐  │
    │  │Relays│  │                    │  │  Boost   │  │
    │  │GPIO  │  │                    │  │  Beast   │  │
    │  └──────┘  │                    │  └──────────┘  │
    └─────┬──────┘                    └────────┬────────┘
          │                                    │
    ┌─────▼──────┐                    ┌────────▼────────┐
    │  Physical  │                    │   Hardware      │
    │  Switches  │                    │   Interface     │
    │  (Relays)  │                    │   (GPIO/etc)    │
    └────────────┘                    └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - UI library with React Compiler for performance
- **TypeScript** - Type-safe development
- **Vite 7.1.7** - Lightning-fast build tool
- **Tailwind CSS 4.1.16** - Utility-first CSS framework
- **Zustand 5.0.8** - Lightweight state management
- **React Router 7.9.5** - Client-side routing
- **Lucide React** - Beautiful icon library
- **Vite PWA** - Progressive Web App support

### Mobile Framework
- **Capacitor 7.4.4** - Cross-platform native runtime
- **@capacitor/android** - Android platform integration
- **@capacitor/app** - App lifecycle management
- **@capacitor/splash-screen** - Native splash screen

### Android Native
- **Java** - Native Android development
- **Android SDK 36** - Latest Android APIs
- **TensorFlow Lite** - On-device ML inference
- **OkHttp** - WebSocket client
- **Sensor APIs** - Accelerometer, proximity sensors

### Backend Options
- **ESP32** (Arduino C++) - IoT microcontroller
  - WiFi connectivity
  - WebSocket server
  - In-Memory file system
  - ArduinoJson library
  
- **C++ Server** (Boost.Beast)
  - High-performance WebSocket server
  - Cross-platform
  - JSON processing with nlohmann/json

### Development Tools
- **ESLint 9.36.0** - Code linting
- **Babel React Compiler** - Automatic optimization
- **Capacitor CLI** - Native project management

---

## ✨ Features

### 🎮 Core Features
- **Real-time Device Control**: Toggle switches instantly via WebSocket
- **Batch Operations**: Turn all devices on/off simultaneously
- **Status Monitoring**: Live connection status and device state
- **Dark Mode**: Beautiful dark theme with smooth transitions
- **Responsive Design**: Optimized for all screen sizes

### 🤖 Automation System
- **Shake Gesture**: Shake your phone to trigger actions
- **Face Up Detection**: Trigger when phone is placed face-up
- **Face Down Detection**: Trigger when phone is placed face-down
- **Proximity Sensor**: Trigger when object is near the phone
- **Time-based Triggers**: Schedule automations (future feature)
- **Custom Actions**: Configure multiple switch states per automation
- **Enable/Disable Rules**: Toggle automations on the fly

### 🗣️ Voice Control
- **Wake Word Detection**: Uses OpenWakeWord (TensorFlow Lite)
- **Multiple Models**: Alexa, Hey Jarvis, Hey Mycroft, Hey Rhasspy, etc.
- **On-Device Processing**: No cloud required, works offline
- **Low Power**: Efficient audio processing
- **Background Service**: Always listening when enabled

### 📱 Android Native Features
- **Background Services**: Runs automations even when app is closed
- **Foreground Service**: Persistent notification for active automations
- **Sensor Integration**: Accelerometer, proximity, orientation
- **Battery Optimization**: Request background permission
- **Wake Lock**: Keep automation service alive
- **Custom Plugin**: Bridge between React and Android native code

### 🔐 Security
- **Token Authentication**: Secure WebSocket connections
- **Local Storage**: Encrypted configuration storage
- **Network Validation**: URL and connection verification

---

## 📁 Project Structure

```
smart-board/
├── src/                          # React application source
│   ├── components/               # Reusable UI components
│   │   ├── Automation.tsx        # Automation editor component
│   │   ├── AutomationCard.tsx    # Automation list card
│   │   ├── BottomNav.tsx         # Bottom navigation bar
│   │   └── SwitchCard.tsx        # Switch control card
│   ├── pages/                    # Page components
│   │   ├── Home.tsx              # Main control dashboard
│   │   ├── Automations.tsx       # Automation management page
│   │   └── Settings.tsx          # Configuration page
│   ├── plugins/                  # Capacitor plugins
│   │   └── smart-board/
│   │       ├── index.ts          # Plugin interface definition
│   │       └── web.ts            # Web implementation (fallback)
│   ├── store/                    # State management
│   │   └── useAppStore.ts        # Zustand store with app state
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # App-wide interfaces
│   ├── App.tsx                   # Root component with routing
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles
│
├── android/                      # Android native project
│   ├── app/
│   │   ├── src/main/java/com/smart/board/
│   │   │   ├── MainActivity.java           # Main activity
│   │   │   ├── plugins/smartboard/
│   │   │   │   ├── SmartBoard.java         # Plugin implementation
│   │   │   │   ├── SmartBoardPlugin.java   # Capacitor plugin bridge
│   │   │   │   └── WebSocketManager.java   # WebSocket client
│   │   │   ├── services/
│   │   │   │   ├── AutomationService.java  # Background automation
│   │   │   │   └── OwwService.java         # Wake word detection
│   │   │   └── ui/
│   │   │       └── VoiceAssistantActivity.java  # Voice UI
│   │   ├── assets/oww/           # TensorFlow Lite models
│   │   │   ├── melspectrogram.tflite
│   │   │   ├── embedding_model.tflite
│   │   │   └── models/
│   │   │       ├── alexa.tflite
│   │   │       ├── hey_jarvis.tflite
│   │   │       └── ...
│   │   └── build.gradle          # Android app build config
│   ├── build.gradle              # Project-level Gradle config
│   └── capacitor.settings.gradle # Capacitor configuration
│
├── cpp/                          # C++ WebSocket server (optional)
│   ├── ws_server.cpp             # Boost.Beast WebSocket server
│   └── switches.json             # Switch state persistence
│
├── esp32/                        # ESP32 firmware (optional)
│   └── smartBoardSketch.ino      # Arduino sketch for ESP32
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   └── site.webmanifest          # Web manifest
│
├── icons/                        # App icons and splash screens
│
├── capacitor.config.json         # Capacitor configuration
├── vite.config.js                # Vite build configuration
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** 18+ and npm/bun/pnpm
- **Android Studio** (for Android development)
- **Java JDK** 17+
- **ESP32** or C++ environment (for hardware backend)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/kaushalkrishnax/smart-board.git
cd smart-board

# Install dependencies (using bun, npm, or pnpm)
bun install
# or
npm install
```

### Step 2: Run Development Server

```bash
# Start Vite dev server
bun run dev

# Access at http://localhost:5173
```

### Step 3: Build for Production

```bash
# Build the React app
bun run build

# Sync with Capacitor
bunx cap sync
```

### Step 4: Android Setup

```bash
# Open in Android Studio
bunx cap open android

# Or build directly
cd android
./gradlew assembleDebug
```

---

## ⚙️ Configuration

### App Configuration

The app stores configuration in `localStorage` (web) or `SharedPreferences` (Android):

```typescript
interface AppConfig {
  url: string;          // WebSocket server URL (ws://192.168.1.100:81)
  token: string;        // Authentication token
  switches: Switch[];   // Switch definitions
  owwModel: string;     // Wake word model (alexa, hey_jarvis, etc.)
}

interface Switch {
  id: number;          // Unique switch ID
  label: string;       // Display name
  state?: "ON" | "OFF"; // Current state (from server)
}
```

### Capacitor Configuration

`capacitor.config.json`:
```json
{
  "appId": "com.smart.board",
  "appName": "Smart Board",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 1000,
      "backgroundColor": "#0a0a0a",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

### Android Configuration

`android/app/build.gradle`:
- **compileSdk**: 36
- **minSdkVersion**: 24 (from root config)
- **targetSdkVersion**: 36
- **Namespace**: `com.smart.board`

Important Gradle settings:
```groovy
aaptOptions {
    noCompress "tflite"  // Don't compress TensorFlow Lite models
}
```

---

## 📱 Android Integration

### Custom Capacitor Plugin

The `SmartBoardPlugin` bridges React and Android native code:

**TypeScript Interface** (`src/plugins/smart-board/index.ts`):
```typescript
export interface SmartBoardPlugin {
  // Configuration
  setConfig(options: AppConfig): Promise<void>;
  getConfig(): Promise<AppConfig>;
  
  // WebSocket
  startWebSocket(): Promise<void>;
  stopWebSocket(): Promise<void>;
  sendAction(data: any): Promise<void>;
  
  // Automations
  startAutomationService(rules: { rules: any[] }): Promise<void>;
  getAutomations(): Promise<{ rules: any[] }>;
  setAutomations(options: { rules: any[] }): Promise<void>;
  
  // Voice
  getOwwModels(): Promise<{ models: string[] }>;
  
  // Utilities
  requestBatteryOpt(): Promise<void>;
  
  // Events
  addListener(eventName: string, callback: (data: any) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}
```

**Java Implementation** (`android/.../SmartBoardPlugin.java`):
- Annotated with `@CapacitorPlugin(name = "SmartBoard")`
- Methods use `@PluginMethod` annotation
- Communicates with `SmartBoard` implementation class
- Sends events to React via `notifyListeners()`

### WebSocket Manager

**`WebSocketManager.java`**:
- Uses **OkHttp** for WebSocket connections
- Thread-safe with `ConcurrentHashMap` for state
- Automatic reconnection logic
- JSON message parsing and routing
- Authentication token handling

Key features:
```java
public void connect(String url, String token) { ... }
public void sendMessage(String json) { ... }
public void disconnect() { ... }
```

### Automation Service

**`AutomationService.java`**:
- Runs as a **foreground service** with persistent notification
- Uses **SensorManager** for accelerometer and proximity
- Implements shake detection algorithm:
  - Threshold: 2.7G acceleration
  - Time window: 500ms slop, 3000ms reset
  - Prevents false triggers

**Triggers Supported**:
1. **Shake**: Detects rapid phone movement
2. **Face Up**: Phone placed face-up on surface
3. **Face Down**: Phone placed face-down
4. **Proximity**: Object near the phone
5. **Wake Word**: Voice activation (via OwwService)

**Automation Rule Format**:
```json
{
  "id": "shake",
  "title": "Shake Phone",
  "trigger": "shake",
  "enabled": true,
  "actions": [
    { "id": 1, "state": "ON" },
    { "id": 2, "state": "OFF" }
  ]
}
```

### OpenWakeWord Service

**`OwwService.java`**:
- Real-time wake word detection using **TensorFlow Lite**
- Three-stage processing pipeline:
  1. **Melspectrogram**: Convert audio to frequency representation
  2. **Embedding**: Extract acoustic features
  3. **Wake Word Model**: Classify wake word

**Audio Processing**:
- **Sample Rate**: 16 kHz
- **Buffer Size**: 1760 samples with 480-sample overlap
- **Gain**: 100x amplification
- **Format**: 16-bit PCM mono
- **Threshold**: 0.5 (50% confidence)

**Models Included**:
- `alexa.tflite`
- `hey_jarvis.tflite`
- `hey_mycroft.tflite`
- `hey_rhasspy.tflite`

**Thread Management**:
- Runs on dedicated high-priority thread
- Atomic boolean for lifecycle management
- AudioRecord with 44.1kHz sample rate

---

## 🔌 Hardware Setup

### Option 1: ESP32 Server

**Hardware Requirements**:
- ESP32 development board
- 2-channel relay module (5V trigger)
- Push buttons (x2) for manual control
- 5V power supply
- Jumper wires
- Optional: Enclosure for safety

**Pin Configuration** (`esp32/smartBoardSketch.ino`):
```cpp
// Relay control pins (active LOW)
int relayPins[] = {2, 4};     // GPIO 2, GPIO 4

// Physical button pins (INPUT_PULLUP)
int buttonPins[] = {5, 18};   // GPIO 5, GPIO 18

// WiFi credentials
const char* ssid = "SmartBoard";
const char* password = "12345678";

// Authentication token
String validToken = "abc123";
```

**Wiring Diagram**:
```
Relay Module:
  ESP32 GPIO 2  → Relay 1 IN
  ESP32 GPIO 4  → Relay 2 IN
  ESP32 GND     → Relay GND
  5V Power      → Relay VCC

Physical Buttons (Manual Override):
  ESP32 GPIO 5  → Button 1 (one side)
  ESP32 GPIO 18 → Button 2 (one side)
  GND           → Button common (other side)
  
Note: Buttons use INPUT_PULLUP, connect one side to GPIO and other to GND
```

**Features**:
- **WiFi Access Point**: Creates its own network (SSID: "SmartBoard")
- **WebSocket Server**: Port 81 for real-time communication
- **Token Authentication**: Validates all requests with token
- **Manual Control**: Physical buttons with debouncing (50ms)
- **In-Memory State**: Switches initialize to OFF on boot
- **JSON Protocol**: Structured messaging for all operations
- **Active-Low Relays**: GPIO LOW = Relay ON, GPIO HIGH = Relay OFF
- **Broadcast Updates**: All connected clients receive state changes

**Button Behavior**:
- Press physical button to toggle corresponding switch
- Debounced to prevent false triggers
- State changes broadcast to all WebSocket clients
- Works independently of app connection

**Upload Firmware**:
```bash
# Using Arduino IDE
1. Install ESP32 board support:
   - File → Preferences → Additional Board Manager URLs
   - Add: https://dl.espressif.com/dl/package_esp32_index.json
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. Install required libraries:
   - Tools → Manage Libraries
   - Install: ArduinoJson (by Benoit Blanchon)
   - Install: WebSockets (by Markus Sattler)
   - WiFi library is built-in for ESP32

3. Configure and upload:
   - Open smartBoardSketch.ino
   - Tools → Board → "ESP32 Dev Module"
   - Tools → Port → Select your ESP32 port
   - Click Upload

4. Monitor serial output:
   - Tools → Serial Monitor (115200 baud)
   - Note the Access Point IP (usually 192.168.4.1)
```

**First Time Setup**:
1. Upload firmware to ESP32
2. Power on the ESP32
3. Connect your phone to WiFi network "SmartBoard" (password: 12345678)
4. Open Smart Board app
5. Go to Settings
6. Set WebSocket URL: `ws://192.168.4.1:81`
7. Set Token: `abc123`
8. Save and return to Home

**Customization**:
- Change relay pins by modifying `relayPins[]` array
- Change button pins by modifying `buttonPins[]` array
- Update WiFi credentials in `ssid` and `password`
- Change authentication token in `validToken`
- Adjust debounce delay (default: 50ms) in `debounceDelay`

### Option 2: C++ WebSocket Server

**Dependencies**:
- Boost.Beast (WebSocket)
- Boost.Asio (Networking)
- nlohmann/json (JSON parsing)

**Compilation**:
```bash
cd cpp
g++ -std=c++17 ws_server.cpp -o ws_server \
    -lboost_system -lboost_thread -lpthread
./ws_server
```

**Features**:
- High-performance C++ server
- Port 8080 (configurable)
- JSON state persistence
- Multi-client support
- Broadcast to all connected clients

---

## 🛠️ Development

### Running the App

```bash
# Web development
bun run dev

# Android with live reload
bunx cap run android --livereload --external

# Build and sync
bun run build && bunx cap sync
```

### Adding a New Automation Trigger

1. **Define in TypeScript** (`src/types/index.ts`):
```typescript
trigger: "shake" | "faceup" | "facedown" | "proximity" | "newTrigger"
```

2. **Add UI** (`src/components/Automation.tsx`):
```tsx
<option value="newTrigger">New Trigger</option>
```

3. **Implement in Android** (`AutomationService.java`):
```java
private void initNewTriggerSensor() {
  // Register sensor listener
}

private void checkNewTrigger() {
  // Trigger logic
  triggerAutomationsWithTrigger("newTrigger");
}
```

### Adding a New Wake Word Model

1. **Add TFLite Model**: Place in `android/app/src/main/assets/oww/models/my_word.tflite`

2. **Update List** (`SmartBoard.java`):
```java
public List<String> getOwwModels() {
  return Arrays.asList("alexa", "hey_jarvis", ..., "my_word");
}
```

3. **Select in Settings**: Model appears in dropdown automatically

### Debugging

**Android Logs**:
```bash
# Filter by tag
adb logcat | grep "SmartBoard"
adb logcat | grep "WSManager"
adb logcat | grep "AutomationService"
adb logcat | grep "OWW"

# View full logs
adb logcat
```

**React DevTools**:
- Install browser extension
- Inspect component state
- Monitor Zustand store updates

**WebSocket Traffic**:
```javascript
// Enable in SmartBoardPlugin
console.log("WS Send:", json);
console.log("WS Receive:", text);
```

---

## 📦 Building

### Android APK

```bash
# Debug build
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Release build (requires signing)
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (AAB)

```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Release Signing

Create `release-key.jks`:
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias smart-board
```

Set environment variables:
```bash
export KEY_ALIAS=smart-board
export KEYSTORE_PASSWORD=your_password
export KEY_PASSWORD=your_password
```

Build:
```bash
./gradlew assembleRelease
```

---

## 📡 API Documentation

### WebSocket Protocol

#### Client → Server Messages

**Authentication**:
```json
{
  "type": "auth",
  "token": "ESP-SECRET"
}
```

**Toggle Switch**:
```json
{
  "type": "toggle",
  "id": 1,
  "state": "ON",
  "token": "ESP-SECRET"
}
```

**All Switches**:
```json
{
  "type": "all",
  "state": "ON",
  "token": "ESP-SECRET"
}
```

#### Server → Client Messages

**Authentication Success**:
```json
{
  "type": "auth",
  "msg": "OK"
}
```

**Switch State Update**:
```json
{
  "type": "switches",
  "switches": [
    {"id": 1, "state": "ON"},
    {"id": 2, "state": "OFF"}
  ]
}
```

**Connection Status**:
```json
{"type": "connected"}
{"type": "closed"}
{"type": "error", "message": "Invalid token"}
```

### Capacitor Plugin API

See full interface in [Android Integration](#android-integration) section.

**Example Usage**:
```typescript
import { SmartBoard } from "./plugins/smart-board";

// Save configuration
await SmartBoard.setConfig({
  url: "ws://192.168.1.100:81",
  token: "ESP-SECRET",
  switches: [
    { id: 1, label: "Fan" },
    { id: 2, label: "Light" }
  ],
  owwModel: "alexa"
});

// Start WebSocket
await SmartBoard.startWebSocket();

// Listen for events
SmartBoard.addListener("esp_event", (data) => {
  console.log("Received:", data);
});

// Send action
await SmartBoard.sendAction({
  type: "toggle",
  id: 1,
  state: "ON",
  token: "ESP-SECRET"
});
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **OpenWakeWord** - On-device wake word detection
- **Capacitor** - Cross-platform native runtime
- **TensorFlow Lite** - Mobile ML inference
- **Boost.Beast** - C++ WebSocket library
- **ESP32 Community** - Arduino libraries and examples

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing discussions
- Review the code and documentation

---

**Made with ❤️ by Kaushal Krishna**

Smart Board is a small React (Vite) + Capacitor application that lets you control a set of remote "switches" in real time over a WebSocket connection. The app is designed to run in the browser and on Android devices.

## Key features

- Real-time control of switches via WebSocket.
- Simple, mobile-first UI built with React and Tailwind.
- Works as a web app and as a Capacitor-wrapped Android app.
- Small, extensible WebSocket protocol (auth, toggle, all, switches updates).

## Tech stack

- Frontend: React 19, Vite, TailwindCSS
- Mobile wrapper: Capacitor
- PWA support via `vite-plugin-pwa`
- Tooling: ESLint

## Quick start (development)

Prerequisites:

- Node.js (22+ recommended) and bun
- Android Studio (for building/running on Android)

Install dependencies:

```bash
bun install
```

Run the dev server (hot reload):

```bash
bun run dev
```

Open http://localhost:5173 in your browser (Vite will print the exact URL).

Notes:

- The app's React entry is `src/main.jsx`. The router exposes two pages: `Home` (main control surface) and `Settings` (where you set WebSocket address and token).
- The Socket connection details (address + token) are stored in app settings and consumed by `src/context/SocketContext.jsx`.

## Build for production

```bash
bun run build
```

This outputs the production files into the `dist/` directory (see `capacitor.config.json`).

To preview the production build locally:

```bash
bun run preview
```

## Capacitor / Android

Capacitor is configured with `webDir: "dist"` in `capacitor.config.json`, so you must run a production build or a preview build before copying web assets into the native project.

Typical steps to run on Android (first time):

```bash
bun run build
bunx cap copy android
bunx cap open android
```

Then build/run the Android project from Android Studio or use `bunx cap run android`.

If you want to iterate faster on device while developing, you can run the dev server and use a live web URL, but you'll need to configure Capacitor and Android to load a remote URL (not covered here).

## WebSocket protocol (what the app expects)

The frontend's socket logic is in `src/context/SocketContext.jsx`. The app expects a WebSocket server that speaks the following simple JSON messages:

- Client -> Server (authenticate immediately on open):

```json
{ "type": "auth", "token": "<token string>" }
```

- Server -> Client (initial or updated switches state):

```json
{ "type": "switches", "switches": [ { "id": "1", "state": "ON" }, { "id": "2", "state": "OFF" } ] }
```

- Client -> Server (toggle a single switch):

```json
{ "type": "toggle", "id": "<id>", "state": "ON" }
```

- Client -> Server (set all):

```json
{ "type": "all", "state": "OFF" }
```

The client will send `auth` on connect and expects periodic or event-driven `switches` messages to update UI. The client also sends `toggle` and `all` messages when the user interacts with the UI.

If you implement a server, mirror these message shapes. The app logs invalid JSON and will warn if no `settings.address` is configured.

## Configuration (in-app)

- Open the app and go to the Settings page. Save the WebSocket address (e.g. `ws://192.168.1.50:8080`) and the token. The UI uses those settings to open the socket.
- If the WebSocket address is missing, the app will not attempt a connection and prints a warning to the console.

## Project structure (important files)

- `src/` — React source
	- `main.jsx` — app bootstrap
	- `App.jsx` — router + layout
	- `context/SocketContext.jsx` — WebSocket handling and API used by UI
	- `context/AppContext.jsx` — app-wide settings/state (settings, tokens)
	- `components/` — UI components (BottomNav, etc.)
	- `pages/` — `Home.jsx`, `Settings.jsx`
- `capacitor.config.json` — Capacitor settings (webDir = dist)
- `package.json` — scripts and dependencies

## Troubleshooting

- "WebSocket disconnected" or no switches visible: verify `settings.address` is correct and the server is reachable from the device. Check browser/Android logs.
- Invalid JSON messages are logged by the client; ensure your server sends valid JSON.
- If tokens are rejected, ensure the server's auth behavior matches the `auth` message shape above.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo, create a branch for your change.
2. Keep changes small and well-scoped.
3. Open a pull request with a clear description.

Please run lint before opening PRs:

```bash
bun run lint
```

## License

This project does not include a license file. If you want to add a license, create a `LICENSE` file in the repository root (MIT is common for small projects).

## Contact / Notes

If you want help wiring the server or improving the mobile build flow, tell me which platform you want to target (local network Android, remote server, ngrok, etc.) and I can add step-by-step instructions.

---

