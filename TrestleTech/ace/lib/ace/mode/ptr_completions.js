define(function(require, exports, module) {
"use strict";

//var langTools = ace.require("ace/ext/language_tools");

var ptrparser = require("../mode/ptr/ptrparse").PTRPARSER;

var attributeMap = ptrparser.attributeMap;
var contentMap = ptrparser.contentMap;


var PtrCompletions = function() {
};

(function() {
  
    this.getCompletions = function(state, session, pos, prefix) {
    //if (prefix.length === 0) { callback(null, []); return }
    // some awkwardness about whether to complete elements or attributes
    // to call PTRPARSER.avail(_input, _cursorPos) I need input and cursorPos
    // get document to get text
    // don't need editor or state, session, pos. prefix suffices
    console.log("enter  PtrCompletions");
    var text= session.getDocument().getValue();
    console.log("text= \n" + text);
    console.log( "pos=\n");
    console.log(JSON.stringify(pos));
    
    var scope = ptrparser.scope(text, pos);
    console.log( "scope=");	    
    console.log(JSON.stringify(scope));
    var availContent = [];
    var availAttributes = [];
    if(!!scope){
      console.log("scope=" + scope);
      availContent=contentMap[scope];
      availAttributes=attributeMap[scope];
    }
    if(prefix){
          availContent=availContent.filter( function(ec){
            return ec.indexOf(prefix)===0;
          });
          availAttributes=availAttributes.filter( function(ec){
            return ec.indexOf(prefix)===0;
          });
    }
    console.log("availAttributes=");
    console.log(JSON.stringify(availAttributes));
    console.log("availContent=");
    console.log(JSON.stringify(availContent));
    var aC= availContent.map( function(ac){
      return {
        caption: ac,
        snippet: ac + '($0)',
        meta: 'content element',
	score: Number.MAX_SAFE_INTEGER
      };
    });
    var aA= availAttributes.map( function(aa){
      return {
        caption: aa,
        snippet: aa + '=$0',
        meta: 'element attribute',
	score: Number.MAX_SAFE_INTEGER-10000
      };
    });
    //console.log(JSON.stringify(availContent));
    var rtv = aC.concat(aA);
    console.log(JSON.stringify(rtv));
    return rtv;
    };
}).call(PtrCompletions.prototype);

exports.PtrCompletions = PtrCompletions;
});
    
 
