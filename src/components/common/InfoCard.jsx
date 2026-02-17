import React from 'react';

const InfoCard = ({ title, children, darkMode }) => (
    <div className={`p-4 rounded-lg shadow-md border transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {title && <h3 className={`text-lg font-semibold mb-2 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>{title}</h3>}
        <div className={`text-sm transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{children}</div>
    </div>
);

export default InfoCard;
