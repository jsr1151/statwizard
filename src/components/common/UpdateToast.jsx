import React from "react";

const UpdateToast = ({ onReload, onDismiss }) => (
  <aside
    aria-label="Application update available"
    className="statwizard-update-toast"
    style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 99999,
      animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    }}
  >
    <div
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "white",
        padding: "16px 24px",
        borderRadius: "12px",
        boxShadow:
          "0 20px 60px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: "Inter, system-ui, sans-serif",
        backdropFilter: "blur(10px)",
        maxWidth: "380px",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>
          New version available
        </div>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ fontSize: "12px", opacity: 0.85 }}
        >
          Reload when you are ready. Your current page will stay open until
          then.
        </div>
      </div>

      <button
        type="button"
        onClick={onReload}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{
          background: "white",
          color: "#4f46e5",
          border: 0,
          borderRadius: "8px",
          padding: "8px 12px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Reload
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss update notification"
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{
          background: "transparent",
          color: "white",
          border: 0,
          fontSize: "20px",
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        {"\u00d7"}
      </button>
    </div>

    <style>{`
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to   { transform: translateY(0); opacity: 1; }
            }

            @media (prefers-reduced-motion: reduce) {
                .statwizard-update-toast { animation: none !important; }
            }
        `}</style>
  </aside>
);

export default UpdateToast;
