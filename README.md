<<<<<<< HEAD
# Antigravity AI - Chat Assistant Mobile App
=======
# Chat Assistant Mobile App
>>>>>>> 1a245fcd771c97e90ef5c4bd5968b576268278fb

A production-ready React Native Expo mobile application built with TypeScript, Redux Toolkit, SQLite, and NativeWind (Tailwind CSS). The application allows users to configure and interact with multiple AI providers (OpenAI, Google Gemini, OpenRouter, LM Studio, or custom endpoints), switch models per conversation, read histories offline, search through titles/messages, and read responses out loud via Text-to-Speech.

Developed to run natively on iOS, Android, and Web platforms inside the standard **Expo Go** environment.

---

## 📸 Reference Designs & Aesthetic

The application is styled with a premium, human-crafted dark indigo theme:
- **Background**: Deep Slate / Black (`#0B0F19`)
- **Card Elements**: Deep Navy (`#151C2C`)
- **Accent Elements**: Electric Indigo (`#6366F1`) & Soft Purple (`#8B5CF6`)
- **Typography**: Responsive, high-contrast Slate/White fonts with elegant micro-animations for inputs, speech recorders, and message bubbles.

---

## 🛠️ Technology Stack & Dependencies

- **Core Framework**: React Native & Expo SDK 56 (stable)
- **Navigation**: Expo Router (file-based Stack and Tabs)
- **State Management**: Redux Toolkit (React Redux) with async thunk database sync
- **Local Database**: `expo-sqlite` (pure async queries, WAL-mode, schema versioned)
- **Local Storage**: `AsyncStorage` (for lightweight theme preferences)
- **Networking**: Axios & native `fetch` (with `TextDecoder` SSE stream reader)
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: NativeWind & Tailwind CSS (v4 compatible)
- **Animations**: React Native Reanimated (v3) for waveforms and fade-in entry transitions
- **Markdown Rendering**: `react-native-markdown-display` (highly customized for light/dark themes)
- **Voice/Speech**: `expo-speech` for TTS readouts, and simulated microphone recording waves for Voice Input.

---

<<<<<<< HEAD
## 📂 Architecture Layout (Clean Architecture)

We adhere strictly to Clean Architecture principles in `src/`:

```
src/
├── app/                  # Routing & Entry Pages (Expo Router)
│   ├── (tabs)/           # Tab navigation (Chat list, Search, Settings)
│   ├── chat/             # Active Chat Screen [id].tsx
│   ├── _layout.tsx       # Root entry & SQLite bootstrap
│   └── new-chat.tsx      # Modal to compose new conversation
├── core/                 # Shared Infrastructure
│   ├── constants/        # Default endpoints & model configs
│   ├── errors/           # Custom AppErrors (Network, Auth, RateLimit, DB)
│   ├── theme/            # Theme tokens & palettes
│   └── types/            # TypeScript interfaces (Messages, Settings)
├── data/                 # Data Access Details
│   ├── database/         # SQLite DB client & migrations script
│   └── repositories/     # SQLite repositories implementations
├── domain/               # Domain Business Logic
│   └── repositories/     # Repository contracts (Interfaces)
├── services/             # Application Services
│   ├── ai/               # AI Provider adapters & Factory
│   └── speech/           # Text-To-Speech engine
├── store/                # Redux state slices & store setup
├── components/           # Atomic UI elements & Markdown renderer
└── global.css            # Tailwind directives
```

---

## 🗄️ Database Schema

Three local tables are maintained in `antigravity.db`:

### 1. `conversations`
- `id` (TEXT PRIMARY KEY) - UUID v4
- `title` (TEXT NOT NULL)
- `created_at` (TEXT) - ISO Timestamp
- `updated_at` (TEXT) - ISO Timestamp
- `provider_id` (TEXT, REFERENCES providers(id) ON DELETE SET NULL)

### 2. `messages`
- `id` (TEXT PRIMARY KEY) - UUID v4
- `conversation_id` (TEXT, REFERENCES conversations(id) ON DELETE CASCADE)
- `role` (TEXT) - 'user' | 'assistant'
- `content` (TEXT NOT NULL)
- `timestamp` (TEXT) - ISO Timestamp

