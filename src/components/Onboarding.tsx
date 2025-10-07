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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#0b1220] to-[#0a0f1a] shadow-[0_0_40px_rgba(34,211,238,0.15)]">
        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{
          background: 'radial-gradient(1200px 300px at 50% -10%, rgba(34,211,238,0.15), transparent)',
        }} />
        <div className="p-8 relative">
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Welcome to AI Calendar</h2>
          <p className="mt-2 text-cyan-300/80">Your voice-first, AI-powered planner.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-cyan-500/20 p-4 bg-white/[0.02]">
              <div className="text-cyan-400 font-medium">Speak or Type</div>
              <p className="mt-1 text-sm text-gray-300">“Add doctor on Dec 2 2–4pm” — AI parses title, date, and time.</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 p-4 bg-white/[0.02]">
              <div className="text-cyan-400 font-medium">Plan Fast</div>
              <p className="mt-1 text-sm text-gray-300">Ask for a week plan. We generate events; you can edit anytime.</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 p-4 bg-white/[0.02]">
              <div className="text-cyan-400 font-medium">Secure Save</div>
              <p className="mt-1 text-sm text-gray-300">Events save to your account. No emails/passwords requested by AI.</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              onClick={dismiss}
              className="px-5 py-2 rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


