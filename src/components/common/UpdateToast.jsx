import React from 'react';

const UpdateToast = ({ countdown }) => (
    <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
        <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
            backdropFilter: 'blur(10px)',
            maxWidth: '380px',
        }}>
            {/* Animated spinner */}
            <div style={{
                width: '20px',
                height: '20px',
                border: '2.5px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
            }} />

            <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                    🚀 New version deployed!
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85 }}>
                    Reloading in {countdown}s…
                </div>
            </div>

            {/* Countdown badge */}
            <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
                flexShrink: 0,
            }}>
                {countdown}
            </div>
        </div>

        <style>{`
            @keyframes slideUp {
                from { transform: translateY(100px); opacity: 0; }
                to   { transform: translateY(0); opacity: 1; }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export default UpdateToast;
