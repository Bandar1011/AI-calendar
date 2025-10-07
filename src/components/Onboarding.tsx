'use client';

import { useEffect, useState } from 'react';

interface OnboardingProps {
  userId: string | null;
}

export default function Onboarding({ userId }: OnboardingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = `onboarded:${userId}`;
    const seen = typeof window !== 'undefined' ? localStorage.getItem(key) : '1';
    if (!seen) setVisible(true);
  }, [userId]);

  if (!visible) return null;

  const dismiss = () => {
    if (userId) localStorage.setItem(`onboarded:${userId}`, '1');
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0b0e1a]/90 via-[#111427]/80 to-[#1a1130]/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl mx-4 rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_60px_rgba(168,85,247,0.25)]">
        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
          background: 'radial-gradient(1000px 260px at 50% -10%, rgba(168,85,247,0.25), transparent), radial-gradient(600px 180px at 20% 120%, rgba(34,197,94,0.20), transparent)'
        }} />
        <div className="p-8 relative">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-violet-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">Welcome to AI Calendar</h2>
          <p className="mt-2 text-base text-white/80">An assistant that turns natural language into a schedule that sticks.</p>

          {/* Value props */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="text-fuchsia-300 font-medium">Speak or Type</div>
              <p className="mt-1 text-sm text-white/80">“Add doctor on Dec 2 2–4pm” — we extract title, date, start/end time.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="text-emerald-300 font-medium">Plan in Batches</div>
              <p className="mt-1 text-sm text-white/80">Ask for a week plan. We propose balanced workouts, study, and rest.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
              <div className="text-violet-300 font-medium">Save Securely</div>
              <p className="mt-1 text-sm text-white/80">Everything saves to your account — no passwords shared with AI.</p>
            </div>
          </div>

          {/* Productivity boosters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="text-white/90 font-medium">Time Blocking</div>
              <p className="mt-1 text-sm text-white/70">Auto-suggest focused blocks around your day to reduce context switching.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="text-white/90 font-medium">Smart Defaults</div>
              <p className="mt-1 text-sm text-white/70">Reasonable durations and evenings preference unless you say otherwise.</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <div className="text-white/90 font-medium">Frictionless Edits</div>
              <p className="mt-1 text-sm text-white/70">Change times by chat: “Move it to 3 PM and make it 30 minutes.”</p>
            </div>
          </div>

          {/* How to use */}
          <div className="mt-8 rounded-xl border border-white/10 p-5 bg-white/[0.03]">
            <div className="text-sm uppercase tracking-wider text-white/60">How to use</div>
            <ul className="mt-3 space-y-2 text-sm text-white/80 list-disc pl-5">
              <li>Start a chat on the right: “Plan my week with gym Mon/Wed/Fri at 7 PM.”</li>
              <li>Jump to a date and add: “Lunch with Sarah on Dec 2 at 1 PM for 1 hour.”</li>
              <li>Keep momentum: “Every Tuesday: study 6–7 PM for 4 weeks.”</li>
            </ul>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              onClick={dismiss}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-500/80 via-fuchsia-500/80 to-emerald-500/80 text-white hover:from-violet-400 hover:to-emerald-400 transition shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


