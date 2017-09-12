library(data.table)
library(XML)
if(!exists("requireTable")){ source("tableLoader.R") }
#source("specialTagHandlers.R")

# insertConditionalCode(ele.tag,attrsEle2Quote$filter, echoQuote, filterQuote),
# insertConditionalCode(ele.tag,attrsEle2Quote$fill, echoQuote, fillQuote),
# insertConditionalCode(ele.tag,attrsEle2Quote$clip.path, echoQuote, clipPathQuote),
# insertConditionalCode(ele.tag,attrsEle2Quote$mask, echoQuote, maskQuote),
# insertConditionalCode(ele.tag,attrsEle2Quote$marker, echoQuote, markerEndQuote),
# insertConditionalCode(ele.tag,attrsEle2Quote$marker, echoQuote, markerMidQuote),
# insertConditionalCode(ele.tag,attrsEle2Quote$marker, echoQuote, markerStartQuote),
# insertConditionalCode(ele.tag, c('text' , 'textPath' , 'tspan'), echoQuote, textQuote),
# insertConditionalCode(ele.tag, c("linearGradient",  "radialGradient"), echoQuote, gradientColorQuote)            
# 
# translate=function(dx,dy=NULL){
#   
#   list(translate=c(dx,dy))
# },
# rotate=function(angle, x=NULL, y=NULL){
#   
#   list(rotate=c(angle,x,y))     
# },
# rotatR=function(angle, x=NULL, y=NULL){
#   
#   tmp<-c(angle,x,y)
#   tmp[1]<-as.numeric(tmp[1])*180/pi #convert from radians to degrees
#   list(rotate=tmp)     
# },
# scale=function(dx,dy=NULL){
#   
#   list(scale=c(dx,dy))
# },
# 
# #
# 


# gradXtra<-list(
#   linearGradient=c("colors","offsets"),
#   radialGradient=c("colors","offsets")
# )


requireTable(AET.DT, COP1.DT, PA.DT)

supports.cxy<-function(ele.tag){
  ifelse(
    nrow(AET.DT[  element==ele.tag & 
                    (attr=='x' | attr=='y' | attr=='width' | attr=='height') ,]
    )==4,
    ele.tag,
    NULL
  )  
}

xywh<-c('x','y','width','height')
# all elements
ele.tags<-unique(AET.DT$element)
#all attributes
#ele.tags.attributeName<-AET.DT[attr=="attributeName"]$element
#tmp<-lapply(ele.tags, supports.cxy)
AET.DT[attr %in% xywh,]->tmp.DT
tmp.DT[,.N, by=element]->tmp2.DT
tmp2.DT[N==4,element]->cxySupported
cxySupported<-c(c('text' , 'textPath' , 'tspan'),cxySupported)

requireTable(
  "AVEL.DT", "AVD.DT",  "es.DT",   "eaCS.DT", "PA.DT",  
  "COP.DT",  "COP1.DT", "AET.DT"  
)

# PA.DT has items that need to be expanded, such as:
list(
  "marker properties"=c( "marker-start", "marker-mid", "marker-end")
)
# 	‘path’, ‘line’, ‘polyline’ ‘polygon’ all apply to marker properties

# want: for each element, all valid attributes
# given the results from validateAttribute.R
# add to element list, the right stuff

# start with ele.attr and add newAttr
# ele.attr[[ele]]<-c(ele.attr[[ele]], newAttr)

xywh<-c('x','y','width','height')
AET.DT[attr %in% xywh,]->tmp.DT
tmp.DT[,.N, by=element]->tmp2.DT
tmp2.DT[N==4,element]->cxySupported
cxySupported<-c(c('text' , 'textPath' , 'tspan'),cxySupported)


eleList<- cxySupported
for(el in eleList){
  ele.attr[[el]]<-c(ele.attr[[el]], "cxy")
}
eleList<-c( "path", "line", "polyline", "polygon")
for(el in eleList){
  ele.attr[[el]]<-c(ele.attr[[el]], "marker-start")
  ele.attr[[el]]<-c(ele.attr[[el]], "marker-mid")
  ele.attr[[el]]<-c(ele.attr[[el]], "marker-end")
}

eleList<-c( "linearGradient", "radialGradient")
for(el in eleList){
  ele.attr[[el]]<-c(ele.attr[[el]], "colors")
  ele.attr[[el]]<-c(ele.attr[[el]], "offsets")
}

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