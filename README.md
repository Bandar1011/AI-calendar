[ai-calender-iota.vercel.app](https://ai-calender-iota.vercel.app/task)

AI Calendar / AIカレンダー

EN: Voice/text to calendar. Type or speak tasks/events; the app uses Gemini to parse and saves them to Supabase under your account (auth via Clerk).
JP: 音声・テキストで予定を追加。内容を Gemini で解析し、Clerk 認証のユーザーごとに Supabase に保存します。

Features / 機能

EN

Voice input (Web Speech API) and text commands

AI parsing → title, start/end, deadline, notes

Per-user tasks/events (create/edit/complete/list)

Calendar views (month/week/day)

Server-side LLM calls (no keys in client)

JP

音声入力（Web Speech API）／テキスト指示

AI 解析 → タイトル・開始/終了・期限・メモ

ユーザー単位のタスク/イベント管理（作成・編集・完了・一覧）

カレンダー表示（月/週/日）

LLM 呼び出しはサーバー側（クライアントに鍵を露出しない）

Tech Stack / 技術スタック

EN: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Clerk (auth), Supabase Postgres + Prisma, Gemini

JP: Next.js（App Router）, TypeScript, Tailwind, shadcn/ui, Clerk（認証）, Supabase Postgres + Prisma, Gemini

Architecture / アーキテクチャ

EN:
UI → /api/chat (server) → Gemini (normalize) → validate → DB write (Supabase via Prisma).
Memory for chat is currently in-process (Map): ephemeral per instance.

JP:
UI → /api/chat（サーバー）→ Gemini（正規化）→ 検証 → DB 書き込み（Prisma 経由で Supabase）。
チャットのメモリは現状プロセス内（Map）＝インスタンス単位で揮発。

API

EN

POST /api/chat → { sessionId, userText } → streams text back

DELETE /api/chat → { sessionId } → clears memory

(Roadmap) POST /api/event/bulk → insert many events with per-item results

JP

POST /api/chat → { sessionId, userText } → テキストをストリーム返却

DELETE /api/chat → { sessionId } → メモリ消去

※将来：POST /api/event/bulk → 複数イベントを一括挿入（個別結果付き）

Environment / 環境変数
# LLM
GEMINI_API_KEY=...

# Clerk (Next.js)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Database (Supabase Postgres via Prisma)
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/db"
# (If you also use Supabase client in the browser, add:)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...


EN: Keep all secrets server-side. Do not expose GEMINI_API_KEY in the client.

JP: 秘密鍵は必ずサーバー側に保持。GEMINI_API_KEY をクライアントへ出さないこと。

Getting Started / 使い方

EN

npm i
cp .env.example .env.local   # or create .env.local with the vars above
npm run dev
# open http://localhost:3000


JP

npm i
cp .env.example .env.local   # 上記の環境変数を設定
npm run dev
# http://localhost:3000 を開く

Data & Security / データとセキュリティ

EN

Auth: Clerk sessions verified on server routes.

RLS (if using Supabase client): enable Row-Level Security; scope by user_id.

No secrets in client: LLM & DB writes happen in route handlers (/api/*).

Memory: in-process Map → use Redis/Upstash or a Supabase table with TTL for durability.

JP

認証: Clerk のセッションをサーバールートで検証。

RLS（Supabase クライアント使用時）: 行レベルセキュリティを有効化し user_id で制限。

クライアントに秘密鍵を置かない: LLM/DB 書き込みは サーバーの API で実行。

メモリ: 現状はプロセス内 Map → 永続化には Redis/Upstash か TTL 付き Supabase テーブルへ。

Example RLS (generic) / RLS 例（汎用）

alter table events enable row level security;

create policy "insert own" on events
for insert with check (auth.uid() = user_id);

create policy "select own" on events
for select using (auth.uid() = user_id);

create policy "update own" on events
for update using (auth.uid() = user_id);

create policy "delete own" on events
for delete using (auth.uid() = user_id);


Note / 注意: If you authenticate with Clerk and don’t use Supabase Auth JWT, enforce user_id checks in your server handlers (service key) instead of relying on auth.uid() from the client.
Supabase Auth を使わず Clerk で認証する場合は、クライアント任せにせず サーバー側のハンドラで user_id を検証してください。
