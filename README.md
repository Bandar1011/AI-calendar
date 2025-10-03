Voice-first calendar that lets you speak tasks/events, auto-parses the intent with AI, and saves them to your account. Full-stack on Next.js, deployed on Vercel.
link --> https://ai-calender-iota.vercel.app/task
Features

🎙 Voice input → create events and tasks hands-free

🤖 AI parsing → turn natural language into structured events (title, date/time, deadline, notes)

🔐 User auth (Google Sign-In) → personal data per user

🗂 Tasks & Events → list, search, filter; quick complete/edit

📅 Month/Week/Day views (client calendar UI)

☁️ Supabase + Prisma → Postgres persistence

🌗 Dark mode; mobile-friendly

🇯🇵 Timezone-aware (defaults to Asia/Tokyo)

Tech Stack

Frontend: Next.js (App Router) + TypeScript, Tailwind, shadcn/ui

Auth: NextAuth (Google) (or Clerk if you used it — change this line accordingly)

DB: Supabase Postgres + Prisma ORM

AI: Gemini API (or your actual provider — update this line) for NL → event parsing

Voice: Web Speech API / Whisper (write what you actually use)

Deploy: Vercel
