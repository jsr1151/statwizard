export const REGRESSION_TUTOR_PRESETS = [
    ['positive_low_noise', 'Positive / Low Noise', 'A positive slope with tight scatter around the line.'],
    ['positive_high_noise', 'Positive / High Noise', 'The slope stays positive while noise weakens the fit.'],
    ['negative_low_noise', 'Negative / Low Noise', 'A clear downward line with little residual spread.'],
    ['negative_high_noise', 'Negative / High Noise', 'The slope stays negative while predictions get noisier.'],
    ['near_flat', 'Near-Flat Slope', 'A small slope is not the same as a strong predictive model.'],
    ['nonlinear', 'Nonlinear', 'A curved pattern can make one straight line misleading.'],
];

export const REGRESSION_SAMPLE_DATASET = `Study Hours,Practice Problems,Exam Score,Stress Level
2,18,58,8.2
3,24,61,7.9
4,28,64,7.6
5,34,68,7.1
6,39,72,6.8
7,45,75,6.4
8,49,79,6.1
9,55,82,5.7
10,61,86,5.3
11,66,88,4.9
12,72,91,4.5
13,77,93,4.1
14,81,95,3.7
15,86,97,3.3`;
