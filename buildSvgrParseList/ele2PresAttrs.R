#source("./doc/helpers/commonDoc.R")
requireTable(PA.DT)

ele2PresAttrs<-function(elName){
  presAttrs<-PA.DT[variable=="Applies to" & value==elName, attr]
  presAttrs
}
