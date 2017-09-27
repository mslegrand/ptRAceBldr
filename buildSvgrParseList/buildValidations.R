source("./tableLoader.R")

library(jsonlite)
requireTable( ES.DT)

clean<-function(x){
  gsub("[:-]",".",x)
}

cleanDT<-function(DT){
  DT[,attr:=clean(attr)]
  DT[,element:=clean(element)]
  DT
}

ES.DT[, element:=clean(element)]
ES.DT[, variable:=clean(variable)]
ES.DT[, value:=clean(value)]


# Dirty, but useful
expandDT<-function(DT, colNames){
  v<-colNames[[1]]
  cnt<-sapply(DT[[v]],length)
  reps<-rep(seq(1,length(cnt)),cnt)
  EDT<-DT[reps,]
  indx<-unlist(sapply(cnt,seq))
  for( vv in colNames){
    #EDT[,vv:=unlist(DT[,vv])]
    EDT[[vv]]<-unlist(DT[[vv]])
  }
  EDT
}

addScoring<-function(DT, offset=0, meta){
  all.attr<-sort(unique(DT[,attr]))
  scoreOf<-function(x){
    xx<-which(all.attr==x)
    if(length(xx)>0){
      c(offset+xx, meta)
    } else {
      c(0,0)
    }
  }
  DT[,score:=lapply(attr,scoreOf)]
  DT
}


getEle2content<-function(offset=0, meta=0){
  all.elements<-sort(unique(ES.DT$element))

  # edit content.DT
  content.DT<-ES.DT[ variable=="content.model"]
  content.DT[,variable:=NULL]
  # take care of value == '"Any elements or character data."
  content.DT[value %like% "Any elements", value:="any elements."]
  # add svgR entry
  svgR.DT<-content.DT[element=='svg']
  svgR.DT$element<-'svgR'
  # need to remove some content elements from outermost???
  content.DT<-rbind(content.DT, svgR.DT)
  # now unravel where we see categories
  category.DT<-ES.DT[ variable=="category"]
  category.DT[,variable:=NULL]
  category.DT$value<-tolower(category.DT$value)
  # add on an entry for "Any elements:"
  category.DT<-rbindlist(list(
    category.DT,
    data.table(element=all.elements,value="any element" )
  ))
  category.DT[,.(list(element)), by=value]->cat2eles.DT
  cat2eles.DT[,value:=paste0(value,"s.")]
  DT<-merge(content.DT, cat2eles.DT, by="value", all  = T)->tmp.DT
  DT<-DT[!(is.na(element))]
  DT<-DT[V1=="Empty.",V1:=""]
  DT[, NullFlag:=lapply(V1, is.null)]
  DT[NullFlag==TRUE, V1:=list(value)]
  DT[, c("NullFlag","value"):=list(NULL,NULL)]
  setnames(DT,"V1","attr")
  DT<-expandDT(DT, colNames=c('attr'))
  DT<-addScoring(DT, offset=offset, meta=meta)
  DT
}
  

requireTable(AVEL.DT, PA.DT)
requireTable(ANC.DT)

getEle2coAttr<-function(offset=0, meta=1){
  DT<-ANC.DT[!(element %in% c("in1")), .(element, attr)]
  DT<-cleanDT(DT)
  # add svgR entry
  removeFromSVG<-c("xy","cxy")  # remove xy,...
  svgR.DT<-DT[element=='svg' & !(attr %in% removeFromSVG)]
  svgR.DT[,element:="svgR"]            
  DT<-rbind(DT, svgR.DT)
  # add scoring
  DT<-addScoring(DT, offset, meta=meta)
  DT
}

getEle2regAttr<-function( offset=0, meta=2){
  DT<- AVEL.DT[, .(element,attr)]
  DT<-cleanDT(DT)
  # add svgR entry
  removeFromSVG<-c("x","y")
  svgR.DT<-DT[element=='svg' & !(attr %in% removeFromSVG)]
  svgR.DT$element<-'svgR'
  DT<-rbind(DT, svgR.DT)
  # add scoring
  DT<-addScoring(DT, offset, meta=meta)
  DT
}

