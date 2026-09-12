import { Info } from 'lucide-react';
import ProgressiveTooltip from '../common/ProgressiveTooltip';
import { TOOLTIP_COPY } from '../../data/multipleRegressionLesson.js';

const MultipleRegressionTooltipLabel = ({ darkMode, label, tooltipKey, className = '' }) => {
    const tooltip = TOOLTIP_COPY[tooltipKey];

    if (!tooltip) {
        return <span className={className}>{label}</span>;
    }

    return (
        <ProgressiveTooltip
            as="span"
            term={tooltip.term}
            title={tooltip.title}
            desc={tooltip.desc}
            darkMode={darkMode}
        >
            <span className={`inline-flex items-center gap-1 ${className}`}>
                <span>{label}</span>
                <Info size={12} className={darkMode ? 'text-slate-500' : 'text-slate-500'} />
            </span>
        </ProgressiveTooltip>
    );
};

export default MultipleRegressionTooltipLabel;