### 3. `providers`
- `id` (TEXT PRIMARY KEY) - e.g., 'openai', 'gemini'
- `provider_name` (TEXT) - 'openai' | 'gemini' | 'openrouter' | 'lmstudio' | 'custom'
- `base_url` (TEXT) - Base API endpoint
- `api_key` (TEXT) - Encrypted/masked credential
- `model` (TEXT) - Model name identifier

---

## ⚡ AI Integration Layer (Factory Pattern)

The application uses an abstract `AIProvider` interface to manage network communication, making the UI layer completely provider-agnostic. The `ProviderFactory` creates the correct concrete adapter at runtime:

- **`OpenAIProvider`**: Connects to the standard OpenAI API (`/chat/completions`) using stream chunks.
- **`GeminiProvider`**: Calls Google's Generative AI API using `streamGenerateContent` with the `alt=sse` query parameter to parse standard Server-Sent Events natively.
- **`OpenRouterProvider`**: Passes custom dashboard headers (`HTTP-Referer` and `X-Title`) to list app usage stats correctly.
- **`LMStudioProvider`**: Interfaces with local endpoints (e.g. `http://localhost:1234/v1`) without requiring API key authorization.

---

## 🚀 How to Run the App Locally

### 1. Prerequisite Installations
Make sure you have Node.js (v20+) and Git installed.

### 2. Clone the repository and install dependencies
```bash
cd AI-Chat-App
npm install
```

### 3. Start the Expo developer bundler
```bash
npm run start
```
*Press `a` to run on an Android device/emulator, or `w` to run on a Web Browser.*

### 4. Running inside standard **Expo Go**
- Download the **Expo Go** app from the iOS App Store or Android Google Play Store.
- Scan the QR code displayed in your terminal using your phone camera (iOS) or the Expo Go scanner (Android).

---

## 🧪 Verification & Linting

Verify TypeScript compiles cleanly without errors:
```bash
npx tsc --noEmit
```
=======
## 🗄️ Database Schema

Three local tables are maintained in `antigravity.db`:

### 1. `conversations`
- `id` (TEXT PRIMARY KEY) - UUID v4
- `title` (TEXT NOT NULL)
- `created_at` (TEXT) - ISO Timestamp
- `updated_at` (TEXT) - ISO Timestamp
- `provider_id` (TEXT, REFERENCES providers(id) ON DELETE SET NULL)

### 2. `messages`
- `id` (TEXT PRIMARY KEY) - UUID v4
- `conversation_id` (TEXT, REFERENCES conversations(id) ON DELETE CASCADE)
- `role` (TEXT) - 'user' | 'assistant'
- `content` (TEXT NOT NULL)
- `timestamp` (TEXT) - ISO Timestamp

### 3. `providers`
- `id` (TEXT PRIMARY KEY) - e.g., 'openai', 'gemini'
- `provider_name` (TEXT) - 'openai' | 'gemini' | 'openrouter' | 'lmstudio' | 'custom'
- `base_url` (TEXT) - Base API endpoint
- `api_key` (TEXT) - Encrypted/masked credential
- `model` (TEXT) - Model name identifier

---

## ⚡ AI Integration Layer (Factory Pattern)

The application uses an abstract `AIProvider` interface to manage network communication, making the UI layer completely provider-agnostic. The `ProviderFactory` creates the correct concrete adapter at runtime:

- **`OpenAIProvider`**: Connects to the standard OpenAI API (`/chat/completions`) using stream chunks.
- **`GeminiProvider`**: Calls Google's Generative AI API using `streamGenerateContent` with the `alt=sse` query parameter to parse standard Server-Sent Events natively.
- **`OpenRouterProvider`**: Passes custom dashboard headers (`HTTP-Referer` and `X-Title`) to list app usage stats correctly.
- **`LMStudioProvider`**: Interfaces with local endpoints (e.g. `http://localhost:1234/v1`) without requiring API key authorization.

---

## 🚀 How to Run the App Locally

### 1. Prerequisite Installations
Make sure you have Node.js (v20+) and Git installed.

### 2. Clone the repository and install dependencies
```bash
cd AI-Chat-App
npm install
### 3. Start the Expo developer bundler
bash


npm run start
Press a to run on an Android device/emulator, or w to run on a Web Browser.

4. Running inside standard Expo Go
Download the Expo Go app from the iOS App Store or Android Google Play Store.
Scan the QR code displayed in your terminal using your phone camera (iOS) or the Expo Go scanner (Android).
>>>>>>> 1a245fcd771c97e90ef5c4bd5968b576268278fb
