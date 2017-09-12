
library(data.table)

tablesSrc=list(
  AVEL.DT="./dataTables/AVELTable5.csv",
  #ANC.DT="./dataTables/Ancillary10.csv",
  #AVD.DT=".dataTables/AVDTable.tsv",
  ES.DT="./dataTables/ES.csv",
  #eaCS.DT="./dataTables/elementAttrCategorySummary.tsv",
  PA.DT="./dataTables/PA.csv",
  COP.DT="./dataTables/COP.csv",
  #COP1.DT="./dataTables/comboParams.tsv",
  AET.DT="./dataTables/AETTable.tsv"
)

#~ usage:  
#~ requireTable(AVD.DT, eaCS.DT)
requireTable<-function(...){
  tmp<-deparse(sys.call())
  tmp<-gsub("requireTable\\(","",tmp)
  tmp<-gsub("[\\(\\)\'\"]","",tmp)
  dtNames<-strsplit(tmp, "[ ,]+")[[1]]
  if(!is.null(dtNames)){
    lapply(dtNames,
           function(name){
             if(!exists(name)){
               if(!(name%in%names(tablesSrc))){
                 cat(paste("Cannot find path for data.table='", name,"'\n"))
                 #stop(paste("Cannot find path for data.table='", name,"'\n"))
               } else{
                 path<-tablesSrc[[name]]
                 cl<-substitute(fread(path )->>name, list(path=path, name=name))
                 eval(cl, env=parent.frame() )        
               }
             }
           })    
  }
  invisible('')
}



