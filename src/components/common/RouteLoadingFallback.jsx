import React from "react";

const RouteLoadingFallback = ({ darkMode, label = "Loading workspace" }) => (
  <div
    role="status"
    aria-live="polite"
    className={`min-h-48 w-full flex flex-col items-center justify-center gap-4 rounded-xl border ${darkMode ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}
  >
    <span
      className="h-8 w-8 rounded-full border-2 border-slate-500/30 border-t-indigo-500 animate-spin"
      aria-hidden="true"
    />
    <span className="text-xs font-black uppercase tracking-widest">
      {label}
    </span>
  </div>
);

export default RouteLoadingFallback;
