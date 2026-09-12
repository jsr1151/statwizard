# From repository root: Rscript scripts/generate-repeated-measures-fixtures.R
# Base R model fitting, sphericity diagnostics, and F tails provide the references.
set.seed(20260912)
cases <- list(tutorial=matrix(c(2.2,1.1,8.2,3.1,2.5,4.5,4.3,4.1,3.4,4.1,5.2,6.2,7.2,6.4,7.2),ncol=3,byrow=TRUE))
for (k in c(2,3,4,6,12)) {
  n <- k+8
  subject <- rnorm(n,50,10)
  Y <- matrix(rnorm(n*k),n,k)
  for(j in seq_len(k)) Y[,j] <- subject + j/3 + Y[,j]*j
  cases[[paste0("conditions_",k)]] <- Y
}
cases$null_means <- matrix(c(1,2,3,3,1,2,2,3,1,1,3,2,3,2,1,2,1,3),ncol=3,byrow=TRUE)
num <- function(x) if(is.finite(x)) sprintf("%.17g",x) else "null"
arr <- function(x) paste0("[",paste(vapply(x,num,""),collapse=","),"]")
output <- c()
for(name in names(cases)) {
  Y <- cases[[name]]; n<-nrow(Y); k<-ncol(Y)
  data <- data.frame(y=as.vector(Y),subject=factor(rep(seq_len(n),k)),condition=factor(rep(seq_len(k),each=n)))
  model <- aov(y~condition+Error(subject/condition),data=data)
  tab <- summary(model)[["Error: subject:condition"]][[1]]
  subjectSS <- summary(model)[["Error: subject"]][[1]][1,"Sum Sq"]
  F <- tab[1,"F value"]; ss<-tab[1,"Sum Sq"]; errorSS<-tab[2,"Sum Sq"]
  fit <- lm(Y~1)
  eps <- if(k==2) list(GG.eps=1,HF.eps=1) else stats:::sphericity(SSD(fit),X=~1)
  gg<-eps$GG.eps; hf<-min(1,eps$HF.eps)
  mw <- if(k==2) list(statistic=NA,p.value=NA) else mauchly.test(fit,X=~1)
  matrixJson <- paste0("[",paste(apply(Y,1,arr),collapse=","),"]")
  output <- c(output,paste0('{"name":"',name,'","matrix":',matrixJson,',"f":',num(F),',"ssCondition":',num(ss),',"ssSubject":',num(subjectSS),',"ssError":',num(errorSS),',"gg":',num(gg),',"hf":',num(hf),',"mauchlyW":',num(unname(mw$statistic)),',"mauchlyP":',num(mw$p.value),',"p":',num(pf(F,k-1,(n-1)*(k-1),lower.tail=FALSE)),',"pGG":',num(pf(F,gg*(k-1),gg*(n-1)*(k-1),lower.tail=FALSE)),',"pHF":',num(pf(F,hf*(k-1),hf*(n-1)*(k-1),lower.tail=FALSE)),'}'))
}
writeLines(paste0('{"source":"R ',getRversion(),' aov, sphericity, mauchly.test, pf","cases":[\n',paste(output,collapse=",\n"),'\n]}'),"src/stats/fixtures/repeated-measures-r.json")
cat(length(output),"R model reference datasets written\n")
