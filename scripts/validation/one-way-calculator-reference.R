# Run from the repository root with base R; no packages required.
cases <- list(
 example=list(c(5,6,7,5,6),c(8,7,9,8,7),c(3,4,2,3,4)),
 unequal=list(c(-4,-2,1),c(1,3,4,7,9),c(2,8,12,13)),
 identical_means=list(c(1,2,3),c(0,2,4),c(-1,2,5)),
 two_groups=list(c(1,3,6),c(2,5,9,12)),
 small_scale=list(c(.0001,.0003,.0009),c(.0002,.0005,.0006),c(.0004,.0007,.0008)),
 large_f=list(c(1,2,3),c(100,101,102),c(200,201,202)),
 singleton=list(4,c(1,3,8),c(6,8,9)),
 constant_group=list(c(4,4,4),c(2,5,8),c(7,9,12))
)
rows <- lapply(seq_along(cases), function(i) {
 groups <- cases[[i]]; alpha <- c(.05,.1,.01)[(i-1)%%3+1]; k <- length(groups)
 y <- unlist(groups); g <- factor(rep(seq_along(groups), lengths(groups))); fit <- aov(y~g); tab <- summary(fit)[[1]]
 df1 <- tab[1,'Df']; df2 <- tab[2,'Df']; msW <- tab[2,'Mean Sq']; count <- choose(k,2)
 difference <- mean(groups[[1]])-mean(groups[[2]]); se <- sqrt(msW*(1/length(groups[[1]])+1/length(groups[[2]])))
 pair <- pairwise.t.test(y,g,p.adjust.method='bonferroni',pool.sd=TRUE)
 raw <- vapply(groups,function(x) paste(format(x,digits=16,trim=TRUE),collapse=';'),'')
 data.frame(id=names(cases)[i],raw1=raw[1],raw2=raw[2],raw3=if(k==3)raw[3] else '',alpha=alpha,F=tab[1,'F value'],p=tab[1,'Pr(>F)'],df1=df1,df2=df2,
  ssB=tab[1,'Sum Sq'],ssW=tab[2,'Sum Sq'],Fcrit=qf(1-alpha,df1,df2),pairP=pair$p.value[1,1],lower=difference-qt(1-alpha/(2*count),df2)*se,upper=difference+qt(1-alpha/(2*count),df2)*se)
})
dir.create('.vite',showWarnings=FALSE)
write.csv(do.call(rbind,rows),'.vite/one-way-reference.csv',row.names=FALSE)
f_cases <- data.frame(F=c(0,3.5,4.2,2500),df1=c(2,2,1.5,3),df2=c(25,25,8.3,20),alpha=c(.05,.05,.1,.01))
f_cases$p <- pf(f_cases$F,f_cases$df1,f_cases$df2,lower.tail=FALSE)
f_cases$Fcrit <- qf(1-f_cases$alpha,f_cases$df1,f_cases$df2)
write.csv(f_cases,'.vite/one-way-f-reference.csv',row.names=FALSE)
