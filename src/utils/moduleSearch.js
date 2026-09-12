const KEYWORDS = {
    res_central_tendency: ['average', 'typical value', 'arithmetic mean'],
    res_variability: ['standard deviation', 'sd', 'variance', 'interquartile range', 'iqr', 'median absolute deviation', 'mad', 'spread'],
    res_frequency: ['counts', 'histogram', 'bar chart', 'distribution'],
    res_probability: ['chance', 'binomial', 'dice', 'coin', 'bayes', 'conditional probability'],
    res_nhst: ['hypothesis', 'p value', 'significance', 'null hypothesis'],
    res_indep_ttest: ['unpaired t test', 'welch', 'two sample t test'],
    res_paired_ttest: ['dependent t test', 'before after', 'matched pairs'],
    res_rm_anova: ['repeated measures', 'within subjects', 'longitudinal'],
    correlation_result: ['pearson', 'association', 'r'],
    regression_result: ['linear model', 'slope', 'prediction'],
    multiple_regression_result: ['multiple predictors', 'multivariable', 'vif', 'collinearity'],
    res_mann_whitney: ['rank sum', 'nonparametric', 'unpaired ranks'],
    res_wilcoxon: ['signed rank', 'nonparametric', 'paired ranks'],
};
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const searchModules = (modules, query) => {
    const terms = normalize(query).split(' ').filter(Boolean);
    if (!terms.length) return modules;
    return modules.map(module => {
        const title = normalize(module.title);
        const aliases = (KEYWORDS[module.id] || []).map(normalize);
        const words = [title, normalize(module.category), ...aliases].join(' ').split(' ');
        const matches = terms.every(term => words.some(word => term.length === 1 ? word === term : word.startsWith(term)));
        const phrase = terms.join(' ');
        return { module, score: matches ? (title === phrase ? 4 : title.includes(phrase) ? 3 : aliases.includes(phrase) ? 2 : 1) : 0 };
    }).filter(item => item.score).sort((a, b) => b.score - a.score).map(item => item.module);
};
