AIカレンダー（AI Calendar）

vercel: https://ai-calender-iota.vercel.app/task

[EN] A smart calendar that plans day-to-life schedules toward your goals.

概要 (Overview)

生活の目標・習慣・制約（学校/仕事/睡眠/移動/休憩など）を前提に、一日の実行計画から長期プランまでを自動で組み立てるライフプランニング・カレンダー。

予定やタスクを受け取り、衝突回避・優先度・所要時間・締切を考慮して配置・再配置。

データはユーザー単位で Supabase に保存、認証は Clerk。LLM は サーバー側で実行。

[EN] Goal-focused planner: from daily schedule to long-term roadmap; per-user data with Clerk + Supabase; server-side LLM.

できること（現状） / Current

タスク/イベントの作成・編集・完了・一覧

カレンダー表示（月/週/日）

目標・締切・所要時間を含む構造化データへの正規化（Gemini）

タイムゾーン対応（例：Asia/Tokyo）

サーバー API（/api/*）経由で DB 書き込み（Prisma → Supabase）
[EN] CRUD for tasks/events, calendar views, LLM normalization, TZ-aware, server API writes.

目標（プロダクトとして） / Vision

ライフプラン：学期/四半期/年の目標 → 週次テンプレート → 日次実行へブレークダウン

スマート配置：優先度・締切・所要時間・集中度（午前/午後）・休憩比率を考慮して自動割当

衝突解決：会議/授業/移動を避けて再配置、ドラフト差分を提示して確認

再平衡：未消化タスクを翌日/週へロール、週末に振り返りと次週計画

バルク操作：複数イベントの一括登録・一括更新
[EN] Life goals → weekly templates → daily plan; conflict-aware auto-scheduling; bulk ops; review & rebalancing.

技術スタック (Tech Stack)

Next.js (App Router), TypeScript, Tailwind, shadcn/ui

Clerk（Auth）, Supabase Postgres + Prisma

Gemini（LLM 正規化・推論）, デプロイ: Vercel
[EN] Next.js/TS/Tailwind/shadcn + Clerk + Supabase(Postgres)/Prisma + Gemini; deployed on Vercel.

アーキテクチャ (Architecture)
UI
  └─ /api/chat (server) ──> Gemini で正規化
          └─ 検証(Zod等) ──> Prisma ──> Supabase(Postgres)


LLM はサーバー側のみ。秘密鍵はクライアントに露出しない。

予定保存はユーザーIDでスコープ。
[EN] Server-only LLM; validated then persisted; per-user scope.

API（抜粋）

POST /api/chat：{ sessionId, userText } → 解析結果をストリーム返却

DELETE /api/chat：{ sessionId } → セッションメモリ消去

（Roadmap）POST /api/event/bulk：複数イベントを一括挿入（個別成功/失敗を返却）
[EN] Chat parse endpoint and planned bulk event insert.

環境変数 (Env)
# LLM
GEMINI_API_KEY=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Database (Supabase Postgres via Prisma)
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/db"

# (ブラウザで Supabase クライアントを使う場合のみ)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...


重要：秘密鍵はサーバー側に保持。GEMINI_API_KEY をクライアントへ出さない。
[EN] Keep secrets server-side.

セキュリティ / データ

Auth：Clerk セッションをサーバー API で検証

RLS（Supabase クライアント使用時）：行レベルセキュリティを有効化し user_id で制限

Idempotency：将来的に一括挿入で冪等キー利用

ログ：PII を含まない構造化ログを想定（監査用）
[EN] Server-validated auth, RLS, idempotency for bulk, PII-safe logs.

RLS例

alter table events enable row level security;

create policy "insert own" on events
for insert with check (auth.uid() = user_id);

create policy "select own" on events
for select using (auth.uid() = user_id);

create policy "update own" on events
for update using (auth.uid() = user_id);

create policy "delete own" on events
for delete using (auth.uid() = user_id);


注意：Supabase Auth を使わず Clerk 認証のみの場合、クライアント任せにせずサーバー側で user_id を検証。

開発 (Dev)
npm i
cp .env.example .env.local
npm run dev
# http://localhost:3000


[EN] Standard Next.js dev flow.
