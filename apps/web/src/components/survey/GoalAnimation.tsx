interface GoalAnimationProps {
  isOpen: boolean;
  isStadium: boolean;
}

export function GoalAnimation({ isOpen, isStadium }: GoalAnimationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-4 py-8 backdrop-blur-sm">
      <div className={`relative w-full max-w-3xl overflow-hidden rounded-[2rem] border p-6 shadow-2xl ${isStadium ? "border-emerald-400/20 bg-[#061522]/95" : "border-slate-300/30 bg-white/95"}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="goal-confetti goal-confetti-1 bg-emerald-300/90" />
          <span className="goal-confetti goal-confetti-2 bg-lime-300/90" />
          <span className="goal-confetti goal-confetti-3 bg-cyan-300/90" />
          <span className="goal-confetti goal-confetti-4 bg-emerald-400/90" />
          <span className="goal-confetti goal-confetti-5 bg-lime-400/90" />
          <span className="goal-confetti goal-confetti-6 bg-white/90" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          <div className="goal-drop text-[5rem] leading-none sm:text-[7rem]">⚽</div>
          <div className={`text-5xl font-black uppercase tracking-[0.1em] ${isStadium ? "text-emerald-200" : "text-primary"} animate-goal-pulse`}>GOOOL! 🎉</div>
          <div className={`font-mono text-3xl sm:text-4xl ${isStadium ? "text-slate-100" : "text-slate-700"} animate-goal-net-shake`}>
            <pre className="m-0 leading-none">|  |{`\n`}|__|</pre>
          </div>
          <p className={`max-w-xl text-sm sm:text-base ${isStadium ? "text-slate-300" : "text-slate-600"}`}>
            Top ağla buluştu, stadyum coşuyor! Biraz bekleyin, teşekkür sayfasına geçiyoruz.
          </p>
        </div>
      </div>
    </div>
  );
}
