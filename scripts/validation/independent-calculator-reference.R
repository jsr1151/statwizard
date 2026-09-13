# Run from the repository root with base R. No packages required.
cases <- data.frame(
 id=c('pooled_example','welch_unequal','welch_negative','pooled_small','welch_small','one_constant','bound_two_test','interval_one_test'),
 n1=c(30,10,7,2,3,5,9,12), mean1=c(12,5,-2,2.5,0.123456789,4,6.2,8.1), sd1=c(2.5,2,1.4,1.4,0.000123456,0,2.1,1.7),
 n2=c(30,20,11,3,5,8,15,10), mean2=c(10,4,-1,1.2,0.1234,3,5,8), sd2=c(2.5,4,3,0.8,0.0004,2,3.5,2.3),
 testType=c('student','welch','welch','student','welch','welch','student','welch'),
 alpha=c(.05,.05,.1,.01,.01,.05,.05,.1), tails=c(2,2,1,1,2,2,2,1),
 direction=c('greater','greater','less','greater','greater','greater','less','greater'),
 ciType=c('two-sided','two-sided','one-sided','one-sided','two-sided','two-sided','one-sided','two-sided')
)
sample_for <- function(n, center, spread) { x <- seq_len(n); (x-mean(x))/sd(x)*spread+center }
rows <- lapply(seq_len(nrow(cases)), function(i) {
 c <- cases[i,]; x <- sample_for(c$n1,c$mean1,c$sd1); y <- sample_for(c$n2,c$mean2,c$sd2)
 result <- t.test(x,y,var.equal=c$testType=='student',alternative=if(c$tails==2)'two.sided' else c$direction,conf.level=1-c$alpha)
 interval <- t.test(x,y,var.equal=c$testType=='student',alternative=if(c$ciType=='two-sided')'two.sided' else c$direction,conf.level=1-c$alpha)
 data.frame(c,t=unname(result$statistic),p=result$p.value,df=unname(result$parameter),lower=interval$conf.int[1],upper=interval$conf.int[2])
})
dir.create('.vite',showWarnings=FALSE)
write.csv(do.call(rbind,rows),'.vite/independent-reference.csv',row.names=FALSE)
