/* ***** BEGIN LICENSE BLOCK *****
  * Distributed under the BSD license:
  *
  * Copyright (c) 2010, Ajax.org B.V.
* All rights reserved.
*
  * Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
  *     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*     * Neither the name of Ajax.org B.V. nor the
*       names of its contributors may be used to endorse or promote products
*       derived from this software without specific prior written permission.
*
  * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
  * ***** END LICENSE BLOCK ***** */
  
  define(function(require, exports, module) {
    "use strict";
    
    var oop = require("../lib/oop");
    var lang = require("../lib/lang");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
    var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
    var XmlHighlightRules = require("./xml_highlight_rules").XmlHighlightRules;
    var HtmlHighlightRules = require("./html_highlight_rules").HtmlHighlightRules;
    var CssHighlightRules = require("./css_highlight_rules").CssHighlightRules;
    var SnippetHighlightRules = require("./snippets").SnippetHighlightRules;
    var PtrHighlightRules = require("./ptr_highlight_rules").PtrHighlightRules;
    //var YamlHighlightRules = require("./yaml_highlight_rules").YamlHighlightRules
    
    var escaped = function(ch) {
      return "(?:[^" + lang.escapeRegExp(ch) + "\\\\]|\\\\.)*";
    };
    
    function github_embed(tag, prefix) {
      return { // Github style block
        token : "support.function",
        regex : "^\\s*```\\{\\s*" + tag +"(|[ ,].*\\}\\s*$)",
        push  : prefix + "start"
      };
    }
    
    var DnippetsHighlightRules = function() {
      HtmlHighlightRules.call(this);
      // regexp must not have capturing parentheses
      // regexps are ordered -> the first match is used
      
      this.$rules["start"].unshift(
        {
          token : "empty_line",
          regex : '^$',
          next: "allowBlock"
        }, {  // h1
          token: "markup.heading.1",
          regex: "^=+(?=\\s*$)"
        }, { // h2
          token: "markup.heading.2",
          regex: "^\\-+(?=\\s*$)"
        },{
          token : function(value) {
            return "markup.heading." + value.length;
          },
          regex : /^#{1,6}(?=\s*[^ #]|\s+#.)/,
            next : "header"
        },
        {  token:  "support.function",
          regex: 'SVGR',
          next: 'SVGR'
        },
        {  token:  "support.function",
          regex: 'SNIPPET',
          next: 'SNIPPET'
        },
        {  token:  "support.function",
          regex: 'POPUP',
          next: 'POPUP'
        },
        { // Github style block
          token : "support.function",
          regex : "^\\s*```\\s*\\S*(?:{.*?\\})?\\s*$",
          next  : "githubblock"
        }, { // block quote
          token : "string.blockquote",
          regex : "^\\s*>\\s*(?:[*+-]|\\d+\\.)?\\s+",
          next  : "blockquote"
        }, { // HR * - _
          token : "constant",
          regex : "^ {0,2}(?:(?: ?\\* ?){3,}|(?: ?\\- ?){3,}|(?: ?\\_ ?){3,})\\s*$",
          next: "allowBlock"
        }, { // list
          token : "markup.list",
          regex : "^\\s{0,3}(?:[*+-]|\\d+\\.)\\s+",
          next  : "listblock-start"
        }, {
          include : "basic"
        });
      
      this.addRules({
        "basic" : [{
          token : "constant.language.escape",
          regex : /\\[\\`*_{}\[\]()#+\-.!]/
        },
        { // code span `
          token : "support.function",
          regex : "(`+)(.*?[^`])(\\1)"
        },
        { // strong ** __
          token : "string.strong",
          regex : "([*]{2}|[_]{2}(?=\\S))(.*?\\S[*_]*)(\\1)"
        }, { // emphasis * _
          token : "string.emphasis",
          regex : "([*]|[_](?=\\S))(.*?\\S[*_]*)(\\1)"
        }, { //
            token : ["text", "url", "text"],
          regex : "(<)("+
            "(?:https?|ftp|dict):[^'\">\\s]+"+
            "|"+
            "(?:mailto:)?[-.\\w]+\\@[-a-z0-9]+(?:\\.[-a-z0-9]+)*\\.[a-z]+"+
            ")(>)"
        }],
          
          "SVGR" : [
            { // Github style block
              token : "support.function",
              regex : "^\\s*```\\s*",
              push  : "ptrcode-" + "start"
            }, 
            {
              token :  "constant.language.escape",
              regex :  "",
              next: "start"  
            }
            ],
          "SNIPPET" : [
            { // Github style block
              token : "support.function",
              regex : "^\\s*```\\s*",
              push  : "snippetcode-" + "start"
            }, 
            {
              token :  "constant.language.escape",
              regex :  "",
              next: "start"  
            }
            ],
          "POPUP" : [
            { // Github style block
              token : "support.function",
              regex : "^\\s*```\\s*",
              push  : "textcode-" + "start"
            }, 
            {
              token :  "constant.language.escape",
              regex :  "",
              next: "start"  
            }
            ],
          
          
          // code block
          "allowBlock": [
            {token : "support.function", regex : "^ {4}.+", next : "allowBlock"},
            {token : "empty_line", regex : '^$', next: "allowBlock"},
            {token : "empty", regex : "", next : "start"}
            ],
          
          "header" : [{
            regex: "$",
            next : "start"
          }, {
            include: "basic"
          }, {
            defaultToken : "heading"
          } ],
          
          "listblock-start" : [{
            token : "support.variable",
            regex : /(?:\[[ x]\])?/,
            next  : "listblock"
          }],
          
          "listblock" : [ { // Lists only escape on completely blank lines.
            token : "empty_line",
            regex : "^$",
            next  : "start"
          }, { // list
            token : "markup.list",
            regex : "^\\s{0,3}(?:[*+-]|\\d+\\.)\\s+",
            next  : "listblock-start"
          }, {
            include : "basic", noEscape: true
          }, { // Github style block
            token : "support.function",
            regex : "^\\s*```\\s*[a-zA-Z]*(?:{.*?\\})?\\s*$",
            next  : "githubblock"
          }, {
            defaultToken : "list" //do not use markup.list to allow stling leading `*` differntly
          } ],
          
          "blockquote" : [ { // Blockquotes only escape on blank lines.
            token : "empty_line",
            regex : "^\\s*$",
            next  : "start"
          }, { // block quote
            token : "string.blockquote",
            regex : "^\\s*>\\s*(?:[*+-]|\\d+\\.)?\\s+",
            next  : "blockquote"
          }, {
            include : "basic", noEscape: true
          }, {
            defaultToken : "string.blockquote"
          } ],
          
          "githubblock" : [ {
            token : "support.function",
            regex : "^\\s*```",
            next  : "start"
          }, {
            defaultToken : "support.function"
          } ]
      });
      
      this.embedRules(PtrHighlightRules, "ptrcode-", [{
        token : "support.function",
        regex : "^\\s*```",
        next  : "pop"
      }]);
      
      this.embedRules(SnippetHighlightRules, "snippetcode-", [{
        token : "support.function",
        regex : "^\\s*```",
        next  : "pop"
      }]);
      
      this.embedRules(TextHighlightRules, "textcode-", [{
        token : "support.function",
        regex : "^\\s*```",
        next  : "pop"
      }]);
      
      this.normalizeRules();
    };
    oop.inherits(DnippetsHighlightRules, TextHighlightRules);

    exports.DnippetsHighlightRules = DnippetsHighlightRules;
});
      