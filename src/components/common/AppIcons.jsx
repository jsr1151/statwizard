import React from 'react';

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const BaseStrokeIcon = ({ className = '', title, viewBox = '0 0 24 24', strokeWidth = 1.8, children, ...props }) => (
    <svg
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={joinClassNames('shrink-0 overflow-visible', className)}
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        {...props}
    >
        {title ? <title>{title}</title> : null}
        <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            {children}
        </g>
    </svg>
);

export const PowerBetaIcon = ({ className = '', title = 'Power Analysis', ...props }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={joinClassNames('shrink-0 overflow-visible', className)}
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        {...props}
    >
        {title ? <title>{title}</title> : null}
        <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            fontFamily="Georgia, Cambria, 'Times New Roman', serif"
            fontSize="20"
            fontWeight="700"
        >
            {'\u03B2'}
        </text>
    </svg>
);

export const WizardHatIcon = ({ className = '', title = 'The Wizard', ...props }) => (
    <BaseStrokeIcon className={className} title={title} {...props}>
        <path d="M3.25 16.75c1.82 1.18 5.18 1.8 8.75 1.8s6.93-.62 8.75-1.8c.82-.53 1.35-1.19 1.35-1.94 0-1.04-.94-1.85-2.3-1.85-1.58 0-2.82.74-3.56 2.01-.18-1.77-.8-4.35-2.18-6.66-.93-1.55-.67-3.55.63-4.83.62-.61 1.36-1.11 2.21-1.49-2.56.07-4.89 1.35-6.76 3.74-1.34 1.72-2.13 4.64-2.38 6.02-.74-1.27-1.98-2.01-3.56-2.01-1.36 0-2.3.81-2.3 1.85 0 .75.53 1.41 1.35 1.94Z" />
        <path d="M8.4 15.35h7.2" />
        <rect x="10.45" y="14.15" width="3.1" height="2.45" rx="0.6" />
        <path d="m12 6.9.63 1.23 1.38.2-1 .97.24 1.35L12 10.01l-1.25.64.24-1.35-.99-.97 1.37-.2L12 6.9Z" />
    </BaseStrokeIcon>
);

export const WizardCurveMarkIcon = ({ className = '', title = 'StatWizard', ...props }) => (
    <BaseStrokeIcon className={className} title={title} strokeWidth={1.7} {...props}>
        <path d="M3.15 16.95c1.65 1.04 4.83 1.66 8.85 1.66 4.01 0 7.2-.62 8.85-1.66.71-.45 1.15-.97 1.15-1.57 0-.95-.89-1.68-2.14-1.68-1.45 0-2.61.66-3.31 1.79-.18-1.83-.8-4.48-2.11-6.85-.89-1.58-.58-3.59.77-4.85.53-.49 1.16-.92 1.88-1.29-2.37.09-4.53 1.32-6.28 3.61-1.27 1.65-2.01 4.41-2.23 5.69-.7-1.13-1.87-1.79-3.32-1.79-1.25 0-2.14.73-2.14 1.68 0 .6.44 1.12 1.15 1.57Z" />
        <path d="M5.5 16.95c2.05-1.09 4.2-1.63 6.5-1.63s4.45.54 6.5 1.63" />
        <path d="M7.2 16.12c1.53-3.04 3.14-4.62 4.8-4.62 1.66 0 3.27 1.58 4.8 4.62" />
        <path d="M12 11.5v4.62" />
    </BaseStrokeIcon>
);
