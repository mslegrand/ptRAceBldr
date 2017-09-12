#Creates a list of valid content elements, that is 
# a names list whose entries consist of the content.model for 
# each named svgR element. 

# I need this not for the building of of the svgR project
# but for the syntax validator for ace in the ptR project


library(data.table)
requireTable(AVEL.DT,COP.DT,PA.DT, AET.DT)

getAttrsOrig<-function(eleName){
  #regular attributes
  regAttrs<- AVEL.DT[element==eleName]$attr
  comboAttrs<-COP.DT[element==eleName, .SD[1,], by=variable]$variable
  presAttrs<-PA.DT[variable=="Applies to" & value==eleName]$attr
  attrs<-c(regAttrs, comboAttrs, presAttrs) 
  sort(attrs)
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

do.attr.completions()

