# Run from the repository root. Base R only; writes a reviewable reference CSV.
cases <- data.frame(
  id = c("example", "small_lower", "small_upper", "negative", "large_n", "one_bound_two_test", "two_bound_one_test", "precision"),
  n = c(30, 2, 3, 8, 120, 15, 12, 7),
  mean = c(105, 2.5, 3.7, -4.2, 10.15, 6.2, 8.1, 0.123456789),
  sd = c(15, 1.4, 2.2, 1.9, 1.2, 2.1, 1.7, 0.000123456),
  nullMean = c(100, 0, 5, -3, 10, 5, 8, 0.1234),
  alpha = c(.05, .01, .1, .05, .01, .05, .1, .05),
  tails = c(2, 1, 1, 2, 2, 2, 1, 2),
  direction = c("greater", "greater", "less", "less", "greater", "less", "greater", "greater"),
  ciType = c("two-sided", "one-sided", "one-sided", "two-sided", "two-sided", "one-sided", "two-sided", "two-sided")
)
rows <- lapply(seq_len(nrow(cases)), function(i) {
  p <- cases[i, ]; x <- seq_len(p$n); x <- (x - mean(x)) / sd(x) * p$sd + p$mean
  test <- t.test(x, mu=p$nullMean, alternative=if (p$tails == 2) "two.sided" else p$direction, conf.level=1-p$alpha)
  interval <- t.test(x, mu=p$nullMean, alternative=if (p$ciType == "two-sided") "two.sided" else p$direction, conf.level=1-p$alpha)
  data.frame(p, t=unname(test$statistic), p=unname(test$p.value), df=unname(test$parameter), lower=interval$conf.int[1], upper=interval$conf.int[2])
})
dir.create(".vite", showWarnings=FALSE)
write.csv(do.call(rbind, rows), ".vite/one-sample-reference.csv", row.names=FALSE)
