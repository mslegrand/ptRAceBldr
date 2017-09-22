#Creates a list of valid content elements, that is 
# a names list whose entries consist of the content.model for 
# each named svgR element. 

# I need this not for the building of of the svgR project
# but for the syntax validator for ace in the ptR project


library(data.table)
library(jsonlite)
requireTable(AVEL.DT,COP.DT,PA.DT, AET.DT)

getAttrsOrig<-function(eleName){
  #regular attributes
  regAttrs<- AVEL.DT[element==eleName]$attr
  comboAttrs<-COP.DT[element==eleName, .SD[1,], by=variable]$variable
  presAttrs<-PA.DT[variable=="Applies to" & value==eleName]$attr
  attrs<-c(regAttrs, comboAttrs, presAttrs) 
  sort(attrs)
}


getScoreArr<-function(){
  tmp<-list(
  allEles<-sort(unique(AET.DT$element)),
  allComboAttrs<-sort(unique(COP.DT[,.SD[1,], by=variable]$variable)),
  allRegAttrs<-sort(unique(AVEL.DT[, attr])), 
  allPresAttrs<-sort(unique(PA.DT$attr))
  )
  scores<-toJSON(gsub("[:-]",".", unlist(tmp)), pretty=TRUE)
  
  metas<-as.list(cumsum(sapply(tmp, length)))
  metas<-c(
    rep('Content Element', length(allEles)),
    rep('Complementary Attribute', length(allComboAttrs)),
    rep('Regular Attribute', length(allRegAttrs)),
    rep('Presentation Attribute', length(allPresAttrs))
  ) 
  
  metas<-toJSON(unlist(metas), pretty=TRUE)
  
  scrarry<-paste0("var scores =", scores, ";\n","var metas=",metas,";\n")
  
  scrarry
}

getAttributeCompletions<-function(){
  hi<-c(
    "activateAttributeCompletions<-function(){",
    "utils:::.addFunctionInfo("
  )
  
  ele.tags<-sort(unique(AET.DT$element))
  
  hints<-lapply(ele.tags, function(etag){
    attrs<-getAttrsOrig(etag)
    attrs<-gsub("[:-]",".",attrs)
    txt<-paste0("'",attrs,"'",collapse=", ")
    etag<-gsub("[:-]",".",etag)
    txt<-paste(etag,"=c(",txt,")")
  })
  unlist(hints) 
  hints<-paste(hints, collapse=",\n")
  hints<-c(hi,hints,")}")
  unlist(hints) 
  paste(hints,collapse="\n")
}

do.attr.completions<-function(composerFiles="svgR"){ 
  completions<-getAttributeCompletions()
  descript<-
"#' Activate Attribute Completions
#'
#' @export
"  
  completions<-paste0(descript,completions)
  cat(completions, file=paste(composerFiles, "eleCompletions.R", sep="/") )
}

do.scoreArray<-function(){
  sa<-getScoreArr()
  cat(sa, file ='scoring.txt')
}

#do.attr.completions()
do.scoreArray()
