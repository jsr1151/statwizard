import { buildOneWayReport } from '../../stats/oneWayReport.js';
import CopyResultsButton from '../common/CopyResultsButton.jsx';

export default function AnovaReportContent({ result, darkMode }) {
    const text = result?.ok && ['raw', 'summary', 'f'].includes(result.inputMode)
        ? buildOneWayReport({ result, source: result.source || 'Current ANOVA inputs' }) : '';
    return text ? <div className="space-y-3 min-w-0 [overflow-wrap:anywhere]"><p className="whitespace-pre-wrap text-sm">{text}</p><CopyResultsButton text={text} label="Copy tutor report" darkMode={darkMode} /></div> : <p role="status">Complete valid one-way ANOVA lesson inputs to generate a report.</p>;
}
