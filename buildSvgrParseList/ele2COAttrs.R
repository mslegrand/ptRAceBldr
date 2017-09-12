requireTable(COP.DT)
requireTable(AVEL.DT)

ele2COAttrs<-function(elName){
  #-----combo attributes
  co.loc2<-function(attr,loc, variable){
    sapply(1:length(attr), function(i){
      pattern<-paste0(attr[i],"Attribute$")
      variable<-paste0(toupper(variable[i]),'Attribute')
      sub(pattern, variable, loc[i], ignore.case=T)    
    })   
  }
  
  AL.DT<- AVEL.DT[element==elName, list(loc), key=attr] #attr loc
  # 1. get the combined attrs from COP.DT
  COP.DT[element==elName, .SD[1,], by=variable]->tmp1.DT      
  # 2. extract from AL.DT, the locations and form CAL.COP.DT for combined
  if(nrow(tmp1.DT)>0){
    setkey(tmp1.DT,value)
    #In one step :)
    CAL.COP.DT<-AL.DT[tmp1.DT,
      list(
      category='complemenary attributes', 
      attr=variable, 
      loc=co.loc2(attr, loc, variable)
      )
    ]
    setkey(CAL.COP.DT, attr) #make sure that it's sorted
    CAL.COP.DT       
  } else {
    NULL
  }
  
  
}