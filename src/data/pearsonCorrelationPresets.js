export const PEARSON_TUTOR_PRESETS = [
    ['strong_positive', 'Strong Positive', 'Positive linear trend with modest noise.'],
    ['weak_positive', 'Weak Positive', 'Same upward idea, but the noise now competes with the trend.'],
    ['near_zero', 'Near Zero', 'X and Y are generated to be largely independent, so the cloud looks patternless.'],
    ['strong_negative', 'Strong Negative', 'Negative linear trend with modest noise.'],
    ['nonlinear', 'Nonlinear', 'A clear curve can still produce a small r.'],
    ['restricted_range', 'Restricted Range', 'Faded points show the full relationship while the observed X-slice shrinks r.'],
];

export const PEARSON_SAMPLE_DATASET = `Study Hours,Exam Score,Sleep Hours,Stress
2,58,8.0,7.6
3,61,7.7,7.1
4,65,7.4,6.7
5,69,7.1,6.3
6,73,6.8,5.8
7,77,6.5,5.3
8,82,6.3,4.9
9,85,6.1,4.5
10,89,5.9,4.1
11,92,5.8,3.8
12,95,5.7,3.5`;
