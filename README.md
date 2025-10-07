
## AI Calendar — AI-assisted planner (日本語/English)

> JP: チャットで「書くだけ」で予定・タスクを登録できるカレンダー。AI が自然言語から日時を抽出し、あなたのアカウントに保存します。主目的は、日々の計画立案を自動化し、**生産性と効率を高める**ことです。
>
> EN: A chat-assisted calendar where you simply type your plans; AI extracts dates/times and saves events to your account. Its primary goal is to automate planning and boost **productivity and efficiency**.

[Live demo / デモを見る](https://ai-calender-iota.vercel.app/task)

---

## Overview / 概要

### 日本語
- **チャット**で予定作成
- Gemini を用いた**自然言語→イベント情報**の抽出（タイトル/日付/時間 など）
- **Clerk** による認証（ユーザーごとにデータ分離）
- **Supabase** の Postgres にイベント保存
- **Next.js App Router** + **TypeScript** + **Tailwind CSS 4**

### English
- Create events via **chat**
- Extract structured events (title/date/time) with **Gemini**
- **Clerk** authentication; per-user data isolation
- Persist events in **Supabase** Postgres
- Built with **Next.js App Router**, **TypeScript**, **Tailwind CSS 4**

---

## Tech Stack / 技術スタック

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS v4
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Supabase Postgres (`@supabase/supabase-js`)
- **AI**: Google Gemini (`@google/generative-ai`)
- **Validation**: Zod (`zod`)
 
- **Deploy**: Vercel

---

## Features / 機能

- 📈 生産性・効率向上に焦点（計画の自動化）
- 🤖 自然言語から日付・時間・タイトルを抽出（Gemini）
- 💬 チャットで計画相談 → 7日間の自動スケジューリング
- 🔐 Clerk 認証 & ユーザー別データ
- 🗂 イベントの作成・取得・削除 API
- 📅 月ビューのカレンダー UI、日別タイムライン

- 📈 Focused on productivity and efficiency (automated planning)
- 🤖 AI parsing from natural language (Gemini)
- 💬 Chat planning → auto 7‑day schedule
- 🔐 Clerk auth & per‑user data
- 🗂 CRUD APIs for events
- 📅 Month calendar UI and daily timeline

---

## Getting Started / セットアップ

### 1) Requirements / 必要条件
- Node.js 18+
- A Supabase project (database `events` table)
- Clerk project (publishable/secret keys)
- Gemini API key

### 2) Install / 依存関係のインストール
```bash
npm install
```

### 3) Environment variables / 環境変数
Create `.env.local`:
```bash
# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
# Optional (server-only, if you enforce RLS writes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Gemini (AI)
GEMINI_API_KEY=your_server_side_key
# Optional model override
GEMINI_MODEL=gemini-2.0-flash
# Optional client-side key (used for client-side fallbacks)
NEXT_PUBLIC_GEMINI_API_KEY=your_client_side_key
```

### 4) Run / 実行
```bash
npm run dev
```
Open `http://localhost:3000`.

---

## Architecture / アーキテクチャ

- `src/app/api/chat/route.ts` — Gemini とのストリーミング会話（メモリ付き）
- `src/app/api/parse/route.ts` — テキストから単一イベントを抽出
- `src/app/api/plan/route.ts` — 直近 7 日のスケジュール案を JSON で生成
- `src/app/api/event/route.ts` — イベントの取得/作成/削除（Clerk 認証必須）
- `src/lib/chatMemory.ts` — セッション別の**プロセス内メモリ**（Map）。デプロイ間で共有されません
- `src/lib/supabase.ts` / `src/lib/supabaseClient.ts` — Supabase クライアント（サーバー/クライアント用）
- `src/middleware.ts` — Clerk ミドルウェア（ページ保護、API の公開範囲制御）

Database table (`events`):
```text
id: string (uuid)
title: string (<=120)
description?: string
start_time: string (ISO)
end_time: string (ISO)
user_id: string (Clerk userId)
created_at?: string (ISO)
```

Note: Current implementation filters by `user_id` in API handlers. If you enable Supabase RLS, configure policies to allow inserts/selects where `user_id = auth.uid()` or use service role on server.

---

## API Reference / API リファレンス

All responses are JSON unless noted.

### POST `/api/chat` — stream reply (text/plain)
Body:
```json
{ "sessionId": "string", "userText": "string" }
```
Notes:
- Streams plain text; conversation memory is stored in‑process.
- Use `DELETE /api/chat` to clear a session.

### DELETE `/api/chat`
Body:
```json
{ "sessionId": "string" }
```

### POST `/api/parse` — extract one event
Body:
```json
{ "text": "Schedule dinner next Friday at 7pm" }
```
Response (example):
```json
{ "title": "Dinner", "date": "2025-10-10", "time": "19:00", "endTime": "20:00" }
```

### POST `/api/plan` — generate 7‑day plan from chat history
Body:
```json
{ "sessionId": "string" }
```
Response:
```json
[
  { "title": "Workout", "date": "2025-10-08", "time": "18:00" }
]
```

### GET `/api/event` — list events (requires Clerk auth)
Response:
```json
[
  {
    "id": "...",
    "title": "...",
    "start_time": "2025-10-08T09:00:00.000Z",
    "end_time": "2025-10-08T10:00:00.000Z",
    "description": "",
    "user_id": "user_..."
  }
]
```

### POST `/api/event` — create event (requires Clerk auth)
Body:
```json
{
  "title": "Team meeting",
  "description": "",
  "start_time": "2025-10-08T09:00:00.000Z",
  "end_time": "2025-10-08T10:00:00.000Z"
}
```

### DELETE `/api/event` — delete event (requires Clerk auth)
Body:
```json
{ "id": "uuid" }
```

Rate limiting: Event API includes a naive per‑user+ip limiter (memory, per instance).

---

## Chat UX / チャットの UX

- `src/components/AIChatPanel.tsx` streams replies from `/api/chat` and may fall back to client‑side Gemini if the server call fails.
- Note / 注記: 音声入力は現在未対応です。

---

## Scripts / スクリプト

- `npm run dev` — 開発サーバー起動
- `npm run build` — 本番ビルド
- `npm start` — 本番起動
- `npm run download-model` — `public/model.zip` を取得（任意機能）

---

## Deployment / デプロイ

- Vercel 推奨。上記の環境変数をすべて設定してください。
- プロセス内メモリ（チャット履歴/レート制限）は**サーバーレス環境で共有されません**。必要に応じて外部ストア（KV 等）への移行を検討してください。

---

## Notes / 補足

- 本リポジトリ名は `ai calender` ですが、アプリの性質上 "AI Calendar" と表記しています。
- ライセンス表記は未定義です。必要に応じて追加してください。

