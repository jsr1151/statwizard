export const LEARNING_PATH = [
    {
        id: 'data-types', title: 'Start with the data', minutes: 4,
        objective: 'Distinguish labels from measurements before choosing a summary.',
        paragraphs: [
            'A row usually represents one observation; a column describes one variable. First ask what was measured, on whom, and whether observations are independent.',
            'Categorical variables describe groups. Nominal categories have no natural order; ordinal categories do. Quantitative variables describe counts or measurements. A numeric code does not turn a category into a measurement.',
        ],
        exampleTitle: 'Five people, one measurement each',
        example: [
            'Five independently sampled adults have commute times of 8, 10, 12, 14, and 16 minutes. Commute time is quantitative: a difference of two minutes has a meaningful size.',
            'Their travel modes (walk, bus, car) are nominal categories. Coding those modes as 1, 2, and 3 does not make their average meaningful. Satisfaction ratings (low, medium, high) are ordinal: ordered, without a guaranteed equal gap.',
        ],
        takeaway: 'Five days from one person are repeated observations, not five independent people.',
        links: [{ step: 'res_frequency', label: 'Explore frequency distributions' }],
        questions: [
            { id: 'numeric-label', prompt: 'Bus = 1, car = 2, walk = 3. What kind of variable is travel mode?', correct: 'nominal', options: [
                { id: 'quantitative', text: 'Quantitative, because the codes are numbers', feedback: 'The codes are labels. Changing bus from 1 to 9 would not change the travel mode, so averaging the codes has no useful interpretation.' },
                { id: 'nominal', text: 'Nominal categorical', feedback: 'Travel modes are categories without a natural order, regardless of their numeric codes.' },
                { id: 'ordinal', text: 'Ordinal categorical', feedback: 'Ordinal categories have a meaningful order, such as low, medium, high. Bus, car, and walk do not have that order.' },
            ] },
            { id: 'independence', prompt: 'Which sample fits the independent-observations example?', correct: 'people', options: [
                { id: 'days', text: 'Five consecutive commutes by one person', feedback: 'These are repeated observations from the same person. Shared habits and circumstances can make them dependent.' },
                { id: 'people', text: 'One commute from each of five independently sampled people', feedback: 'Each sampled person contributes one measurement. Sampling and study design still determine how broadly you can generalize.' },
            ] },
        ],
    },
    {
        id: 'center-spread', title: 'Describe center and spread', minutes: 5,
        objective: 'Calculate a mean and interpret the sample standard deviation.',
        paragraphs: [
            'The mean shares the total equally across observations. The median is the middle value after sorting. Both describe center, but the mean is more sensitive to extreme values.',
            'Sample standard deviation (s) measures spread around the sample mean in the original units. Square the deviations from the mean, sum them, divide by n − 1, and take the square root.',
        ],
        exampleTitle: 'Commute times: 8, 10, 12, 14, 16 minutes',
        example: [
            'Mean = (8 + 10 + 12 + 14 + 16) / 5 = 12 minutes. The median is also 12 minutes.',
            'Deviations from 12 are −4, −2, 0, 2, 4. Their squares sum to 40. Sample variance = 40 / (5 − 1) = 10 minutes²; sample SD = √10 ≈ 3.162 minutes.',
            'If 16 becomes 60, the mean becomes 20.8 minutes while the median remains 12. An extreme value can pull the mean away from the middle observation.',
        ],
        takeaway: 'Report center together with spread, and look at the data before relying on either number.',
        links: [{ step: 'res_central_tendency', label: 'Explore mean and median' }, { step: 'res_variability', label: 'Explore variability' }],
        questions: [
            { id: 'mean', prompt: 'What is the mean of 4, 6, and 8 minutes?', correct: 'six', options: [
                { id: 'eighteen', text: '18 minutes', feedback: '18 is the total. Divide by the three observations to find the mean.' },
                { id: 'six', text: '6 minutes', feedback: '(4 + 6 + 8) / 3 = 6 minutes.' },
                { id: 'four', text: '4 minutes', feedback: '4 is the range (8 − 4) here. The mean is the sum, 18, divided by 3.' },
            ] },
            { id: 'sd', prompt: 'What does the sample SD of about 3.162 minutes describe?', correct: 'spread', options: [
                { id: 'precision', text: 'The precision of the estimated population mean', feedback: 'Standard error describes the precision of an estimated mean. Standard deviation describes variation among observations.' },
                { id: 'spread', text: 'The spread of individual commute times around the sample mean', feedback: 'SD measures variation among individual observations, in minutes. It is not the average absolute deviation.' },
            ] },
        ],
    },
    {
        id: 'probability', title: 'Reason with probability', minutes: 4,
        objective: 'Use a probability model and recognize independent events.',
        paragraphs: [
            'A probability ranges from 0 (impossible in the model) to 1 (certain in the model). For equally likely outcomes, count favorable outcomes and divide by all possible outcomes.',
            'The complement rule is P(not A) = 1 − P(A). For independent events, P(A and B) = P(A) × P(B). Independence is a condition to check, not a rule that always holds.',
        ],
        exampleTitle: 'A fair six-sided die',
        example: [
            'The outcomes are 1, 2, 3, 4, 5, 6, each with probability 1/6. Three are even, so P(even) = 3/6 = 1/2.',
            'P(not a six) = 1 − 1/6 = 5/6. For two independent rolls, P(two sixes) = (1/6) × (1/6) = 1/36.',
            'A long run of non-sixes does not make a six more likely on the next independent roll. The model still assigns it probability 1/6.',
        ],
        takeaway: 'A model describes uncertainty; it does not guarantee a particular pattern in a short run.',
        links: [{ step: 'res_probability', label: 'Try the probability demos', section: 'demos' }],
        questions: [
            { id: 'complement', prompt: 'On one fair die roll, what is P(not a six)?', correct: 'five-sixths', options: [
                { id: 'one-sixth', text: '1/6', feedback: '1/6 is the probability of a six. The other five outcomes together have probability 5/6.' },
                { id: 'five-sixths', text: '5/6', feedback: 'The complement is 1 − 1/6 = 5/6.' },
            ] },
            { id: 'independent-rolls', prompt: 'A fair die has produced five non-sixes in a row. With independent rolls, what is the chance of a six next?', correct: 'unchanged', options: [
                { id: 'due', text: 'More than 1/6; a six is overdue', feedback: 'Independent rolls have no memory. Past results do not change the next roll’s probabilities.' },
                { id: 'unchanged', text: 'Still 1/6', feedback: 'Each independent roll follows the same fair-die model.' },
            ] },
        ],
    },
    {
        id: 'uncertainty', title: 'Understand uncertainty', minutes: 5,
        objective: 'Separate data spread from uncertainty about a population mean.',
        paragraphs: [
            'A different random sample would usually give a different mean. The standard error (SE) describes the spread of sample means across repeated sampling. For independent observations, estimate it with SE = s / √n.',
            'A confidence interval adds a margin of error around an estimate. Under the model assumptions, a method that produces 95% confidence intervals covers the fixed population mean in 95% of repeated samples. This is a property of the method, not a probability assigned to the fixed mean after observing one interval.',
        ],
        exampleTitle: 'From data spread to mean uncertainty',
        example: [
            'For the five commute times, mean = 12, s ≈ 3.162, and n = 5. SE = √10 / √5 = √2 ≈ 1.414 minutes.',
            'For illustration, assume independent sampling from a normal population. A 95% t interval uses 4 degrees of freedom and a critical value of about 2.776: 12 ± 2.776 × 1.414, or approximately [8.074, 15.926] minutes.',
            'This interval estimates the population mean commute time. It does not describe where 95% of individual commute times fall. With only five observations, the population assumptions deserve particular care.',
        ],
        takeaway: 'More independent observations reduce SE when spread stays the same. More data cannot by itself repair biased sampling.',
        links: [{ step: 'res_nhst', label: 'Explore inference and uncertainty', section: null }],
        questions: [
            { id: 'sample-size', prompt: 'If sample SD stays the same and independent sample size rises from 25 to 100, what happens to SE?', correct: 'half', options: [
                { id: 'quarter', text: 'It becomes one quarter as large', feedback: 'SE divides by the square root of n. The square root rises from 5 to 10, so SE halves rather than quarters.' },
                { id: 'half', text: 'It becomes half as large', feedback: 's/√100 = s/10, half of s/√25 = s/5.' },
                { id: 'same', text: 'It stays the same', feedback: 'SD stays the same in this question, but the larger sample improves the precision of the mean: SE = s/√n.' },
            ] },
            { id: 'interval', prompt: 'What does the 95% confidence level describe?', correct: 'coverage', options: [
                { id: 'individuals', text: 'The percentage of individual commutes inside this interval', feedback: 'This is an interval for the population mean, not a range containing 95% of individual observations.' },
                { id: 'coverage', text: 'How often this interval method covers the population mean in repeated sampling, under its assumptions', feedback: 'The 95% level describes the long-run coverage of the procedure.' },
            ] },
        ],
    },
    {
        id: 'one-sample-inference', title: 'Make a one-sample inference', minutes: 6,
        objective: 'Connect an estimate, a test statistic, a p-value, and a conclusion.',
        paragraphs: [
            'A one-sample t-test compares a population mean with a specified reference when the population SD is unknown. Choose the hypothesis and significance level before looking at the result.',
            'For this small-sample example, assume independent observations from a normal population. Set H₀: population mean = 10 minutes, H₁: population mean ≠ 10 minutes, and α = 0.05. The two-sided p-value measures how often the null model would produce a t statistic at least as far from zero as the observed one.',
        ],
        exampleTitle: 'Are mean commute times different from 10 minutes?',
        example: [
            'Using 8, 10, 12, 14, 16: mean = 12, sample SD ≈ 3.162, SE ≈ 1.414. The estimated difference from 10 is 2 minutes.',
            't = (12 − 10) / 1.414 ≈ 1.414, with df = 5 − 1 = 4. The two-sided p-value is approximately 0.230.',
            'Because 0.230 > 0.05, we do not reject H₀. The data provide insufficient evidence of a difference from 10 minutes under this model; they do not establish equality. The 95% interval [8.074, 15.926] includes 10 and shows the uncertainty.',
        ],
        takeaway: 'Report the estimate, interval, sample size, assumptions, and p-value together. A p-value is not the probability that H₀ is true, nor a measure of practical importance.',
        links: [{ step: 'res_onesample_ttest', label: 'Open the one-sample t-test calculator', section: 'calculator' }],
        moduleNote: 'The calculator opens with its own example. To reproduce this lesson, enter n = 5, mean = 12, SD = 3.16227766, and reference mean = 10; select a two-sided test with α = 0.05.',
        questions: [
            { id: 'conclusion', prompt: 'With a two-sided p-value of 0.230 and α = 0.05, which conclusion is justified?', correct: 'insufficient', options: [
                { id: 'equal', text: 'The population mean is proven to be 10 minutes', feedback: 'Failing to reject a null hypothesis does not prove equality. This small sample leaves substantial uncertainty.' },
                { id: 'insufficient', text: 'There is insufficient evidence of a difference from 10 minutes', feedback: 'p exceeds α, so we do not reject H₀. Report the estimated difference and interval as well.' },
                { id: 'null-probability', text: 'There is a 23% probability that the null hypothesis is true', feedback: 'A p-value is calculated assuming the null model. It is not a probability that the hypothesis is true.' },
            ] },
            { id: 'test-statistic', prompt: 'What does t ≈ 1.414 mean in this example?', correct: 'standard-errors', options: [
                { id: 'minutes', text: 'The sample mean is 1.414 minutes above the reference', feedback: 'The difference is 2 minutes. Dividing it by SE ≈ 1.414 minutes produces a unitless t statistic.' },
                { id: 'standard-errors', text: 'The sample mean is about 1.414 estimated standard errors above the reference', feedback: 't = (sample mean − reference mean) / SE expresses the difference in estimated standard-error units.' },
            ] },
        ],
    },
];
