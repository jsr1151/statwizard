# Run from the repository root with base R. No packages required.
cases <- data.frame(
 id=c('example_summary','negative','two_pairs','perfect_correlation','near_correlation','small_scale','bound_two_test','interval_one_test'),
 n=c(10,7,2,5,12,8,9,15),mean1=c(14,-2,2.5,6,10,.123456789,6.2,8.1),sd1=c(1.6,1.4,1.4,2,2,.000123456,2.1,1.7),
 mean2=c(11.3,-1,1.2,5,9,.1234,5,8),sd2=c(1.1,3,.8,1,2,.0004,3.5,2.3),r=c(.8,-.4,-1,1,.999,.35,.2,-.7),
 alpha=c(.05,.1,.01,.05,.01,.05,.05,.1),tails=c(2,1,1,2,2,2,2,1),direction=c('greater','less','greater','greater','greater','greater','less','greater'),
 ciType=c('two-sided','one-sided','one-sided','two-sided','two-sided','two-sided','one-sided','two-sided')
)
rows <- lapply(seq_len(nrow(cases)),function(i){
 c <- cases[i,]; u <- seq_len(c$n);u <- (u-mean(u))/sd(u)
 if(c$n>2){v <- seq_len(c$n)^2;v <- v-mean(v);v <- v-sum(v*u)/sum(u*u)*u;v <- v/sd(v)}else{v <- rep(0,c$n)}
 x <- c$mean1+c$sd1*u;y <- c$mean2+c$sd2*(c$r*u+sqrt(1-c$r^2)*v)
 result <- t.test(x,y,paired=TRUE,alternative=if(c$tails==2)'two.sided' else c$direction,conf.level=1-c$alpha)
 interval <- t.test(x,y,paired=TRUE,alternative=if(c$ciType=='two-sided')'two.sided' else c$direction,conf.level=1-c$alpha)
 data.frame(c,t=unname(result$statistic),p=result$p.value,df=unname(result$parameter),lower=interval$conf.int[1],upper=interval$conf.int[2],differenceSd=sd(x-y))
})
dir.create('.vite',showWarnings=FALSE)
write.csv(do.call(rbind,rows),'.vite/paired-reference.csv',row.names=FALSE)
