import { useEffect, useState } from 'react';

export default function useThemePreference() {
    const [darkMode, setDarkMode] = useState(() => {
        try { return localStorage.getItem('statwizard_theme') !== 'light'; }
        catch { return true; }
    });
    useEffect(() => {
        try { localStorage.setItem('statwizard_theme', darkMode ? 'dark' : 'light'); }
        catch { /* The in-memory preference still works when storage is unavailable. */ }
    }, [darkMode]);
    return [darkMode, setDarkMode];
}
