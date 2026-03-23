import React from 'react';

const CardTone = ({ darkMode, active = false, children }) => (
    <div className={`rounded-xl border px-4 py-3 ${active
        ? (darkMode ? 'bg-indigo-500/10 border-indigo-500/30 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900')
        : (darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700')
    }`}>
        {children}
    </div>
);

const VariableRolePicker = ({
    darkMode,
    dataset,
    roles = [],
    selection = {},
    onChange,
    emptyMessage = 'Choose a saved dataset to map variables.',
}) => {
    const updateSelection = (roleId, nextValue) => {
        onChange?.({
            ...selection,
            [roleId]: nextValue,
        });
    };

    const getRoleOptions = (role) => {
        if (!dataset) {
            return [];
        }

        const excludeIds = (role.excludeRoleIds || []).flatMap((excludeRoleId) => {
            const value = selection?.[excludeRoleId];

            if (Array.isArray(value)) {
                return value;
            }

            return value ? [value] : [];
        });

        return (dataset.columns || []).filter((column) => {
            const typeAllowed = !role.allowedTypes?.length || role.allowedTypes.includes(column.summary?.detectedType);
            const passesColumnFilter = typeof role.columnFilter === 'function'
                ? role.columnFilter({ column, dataset, selection })
                : true;

            return typeAllowed && passesColumnFilter && !excludeIds.includes(column.id);
        });
    };

    const getOptionDetail = (role, column) => (
        typeof role.describeOption === 'function'
            ? role.describeOption({ column, dataset, selection })
            : ''
    );

    if (!dataset) {
        return (
            <div className={`rounded-xl border px-4 py-5 text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {roles.map((role) => {
                const options = getRoleOptions(role);
                const currentValue = selection?.[role.id];

                return (
                    <div key={role.id}>
                        <div className={`text-[11px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {role.label}
                        </div>

                        {role.selection === 'single' ? (
                            <select
                                value={currentValue || ''}
                                onChange={(event) => updateSelection(role.id, event.target.value)}
                                className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition-colors ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                            >
                                <option value="">{role.placeholder || 'Select variable'}</option>
                                {options.map((column) => {
                                    const optionDetail = getOptionDetail(role, column);

                                    return (
                                        <option key={`${role.id}-${column.id}`} value={column.id}>
                                            {optionDetail ? `${column.label} (${optionDetail})` : column.label}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <div className="space-y-2">
                                {options.map((column) => {
                                    const checked = Array.isArray(currentValue) && currentValue.includes(column.id);
                                    const optionDetail = getOptionDetail(role, column);

                                    return (
                                        <label key={`${role.id}-${column.id}`} className="block cursor-pointer">
                                            <CardTone darkMode={darkMode} active={checked}>
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => {
                                                            const currentItems = Array.isArray(currentValue) ? currentValue : [];
                                                            updateSelection(
                                                                role.id,
                                                                checked
                                                                    ? currentItems.filter((item) => item !== column.id)
                                                                    : [...currentItems, column.id]
                                                            );
                                                        }}
                                                        className="mt-1"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-bold">{column.label}</div>
                                                        <div className={`mt-1 text-xs ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                                            {column.summary?.detectedType} - missing {column.summary?.missingCount || 0}
                                                            {column.originalName && column.originalName !== column.label ? ` - raw: ${column.originalName}` : ''}
                                                            {optionDetail ? ` - ${optionDetail}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardTone>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {role.helperText && (
                            <p className={`mt-3 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-600'}`}>
                                {role.helperText}
                            </p>
                        )}

                        {!options.length && (
                            <p className={`mt-3 text-sm ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                {role.emptyOptionsText || 'No compatible variables are available for this role yet.'}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default VariableRolePicker;
