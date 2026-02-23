import React from 'react';
import TutorPanel from './TutorPanel';

const AncovaTutorPanel = ({ tip, onDismiss, onShowHistory, onAction, darkMode }) => {
    return (
        <TutorPanel
            script={tip}
            level="error"
            inline={false}
            darkMode={darkMode}
            onClose={() => onDismiss(tip.id)}
            onAction={onAction}
            onShowHistory={onShowHistory}
        />
    );
};

export default AncovaTutorPanel;
