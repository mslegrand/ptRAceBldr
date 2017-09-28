define(function(require, exports, module) {
"use strict";

//var langTools = ace.require("ace/ext/language_tools");

var ptrparser = require("../mode/ptr/ptrparse").PTRPARSER;

//var attributeMap = ptrparser.attributeMap;
//var contentMap = ptrparser.contentMap;
//var scoreMap = ptrparser.scoreMap;
//var metaMap = ptrparser.metaMap;
	
var scopeCodeMap= ptrparser.completionCodeMap;
var candidates = ptrparser.candidates;
var metaValues = ["Content Element", "Ancilarry Attribute",  "Regular Attribute", "Presentation Attribute"];
var scoreOffets = [1000, 2000, 2100, 2700];
var PtrCompletions = function() {
	
};

(function() {
   
  
    this.getCompletions = function(state, session, pos, prefix) {
    //if (prefix.length === 0) { callback(null, []); return }
    // some awkwardness about whether to complete elements or attributes
    // to call PTRPARSER.avail(_input, _cursorPos) I need input and cursorPos
    // get document to get text
    // don't need editor or state, session, pos. prefix suffices
    //console.log("enter  PtrCompletions");
    var text= session.getDocument().getValue();
    //console.log("text= \n" + text);
    //console.log( "pos=\n");
    //console.log(JSON.stringify(pos));
    var context = ptrparser.context(text, pos);
    var scope = context.tok;
    var attrsTaken = context.attrs;
	    
    console.log( "scope=");	    
    console.log(JSON.stringify(scope));
    console.log( "attrsTaken=");	    
    console.log(JSON.stringify(attrsTaken));
    //var availContent = [];
    //var availAttributes = [];
    var scodes=[];
    var stcodes=[];
    if(!!scope){
      //console.log("scope=" + scope);
      //availContent=contentMap[scope];
      //availAttributes=attributeMap[scope];
      //console.log("candidates");
      //console.log(JSON.stringify(candidates));
      scodes=scopeCodeMap[scope];
      //console.log("scodes");
      //console.log(JSON.stringify(scodes));
     // var sm =null;
     // sm= scodes.map( function(sc){
     //   return candidates[ sc[1] ][ sc[0]] ;
     // });
      //console.log("sm");
      //console.log(JSON.stringify(sm));
      stcodes= scodes.map( function(sc){
	    return [ sc[0], sc[1], candidates[ sc[1] ][ sc[0]] ]
      }).filter( function(e){
	   if( !!attrsTaken ){
		console.log('taken ' + JSON.stringify(e));
		console.log('filter=' + JSON.stringify( attrsTaken.indexOf(e[2]) == -1));
		return attrsTaken.indexOf(e[2]) == -1;
	   } else {
	        return true;
	   }
      });
    }
    //console.log("stcodes");
    //console.log(JSON.stringify(stcodes));
    
    if(prefix){
          stcodes=stcodes.filter(function(stc){
	      console.log(stc[2]);
	      console.log(stc[2].indexOf(prefix));
              //return stc[2].indexOf(prefix)===0;
	      return stc[2].substring(0,prefix.length)===prefix;
          });
          //availContent=availContent.filter( function(ec){
          //  return ec.indexOf(prefix)===0;
          //});
          //availAttributes=availAttributes.filter( function(ec){
          //  return ec.indexOf(prefix)===0;
          //});
    }
    console.log("stcodes 2");
    console.log( JSON.stringify(stcodes));
    var rtv= stcodes.map(function(stc){
      var snip="=$0"; // attr
      if(stc[1]==0){ // 0 is a content element
        snip = "($0)";
      }
      return {
        caption: stc[2],
        snippet: stc[2] + snip,
        meta: metaValues[stc[1]],
        score:  Number.MAX_SAFE_INTEGER - (1000 + scoreOffets[stc[1]] + stc[0])
      };
    });
    
    
    //console.log("availAttributes=");
    //console.log(JSON.stringify(availAttributes));
    //console.log("availContent=");
    //console.log(JSON.stringify(availContent));
    /*
    var aC= availContent.map( function(ac){
      return {
        caption: ac,
        snippet: ac + '($0)',
        //meta: 'content element',
	meta: metaMap[scoreMap.indexOf(ac)],
	score: Number.MAX_SAFE_INTEGER-1000- scoreMap.indexOf(ac)
	//score: Number.MAX_SAFE_INTEGER
      };
    });
    var aA= availAttributes.map( function(aa){

      return {
        caption: aa,
        snippet: aa + '=$0',
        meta: metaMap[scoreMap.indexOf(aa)],
	score: Number.MAX_SAFE_INTEGER-1000- scoreMap.indexOf(aa)
      };
    });
    //console.log(JSON.stringify(availContent));
    var rtv = aC.concat(aA);
    */
    //console.log(JSON.stringify(rtv));
    return rtv;
    };
}).call(PtrCompletions.prototype);

exports.PtrCompletions = PtrCompletions;
});
    
 
