import ProgressiveTooltip from '../common/ProgressiveTooltip';
import { TOOLTIP_COPY } from '../../data/multipleRegressionLesson.js';

const MultipleRegressionTableCell = ({ darkMode, tooltipKey, children, className = '' }) => {
    const tooltip = TOOLTIP_COPY[tooltipKey];

    if (!tooltip) {
        return <td className={`py-3 ${className}`}>{children}</td>;
    }

    return (
        <td className={`py-3 ${className}`}>
            <ProgressiveTooltip
                as="div"
                term={tooltip.term}
                title={tooltip.title}
                desc={tooltip.desc}
                darkMode={darkMode}
            >
                <div className={`inline-flex flex-col rounded px-1 -ml-1 border-b border-dotted ${darkMode ? 'border-slate-600 hover:bg-slate-800/70' : 'border-slate-300 hover:bg-slate-100'}`}>
                    {children}
                </div>
            </ProgressiveTooltip>
        </td>
    );
};

export default MultipleRegressionTableCell;
