import React from 'react';

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const makeStarPoints = (cx, cy, outerRadius, innerRadius, points = 5) => {
    const coordinates = [];
    const step = Math.PI / points;

    for (let index = 0; index < points * 2; index += 1) {
        const radius = index % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + index * step;
        coordinates.push(`${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`);
    }

    return coordinates.join(' ');
};

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

export const HeroStatWizardArt = ({ className = '', title = 'StatWizard artwork', ...props }) => {
    const uniqueId = React.useId().replace(/:/g, '');
    const backgroundId = `hero-bg-${uniqueId}`;
    const hazeLeftId = `hero-haze-left-${uniqueId}`;
    const hazeRightId = `hero-haze-right-${uniqueId}`;
    const hatStrokeId = `hero-hat-${uniqueId}`;
    const curveStrokeId = `hero-curve-${uniqueId}`;
    const curveFillId = `hero-fill-${uniqueId}`;
    const pinkGlowId = `hero-pink-glow-${uniqueId}`;
    const blueGlowId = `hero-blue-glow-${uniqueId}`;
    const starGlowId = `hero-star-glow-${uniqueId}`;
    const softGlowId = `hero-soft-glow-${uniqueId}`;

    const upperHatPath = 'M88 453C201 452 295 450 375 422C446 397 512 330 590 205C633 136 677 88 730 65C780 44 834 45 875 70C916 94 937 140 929 185C920 235 885 262 848 282C813 301 801 325 818 356C844 402 906 458 998 536';
    const brimPath = 'M66 456C105 521 237 558 395 571C585 587 762 629 908 619C968 615 998 597 998 577C998 556 971 540 928 523C879 504 813 468 722 398C658 350 588 352 500 403C407 457 318 497 222 507C149 515 93 497 66 456Z';
    const innerBrimPath = 'M286 491C413 503 523 528 644 559C738 584 842 591 954 577';
    const curvePath = 'M343 497C419 485 470 442 511 340C543 260 566 219 586 219C606 219 629 260 661 340C702 442 753 485 829 497';

    return (
        <svg
            viewBox="0 0 1024 683"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={joinClassNames('overflow-visible', className)}
            role={title ? 'img' : 'presentation'}
            aria-hidden={title ? undefined : true}
            {...props}
        >
            {title ? <title>{title}</title> : null}
            <defs>
                <linearGradient id={backgroundId} x1="512" y1="0" x2="512" y2="683" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0D1230" />
                    <stop offset="1" stopColor="#050817" />
                </linearGradient>
                <radialGradient id={hazeLeftId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(258 415) rotate(54.667) scale(336.162 315.856)">
                    <stop stopColor="#4D1B77" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#4D1B77" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={hazeRightId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(774 203) rotate(97.731) scale(292.498 314.596)">
                    <stop stopColor="#6126A8" stopOpacity="0.42" />
                    <stop offset="1" stopColor="#6126A8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={hatStrokeId} x1="91" y1="332" x2="997" y2="332" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E25CFF" />
                    <stop offset="0.52" stopColor="#F671FF" />
                    <stop offset="1" stopColor="#CF5EFF" />
                </linearGradient>
                <linearGradient id={curveStrokeId} x1="347" y1="351" x2="833" y2="351" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1EB7FF" />
                    <stop offset="0.55" stopColor="#2BA5FF" />
                    <stop offset="1" stopColor="#1586FF" />
                </linearGradient>
                <linearGradient id={curveFillId} x1="586" y1="219" x2="586" y2="512" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2E7CFF" stopOpacity="0.48" />
                    <stop offset="0.8" stopColor="#1F5DDA" stopOpacity="0.12" />
                    <stop offset="1" stopColor="#1F5DDA" stopOpacity="0" />
                </linearGradient>
                <filter id={pinkGlowId} x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id={blueGlowId} x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="9" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id={starGlowId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id={softGlowId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="18" />
                </filter>
            </defs>

            <rect width="1024" height="683" rx="46" fill={`url(#${backgroundId})`} />
            <ellipse cx="270" cy="437" rx="244" ry="161" fill={`url(#${hazeLeftId})`} />
            <ellipse cx="781" cy="205" rx="247" ry="197" fill={`url(#${hazeRightId})`} />

            <g filter={`url(#${starGlowId})`} fill="#62FFF1">
                <polygon points={makeStarPoints(270, 159, 57, 24)} />
                <polygon points={makeStarPoints(329, 314, 43, 18)} />
                <polygon points={makeStarPoints(846, 388, 52, 22)} />
                <polygon points={makeStarPoints(438, 617, 46, 19)} />
            </g>

            <g opacity="0.82" filter={`url(#${softGlowId})`}>
                <path d={upperHatPath} stroke="#D452FF" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
                <path d={brimPath} stroke="#D452FF" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
                <path d={curvePath} stroke="#159FFF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            <g filter={`url(#${pinkGlowId})`}>
                <path d={upperHatPath} stroke={`url(#${hatStrokeId})`} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                <path d={brimPath} stroke={`url(#${hatStrokeId})`} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <path d={innerBrimPath} stroke="#4F79FF" strokeOpacity="0.9" strokeWidth="10" strokeLinecap="round" />
            </g>

            <path
                d="M343 497C419 485 470 442 511 340C543 260 566 219 586 219C606 219 629 260 661 340C702 442 753 485 829 497L829 511C748 507 677 507 586 507C496 507 424 506 343 497Z"
                fill={`url(#${curveFillId})`}
            />

            <g filter={`url(#${blueGlowId})`}>
                <path d={curvePath} stroke={`url(#${curveStrokeId})`} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M586 219V497" stroke="#52B8FF" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M423 279V492" stroke="#3BAEFF" strokeWidth="6" strokeDasharray="16 18" strokeLinecap="round" />
                <path d="M691 279V492" stroke="#3BAEFF" strokeWidth="6" strokeDasharray="16 18" strokeLinecap="round" strokeLinejoin="round" />
                <text x="571" y="171" fill="#33AAFF" fontFamily="Georgia, Cambria, 'Times New Roman', serif" fontSize="54" fontWeight="700">{'\u03BC'}</text>
            </g>
        </svg>
    );
};
