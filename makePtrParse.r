#!/usr/bin/Rscript --vanilla

# readom the source
sourceFile<-"./ptrparse.js"
targetFile<-"./TrestleTech/ace/lib/ace/mode/ptr/ptrparse.js"
sourceTail<-"./parseTail.js"

src<-readLines(sourceFile)
srcTail<-readLines(sourceTail)
pos1<-grep("use strict",src) # near top: line 7
int01<-1:(pos1-1)
srcBanner<-src[int01] # the banner and use strict
src<-src[-int01] #the rest

pos2<-grep("var mssgStack=",src) # split off the parsing portion, start of initialization portion
pos3<-grep("peg\\$result = peg\\$startRuleFunction",src) # end of peg initialization portion

int23<-pos2:(pos3-1)
srcPegInit<-src[int23] # peg initialization portion
src<-src[-int23]  # peg call portion + exports

pos4<-grep("module\\.exports",src)-1 #drop exports, to get call
srcCall<-src[1:pos4] #peg call portion


src<-c(
	"define(function(require, exports, module) {",
	'"use strict";',
	'var PTRPARSER = (function(){',
	srcBanner, # banner and strict
	srcPegInit, # peg initialization portion
	srcCall,  # peg call
	srcTail, # from the file="./parseTail.js"
	"});"
)

cat(src,file=targetFile, sep="\n")
cat(src,file="./ptrParseNew.js", sep="\n")
cat("done\n")

