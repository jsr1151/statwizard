import { BarChart2, BookOpen, Calculator, Sigma } from "lucide-react";

const SECTIONS = [
  { id: "lessons", label: "Tutor / Lessons", icon: BookOpen },
  { id: "calculator", label: "Test Calculator", icon: Calculator },
  { id: "effect_size", label: "Effect Size", icon: Sigma },
  { id: "power", label: "Power Analysis", icon: BarChart2 },
];

export default function ResultNavigation({
  activeSection,
  darkMode,
  onSelect,
}) {
  return (
    <nav
      aria-label="Result sections"
      className={`rounded-xl border p-2 flex flex-wrap gap-2 ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={activeSection === id ? "page" : undefined}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${activeSection === id ? "bg-indigo-600 text-white shadow-lg" : darkMode ? "text-slate-400 hover:text-white hover:bg-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-white"}`}
        >
          <Icon aria-hidden="true" className="w-4 h-4" /> {label}
        </button>
      ))}
    </nav>
  );
}
