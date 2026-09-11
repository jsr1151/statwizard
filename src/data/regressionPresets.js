export const REGRESSION_TUTOR_PRESETS = [
    ['positive_low_noise', 'Steep Upward / Tight Fit', 'A clear positive slope with small residuals, so the fitted line predicts well.'],
    ['positive_high_noise', 'Steep Upward / Noisy Fit', 'The slope stays positive, but larger residuals make the predictions less precise.'],
    ['negative_low_noise', 'Downward Slope / Tight Fit', 'A clear negative slope with little residual spread around the fitted line.'],
    ['negative_high_noise', 'Downward Slope / Noisy Fit', 'The slope stays negative, but the line leaves larger prediction errors behind.'],
    ['near_flat', 'Shallow Slope / Tight Fit', 'A shallow slope can still fit tightly, which helps separate rate of change from model fit.'],
    ['nonlinear', 'Curved Pattern / Bad Linear Fit', 'A curved pattern can make a straight-line model predict badly even when it still returns a slope.'],
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
