#Used to create the list of valid Attrs for each element
# I need this not for the building of of the svgR project
# but for the syntax validator for ace in the ptR project
source("tableLoader.R")

requireTable(AVEL.DT,COP.DT,PA.DT, AET.DT, ES.DT)

# for the elements that support cxy
xywh<-c('x','y','width','height')
AET.DT[attr %in% xywh,]->tmp.DT
tmp.DT[,.N, by=element]->tmp2.DT
tmp2.DT[N==4,element]->cxySupported
cxySupported<-c(c('text' , 'textPath' , 'tspan'),cxySupported)

getMissingAttrs<-function(el){
  attrs<-c()
  if(el %in% cxySupported){
    attrs<-c(attrs,"cxy")
  }
  if(el %in% c( "path", "line", "polyline", "polygon") ){
    attrs<-c(attrs,"marker-start",  "marker-mid", "marker-end")
  }
  if(el %in% c( "linearGradient", "radialGradient") ){
    attrs<-c(attrs,"colors",  "offsets")
  }
  attrs
}
getAttrsOrig<-function(eleName){
  #regular attributes
  removeAttrs<-NULL
  if(eleName=="svgR"){
    eleName="svg"
    removeAttrs<-c("x","y")
  }
  regAttrs<- AVEL.DT[element==eleName]$attr
  comboAttrs<-COP.DT[element==eleName, .SD[1,], by=variable]$variable
  presAttrs<-PA.DT[variable=="Applies to" & value==eleName]$attr
  missingAttrs<-getMissingAttrs(eleName)
  attrs<-c(regAttrs, comboAttrs, presAttrs, missingAttrs) 
  if(!is.null(removeAttrs)){
    attrs<-attrs[!is.element(attrs, removeAttrs)]
  } 
  if("in" %in% attrs){
    attrs[which(attrs=="in")]<-"in1"
  }
  
  attrs<-gsub("[-:]", ".", attrs)
  sort(attrs)
}


getAttrEntry<-function(eleName){ 
  attrs<-getAttrsOrig(eleName)
  attrs<-gsub("[-:]",".",attrs)
  attrs<-paste0('"',attrs,'"')
  eleName<-gsub("[-:]",".",eleName)
  eleName<-paste0('"',eleName,'"')
  attrs<-paste0(attrs, collapse=", ")
  rtv<-paste(eleName, ": [", attrs, "]")
  rtv
}

all.elements<-c(unique(ES.DT$element),"svgR")

ele.attr<-sapply(all.elements, function(eleName){
  getAttrEntry(eleName)
})

ele.attr<-paste0(ele.attr, collapse=",\n")

txt<-paste0(
"var acceptedAttributes = {\n ",
ele.attr,
"\n};\n", 
collapse="\n")



cat(txt,file = "validateElementAttributes.txt")

