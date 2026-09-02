import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="w-9 h-9 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors flex items-center justify-center shrink-0"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}