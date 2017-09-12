requireTable(AVEL.DT)

ele2RegAttrs<-function( elName ){
  #------gets the regular attributes and loc
  if(elName=='svgR'){
    attr<-AVEL.DT[element=='svg',attr]
    attr<-setdiff(attr,c("x","y"))
  } else {
    attr<-AVEL.DT[element=='svg',attr]
  }
}