import { useEffect } from 'react';
const PAGE_TITLES = { menu: 'Interactive Statistics', modules: 'Statistical Modules', data_manager: 'Data Manager', power: 'Power Analysis', search: 'Search', lessons: 'Learning Lab' };
export default function usePageTitle(mode, stepTitle) {
    useEffect(() => {
        document.title = `${mode === 'wizard' ? stepTitle || 'Choose a Test' : PAGE_TITLES[mode] || 'Interactive Statistics'} — StatWizard`;
    }, [mode, stepTitle]);
}
