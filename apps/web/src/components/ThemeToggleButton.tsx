import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        theme === "stadium"
          ? "border-transparent bg-gradient-to-r from-emerald-500 to-lime-400 text-slate-950 shadow-[0_10px_25px_-20px_rgba(22,163,74,0.9)] hover:scale-[1.02]"
          : "border border-border bg-background text-foreground hover:bg-secondary"
      }`}
    >
      {theme === "stadium" ? "☀️ Klasik" : "🌙 Stadyum"}
    </button>
  );
}
