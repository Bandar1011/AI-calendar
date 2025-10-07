AIカレンダー（AI Calendar）

デモ: [https://ai-calender-iota.vercel.app/task](https://ai-calender-iota.vercel.app/task)

概要 (Overview)

音声/テキストで指示 → Gemini が解析 → Supabase に予定/タスクを保存

認証は Clerk。フロントから秘密鍵は出しません（server-only LLM）

機能 (Features)

音声入力（Web Speech API）／テキスト指示

AI 解析 → タイトル・開始/終了・期限・メモ生成

ユーザー単位のタスク/イベント（作成・編集・完了・一覧）

カレンダー表示（月/週/日）

LLM 呼び出しは サーバー側のみ（クライアントに鍵を露出しない）

技術スタック (Tech Stack)

Next.js (App Router), TypeScript, Tailwind, shadcn/ui

Clerk (Auth)

Supabase Postgres + Prisma

Gemini (LLM)

デプロイ: Vercel

アーキテクチャ (Architecture)
UI → /api/chat (server) → Gemini 正規化 → Zod等で検証 → Prisma 経由で Supabase 書き込み


チャットのメモリ: 現状は プロセス内 Map（インスタンスごとに揮発）。
将来: Redis/Upstash または TTL 付きテーブルで永続化。

API

POST /api/chat → { sessionId, userText } を受け取り、テキストをストリーム返却

DELETE /api/chat → { sessionId } のメモリを消去

（将来）POST /api/event/bulk → 複数イベントを一括挿入（個別成功/失敗の結果を返す）

環境変数 (Env)
# LLM
GEMINI_API_KEY=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Database (Supabase Postgres via Prisma)
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/db"

# (もしブラウザで Supabase クライアントも使うなら)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...


重要 (Important): 秘密鍵は必ずサーバー側に保持。GEMINI_API_KEY をクライアントへ出さない。

使い方 (Getting Started)
npm i
cp .env.example .env.local   # 上の変数を設定
npm run dev
# http://localhost:3000 を開く

データとセキュリティ (Data & Security)

Auth: Clerk セッションをサーバールートで検証

RLS（Supabase クライアント使用時）: 行レベルセキュリティ有効化＋user_id スコープ

Secrets: LLM/DB 書き込みは /api/* （server-only）

Memory: いまは揮発的 → Redis/Upstash or TTL テーブルへ移行予定

RLS 例 (Example)
alter table events enable row level security;

create policy "insert own" on events
for insert with check (auth.uid() = user_id);

create policy "select own" on events
for select using (auth.uid() = user_id);

create policy "update own" on events
for update using (auth.uid() = user_id);

create policy "delete own" on events
for delete using (auth.uid() = user_id);


注意 (Note): Supabase Auth の JWT を使わず Clerk で認証している場合、
クライアント任せにせず サーバー側ハンドラで user_id を検証（service key 経由）してください。
