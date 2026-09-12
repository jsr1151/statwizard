# Run from the repository root with Rscript scripts/generate-rank-fixtures.R.
# Base R only. Exact fixtures have no ties/zeros, for compatibility with R 4.5.
cases <- list(
  list(name="independent_reference", paired=FALSE, x=c(19,22,16,29,24), y=c(20,11,17,12), exact=TRUE),
  list(name="independent_ties", paired=FALSE, x=c(1,2,2,5,9), y=c(2,3,3,4,8,10), exact=FALSE),
  list(name="independent_unbalanced", paired=FALSE, x=c(-3,-2), y=c(-1,0,1,2,3,4,5,6,7,8,9,10), exact=FALSE),
  list(name="paired_reference", paired=TRUE, x=c(6,8,14,16,23,24,28,29,41,-48,49,56,60,-67,75), y=rep(0,15), exact=TRUE),
  list(name="paired_zeros_ties", paired=TRUE, x=c(1,2,-2,0,4,-4,5,-1), y=rep(0,8), exact=FALSE),
  list(name="paired_all_negative", paired=TRUE, x=c(-1,-2,-3,-4,-5,-6), y=rep(0,6), exact=TRUE)
)
json_bool <- function(x) if (x) "true" else "false"
json_array <- function(x) paste0("[",paste(x,collapse=","),"]")
rows <- c()
for (case in cases) for (alternative in c("two.sided","less","greater")) {
  for (exact in if (case$exact) c(TRUE,FALSE) else FALSE) for (correct in if (exact) TRUE else c(TRUE,FALSE)) {
    result <- suppressWarnings(wilcox.test(case$x,case$y,paired=case$paired,alternative=alternative,exact=exact,correct=correct))
    rows <- c(rows,sprintf('{"name":"%s","paired":%s,"first":%s,"second":%s,"alternative":"%s","method":"%s","continuity":%s,"statistic":%.17g,"p":%.17g}',
      case$name,json_bool(case$paired),json_array(case$x),json_array(case$y),gsub("two.sided","two-sided",alternative,fixed=TRUE),if(exact)"exact" else "asymptotic",json_bool(correct),unname(result$statistic),result$p.value))
  }
}
dir.create("src/stats/fixtures",showWarnings=FALSE,recursive=TRUE)
writeLines(paste0('{"source":"R ',getRversion(),' stats::wilcox.test","cases":[\n',paste(rows,collapse=",\n"),'\n]}'),"src/stats/fixtures/nonparametric-r.json")
cat(length(rows),"R reference cases written\n")
