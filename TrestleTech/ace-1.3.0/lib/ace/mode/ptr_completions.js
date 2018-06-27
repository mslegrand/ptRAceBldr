define(function(require, exports, module) {
"use strict";

//var langTools = ace.require("ace/ext/language_tools");

var ptrparser = require("../mode/ptr/ptrparse").PTRPARSER;
	
var scopeCodeMap= ptrparser.completionCodeMap;
var candidates = ptrparser.candidates;
var metaValues = ["Content Element", "Ancilarry Attribute",  "Regular Attribute", "Presentation Attribute"];
var scoreOffets = [1000, 2000, 2100, 2700];
var PtrCompletions = function() {
	
};

(function() {
   
  
    this.getCompletions = function(state, session, pos, prefix) {
	    
    var text= session.getDocument().getValue();
	    
    var context = ptrparser.context(text, pos);
    var scope = context.tok;
    var attrsTaken = context.attrs;
	    
        
    var scodes=[];
    var stcodes=[];
    if(!!scope){
      
      scodes=scopeCodeMap[scope];
      
      stcodes= scodes.map( function(sc){
	    return [ sc[0], sc[1], candidates[ sc[1] ][ sc[0]] ]
      }).filter( function(e){
	   if( !!attrsTaken ){
		//console.log('taken ' + JSON.stringify(e));
		//console.log('filter=' + JSON.stringify( attrsTaken.indexOf(e[2]) == -1));
		return attrsTaken.indexOf(e[2]) == -1;
	   } else {
	        return true;
	   }
      });
    }
    
    if(!!prefix){
          stcodes=stcodes.filter(function(stc){
	      //return stc[2].substring(0,prefix.length)===prefix;
	      return stc[2].startsWith(prefix,0);
          });
    }
    var rtv= stcodes.map(function(stc){
      var snip="=$0"; // stc[1]!=0 is an attribute
      if(stc[1]==0){ // stc[1]==0 is a content element
        snip = "($0)";
      }
      return {
        caption: stc[2],
        snippet: stc[2] + snip,
        meta: metaValues[stc[1]],
        score:  Number.MAX_SAFE_INTEGER - (1000 + scoreOffets[stc[1]] + stc[0])
      };
    });
    
    return rtv;
    };
}).call(PtrCompletions.prototype);

exports.PtrCompletions = PtrCompletions;
});
    
 
