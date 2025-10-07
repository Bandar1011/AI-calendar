
EN: Voice-first calendar that lets you speak to it
sks/events, auto-parses the intent with AI, and saves them to your account. Full-stack on Next.js, deployed on Vercel.
JP: 音声入力で予定やタスクを登録できるカレンダーアプリです。AIが自然言語を解析し、タイトル・日時・締切・メモに自動変換して保存します。Next.jsで構築したフルスタックアプリで、Vercelにデプロイしています。
デモはこちらーー＞https://ai-calender-iota.vercel.app/task
Features / 機能

## Chat API (Streaming with memory)

環境変数:

```
GEMINI_API_KEY=your_api_key
# 任意: モデルを変更
GEMINI_MODEL=gemini-2.0-flash
```

エンドポイント:

- `POST /api/chat` — Body: `{ sessionId: string, userText: string }`
  - ストリームでテキストを返す (`text/plain`)
- `DELETE /api/chat` — Body: `{ sessionId: string }` で該当セッションの会話メモリをクリア

メモリ保持は `src/lib/chatMemory.ts` の Map に保存されます（プロセス内のみ）。

🎙 Voice input / 音声入力 → 話すだけで予定やタスクを追加

🤖 AI parsing / AI解析 → 自然な文章をイベント情報（タイトル、日時、締切、メモ）に変換

🔐 User auth (Google Sign-In) / ユーザー認証（Googleログイン） → 個別アカウントでデータを管理

🗂 Tasks & Events / タスク・イベント管理 → リスト、検索、フィルター、完了チェック、編集

📅 Calendar views / カレンダー表示 → 月・週・日ごとの表示に対応

☁️ Supabase + Prisma → Postgresデータベースに保存

🌗 Dark mode / ダークモード → モバイル対応

🇯🇵 Timezone aware / 日本時間対応 → デフォルトは Asia/Tokyo

Tech Stack / 技術スタック

Frontend / フロントエンド: Next.js (App Router) + TypeScript, TailwindCSS, shadcn/ui

Auth / 認証: NextAuth (Googleログイン)

DB / データベース: Supabase Postgres + Prisma ORM

AI / 人工知能: Gemini API → テキストをイベント情報に変換

Voice / 音声: Web Speech API（音声認識）

Deploy / デプロイ: Vercel
