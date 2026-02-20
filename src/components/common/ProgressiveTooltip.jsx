import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, ChevronRight, ChevronDown } from 'lucide-react';

const ProgressiveTooltip = ({
    term,
    title,
    desc,
    pedagogy,
    example,
    children,
    darkMode,
    as: Wrapper = 'div'
}) => {
    const [expanded, setExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isMounted, setIsMounted] = useState(false);
    const [portalContainer, setPortalContainer] = useState(null);

    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    const hoverTimeout = useRef(null);

    useEffect(() => {
        setIsMounted(true);
        // Safely capture the body ONLY after mount in a client context
        if (typeof document !== 'undefined' && document.body) {
            setPortalContainer(document.body);
        }
        return () => {
            setIsMounted(false);
            setPortalContainer(null);
        };
    }, []);

    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
            top: rect.top,
            left: rect.left + rect.width / 2
        });
    };

    // Use useEffect instead of useLayoutEffect for maximum safety in production
    useEffect(() => {
        if (isVisible && isMounted) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible, isMounted]);

    const handleMouseEnter = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsVisible(false);
        }, 100);
    };

    const renderPortalContent = () => {
        if (!portalContainer || !isVisible) return null;

        try {
            return createPortal(
                <div
                    ref={tooltipRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className={`tooltip-content fixed p-4 rounded-3xl shadow-2xl border transition-all duration-300 z-[999999] pointer-events-auto ${isVisible ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                        } ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
                    style={{
                        top: `${position.top - 12}px`,
                        left: `${position.left}px`,
                        transform: 'translate(-50%, -100%)',
                        width: '16rem'
                    }}
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <Info size={12} className="text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{term}</span>
                        </div>
                        <p className="text-[11px] font-bold leading-tight">{title}</p>
                        <p className="text-[10px] opacity-70 leading-relaxed">{desc}</p>

                        {(pedagogy || example) && (
                            <div className="mt-2 pt-2 border-t border-slate-800/50">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpanded(!expanded);
                                    }}
                                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors pointer-events-auto"
                                >
                                    {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                    {expanded ? 'Less' : 'More...'}
                                </button>

                                {expanded && (
                                    <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                        {pedagogy && (
                                            <div className={`p-2 rounded-lg text-[9px] italic border-l-2 border-indigo-500 ${darkMode ? 'bg-indigo-500/5' : 'bg-indigo-50'
                                                }`}>
                                                {pedagogy}
                                            </div>
                                        )}
                                        {example && (
                                            <div className={`p-2 rounded-lg text-[9px] font-mono ${darkMode ? 'bg-black/30 text-emerald-400' : 'bg-slate-50 text-emerald-600'
                                                }`}>
                                                <span className="opacity-50 uppercase text-[7px] block mb-1">Example:</span>
                                                {example}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent ${darkMode ? 'border-t-slate-900' : 'border-t-white'
                        }`} />
                </div>,
                portalContainer
            );
        } catch (err) {
            console.error("Portal render error:", err);
            return null;
        }
    };

    return (
        <Wrapper
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`${Wrapper === 'div' ? 'relative inline-block' : ''} tooltip-trigger cursor-help`}
        >
            {children}
            {renderPortalContent()}
        </Wrapper>
    );
};

export default ProgressiveTooltip;