getEle2presAttr<-function(offset=0, meta=3){
  DT<-PA.DT[variable=="Applies to", .(value,attr)]
  names(DT)<-c('element','attr')
  DT<-cleanDT(DT)
  # add svgR entry
  svgR.DT<-DT[element=='svg']
  svgR.DT$element<-'svgR'
  DT<-rbind(DT, svgR.DT)
  # add scoring
  DT<-addScoring(DT, offset, meta=meta)
  DT
}


do.validations<-function(){
  
  all.elements<-sort(unique(c("svgR", ES.DT$element)))
  
  
  offset=-1
  ele2content.DT<-getEle2content(offset=offset)
  ele2coAttr.DT<-getEle2coAttr(offset=offset)
  ele2regAttr.DT<-getEle2regAttr(offset=offset)
  ele2presAttr.DT<-getEle2presAttr(offset=offset)
  
  #used for accepted content elements
  ele2availContent.DT<-ele2content.DT[, .(list(attr), list(score)), by='element']
  setnames(ele2availContent.DT, c("V1","V2"),c("attr","score"))
  
  # used for accepted attributes
  ele2attr.DT<-rbindlist(list(
    ele2coAttr.DT,
    ele2regAttr.DT,
    ele2presAttr.DT
  ))
  
  # add in "svgR" as an element
  #svgRAttr.DT<- ele2attr.DT[element=='svgR']
  #svgRAttr.DT[,element:='svgR']
  #ele2attr.DT<-rbindlist(ele2attr.DT, svgRAttr.DT)
  
  ele2attr.DT<-ele2attr.DT[, .(list(attr), list(score)), by='element']
  setnames(ele2attr.DT, c("V1","V2"),c("attr","score"))
  
  eleCompletionCandiatesList<-list(
    sort(unique(ES.DT$element)),
    sort(unique(ele2coAttr.DT[,attr])),
    sort(unique(ele2regAttr.DT[,attr])),
    sort(unique(ele2presAttr.DT[,attr]))
  )
  
  ele2completions.DT<-rbindlist(list(
    ele2content.DT,
    ele2coAttr.DT,
    ele2regAttr.DT,
    ele2presAttr.DT
  ))
  ele2completions.DT<-ele2completions.DT[, .(list(score)), by='element']
  setnames(ele2completions.DT, "V1","score")
  
  # write to 'file 'validatoR.txt'
  # all elements
  # all attributes?
  # all completions
  
  # acceptedAttributes
  ele2attrList<-structure( ele2attr.DT[,attr], names=ele2attr.DT[,element] )
  ele2attrJSON<-toJSON(ele2attrList, pretty=TRUE )
  ele2attrJSON<-paste0( "var acceptedAttributes = ", ele2attrJSON, ";\n")
  txt<-c(ele2attrJSON)
  
  txt<-c(txt, paste0("var allElements = ", toJSON(all.elements, pretty=TRUE),";"))
  
  # acceptedContentEle
  ele2availContentList<-structure(ele2availContent.DT[,attr], names=ele2availContent.DT[,element])
  ele2availContentJSON<-toJSON(ele2availContentList, pretty=TRUE)
  ele2availContentJSON<-paste0("var acceptContentEle = ",ele2availContentJSON, ";\n")
  txt<-c(txt,ele2availContentJSON)
  
  
  #attribute completion scores
  
  ele2completionsJSON<-paste0( "var scopeCompletionCandidates = ", toJSON(eleCompletionCandiatesList), ";\n")
  txt<-c(txt,ele2completionsJSON)
  ele2completionsList<-structure( ele2completions.DT[,score], names=ele2completions.DT[,element] )
  ele2completionsJSON<-toJSON(ele2completionsList, pretty=FALSE )
  ele2completionsJSON<-paste0( "var scopeCompletions = ", ele2completionsJSON, ";\n")
  txt<-c(txt,ele2completionsJSON)
  
  txt<-paste(txt, collapse="\n")
  cat( txt, file="../validatoR.txt" )
  
  #test of svgR 
  # scope<-'polygon'
  # stcode<-ele2completionsList[[scope]]
  # xx<-lapply(stcode, function(stc){
  #   score<-stc[1]
  #   type<-stc[2]
  #   name<-eleCompletionCandiatesList[[type+1]][score+1]
  #   tt<-paste(score,type, name)
  #   cat(tt,"\n")
  # })
}

do.validations()

