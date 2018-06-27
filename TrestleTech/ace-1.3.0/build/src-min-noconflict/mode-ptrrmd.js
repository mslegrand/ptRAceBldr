ace.define("ace/mode/doc_comment_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var DocCommentHighlightRules = function() {
    this.$rules = {
        "start" : [ {
            token : "comment.doc.tag",
            regex : "@[\\w\\d_]+" // TODO: fix email addresses
        }, 
        DocCommentHighlightRules.getTagRule(),
        {
            defaultToken : "comment.doc",
            caseInsensitive: true
        }]
    };
};

oop.inherits(DocCommentHighlightRules, TextHighlightRules);

DocCommentHighlightRules.getTagRule = function(start) {
    return {
        token : "comment.doc.tag.storage.type",
        regex : "\\b(?:TODO|FIXME|XXX|HACK)\\b"
    };
};

DocCommentHighlightRules.getStartRule = function(start) {
    return {
        token : "comment.doc", // doc comment
        regex : "\\/\\*(?=\\*)",
        next  : start
    };
};

DocCommentHighlightRules.getEndRule = function (start) {
    return {
        token : "comment.doc", // closing comment
        regex : "\\*\\/",
        next  : start
    };
};


exports.DocCommentHighlightRules = DocCommentHighlightRules;

});

ace.define("ace/mode/javascript_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/doc_comment_highlight_rules","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var identifierRe = "[a-zA-Z\\$_\u00a1-\uffff][a-zA-Z\\d\\$_\u00a1-\uffff]*";

var JavaScriptHighlightRules = function(options) {
    var keywordMapper = this.createKeywordMapper({
        "variable.language":
            "Array|Boolean|Date|Function|Iterator|Number|Object|RegExp|String|Proxy|"  + // Constructors
            "Namespace|QName|XML|XMLList|"                                             + // E4X
            "ArrayBuffer|Float32Array|Float64Array|Int16Array|Int32Array|Int8Array|"   +
            "Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|"                    +
            "Error|EvalError|InternalError|RangeError|ReferenceError|StopIteration|"   + // Errors
            "SyntaxError|TypeError|URIError|"                                          +
            "decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|" + // Non-constructor functions
            "isNaN|parseFloat|parseInt|"                                               +
            "JSON|Math|"                                                               + // Other
            "this|arguments|prototype|window|document"                                 , // Pseudo
        "keyword":
            "const|yield|import|get|set|async|await|" +
            "break|case|catch|continue|default|delete|do|else|finally|for|function|" +
            "if|in|of|instanceof|new|return|switch|throw|try|typeof|let|var|while|with|debugger|" +
            "__parent__|__count__|escape|unescape|with|__proto__|" +
            "class|enum|extends|super|export|implements|private|public|interface|package|protected|static",
        "storage.type":
            "const|let|var|function",
        "constant.language":
            "null|Infinity|NaN|undefined",
        "support.function":
            "alert",
        "constant.language.boolean": "true|false"
    }, "identifier");
    var kwBeforeRe = "case|do|else|finally|in|instanceof|return|throw|try|typeof|yield|void";

    var escapedRe = "\\\\(?:x[0-9a-fA-F]{2}|" + // hex
        "u[0-9a-fA-F]{4}|" + // unicode
        "u{[0-9a-fA-F]{1,6}}|" + // es6 unicode
        "[0-2][0-7]{0,2}|" + // oct
        "3[0-7][0-7]?|" + // oct
        "[4-7][0-7]?|" + //oct
        ".)";

    this.$rules = {
        "no_regex" : [
            DocCommentHighlightRules.getStartRule("doc-start"),
            comments("no_regex"),
            {
                token : "string",
                regex : "'(?=.)",
                next  : "qstring"
            }, {
                token : "string",
                regex : '"(?=.)',
                next  : "qqstring"
            }, {
                token : "constant.numeric", // hexadecimal, octal and binary
                regex : /0(?:[xX][0-9a-fA-F]+|[oO][0-7]+|[bB][01]+)\b/
            }, {
                token : "constant.numeric", // decimal integers and floats
                regex : /(?:\d\d*(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+\b)?/
            }, {
                token : [
                    "storage.type", "punctuation.operator", "support.function",
                    "punctuation.operator", "entity.name.function", "text","keyword.operator"
                ],
                regex : "(" + identifierRe + ")(\\.)(prototype)(\\.)(" + identifierRe +")(\\s*)(=)",
                next: "function_arguments"
            }, {
                token : [
                    "storage.type", "punctuation.operator", "entity.name.function", "text",
                    "keyword.operator", "text", "storage.type", "text", "paren.lparen"
                ],
                regex : "(" + identifierRe + ")(\\.)(" + identifierRe +")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : [
                    "entity.name.function", "text", "keyword.operator", "text", "storage.type",
                    "text", "paren.lparen"
                ],
                regex : "(" + identifierRe +")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : [
                    "storage.type", "punctuation.operator", "entity.name.function", "text",
                    "keyword.operator", "text",
                    "storage.type", "text", "entity.name.function", "text", "paren.lparen"
                ],
                regex : "(" + identifierRe + ")(\\.)(" + identifierRe +")(\\s*)(=)(\\s*)(function)(\\s+)(\\w+)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : [
                    "storage.type", "text", "entity.name.function", "text", "paren.lparen"
                ],
                regex : "(function)(\\s+)(" + identifierRe + ")(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : [
                    "entity.name.function", "text", "punctuation.operator",
                    "text", "storage.type", "text", "paren.lparen"
                ],
                regex : "(" + identifierRe + ")(\\s*)(:)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : [
                    "text", "text", "storage.type", "text", "paren.lparen"
                ],
                regex : "(:)(\\s*)(function)(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : "keyword",
                regex : "from(?=\\s*('|\"))"
            }, {
                token : "keyword",
                regex : "(?:" + kwBeforeRe + ")\\b",
                next : "start"
            }, {
                token : ["support.constant"],
                regex : /that\b/
            }, {
                token : ["storage.type", "punctuation.operator", "support.function.firebug"],
                regex : /(console)(\.)(warn|info|log|error|time|trace|timeEnd|assert)\b/
            }, {
                token : keywordMapper,
                regex : identifierRe
            }, {
                token : "punctuation.operator",
                regex : /[.](?![.])/,
                next  : "property"
            }, {
                token : "storage.type",
                regex : /=>/
            }, {
                token : "keyword.operator",
                regex : /--|\+\+|\.{3}|===|==|=|!=|!==|<+=?|>+=?|!|&&|\|\||\?:|[!$%&*+\-~\/^]=?/,
                next  : "start"
            }, {
                token : "punctuation.operator",
                regex : /[?:,;.]/,
                next  : "start"
            }, {
                token : "paren.lparen",
                regex : /[\[({]/,
                next  : "start"
            }, {
                token : "paren.rparen",
                regex : /[\])}]/
            }, {
                token: "comment",
                regex: /^#!.*$/
            }
        ],
        property: [{
                token : "text",
                regex : "\\s+"
            }, {
                token : [
                    "storage.type", "punctuation.operator", "entity.name.function", "text",
                    "keyword.operator", "text",
                    "storage.type", "text", "entity.name.function", "text", "paren.lparen"
                ],
                regex : "(" + identifierRe + ")(\\.)(" + identifierRe +")(\\s*)(=)(\\s*)(function)(?:(\\s+)(\\w+))?(\\s*)(\\()",
                next: "function_arguments"
            }, {
                token : "punctuation.operator",
                regex : /[.](?![.])/
            }, {
                token : "support.function",
                regex : /(s(?:h(?:ift|ow(?:Mod(?:elessDialog|alDialog)|Help))|croll(?:X|By(?:Pages|Lines)?|Y|To)?|t(?:op|rike)|i(?:n|zeToContent|debar|gnText)|ort|u(?:p|b(?:str(?:ing)?)?)|pli(?:ce|t)|e(?:nd|t(?:Re(?:sizable|questHeader)|M(?:i(?:nutes|lliseconds)|onth)|Seconds|Ho(?:tKeys|urs)|Year|Cursor|Time(?:out)?|Interval|ZOptions|Date|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Date|FullYear)|FullYear|Active)|arch)|qrt|lice|avePreferences|mall)|h(?:ome|andleEvent)|navigate|c(?:har(?:CodeAt|At)|o(?:s|n(?:cat|textual|firm)|mpile)|eil|lear(?:Timeout|Interval)?|a(?:ptureEvents|ll)|reate(?:StyleSheet|Popup|EventObject))|t(?:o(?:GMTString|S(?:tring|ource)|U(?:TCString|pperCase)|Lo(?:caleString|werCase))|est|a(?:n|int(?:Enabled)?))|i(?:s(?:NaN|Finite)|ndexOf|talics)|d(?:isableExternalCapture|ump|etachEvent)|u(?:n(?:shift|taint|escape|watch)|pdateCommands)|j(?:oin|avaEnabled)|p(?:o(?:p|w)|ush|lugins.refresh|a(?:ddings|rse(?:Int|Float)?)|r(?:int|ompt|eference))|e(?:scape|nableExternalCapture|val|lementFromPoint|x(?:p|ec(?:Script|Command)?))|valueOf|UTC|queryCommand(?:State|Indeterm|Enabled|Value)|f(?:i(?:nd|le(?:ModifiedDate|Size|CreatedDate|UpdatedDate)|xed)|o(?:nt(?:size|color)|rward)|loor|romCharCode)|watch|l(?:ink|o(?:ad|g)|astIndexOf)|a(?:sin|nchor|cos|t(?:tachEvent|ob|an(?:2)?)|pply|lert|b(?:s|ort))|r(?:ou(?:nd|teEvents)|e(?:size(?:By|To)|calc|turnValue|place|verse|l(?:oad|ease(?:Capture|Events)))|andom)|g(?:o|et(?:ResponseHeader|M(?:i(?:nutes|lliseconds)|onth)|Se(?:conds|lection)|Hours|Year|Time(?:zoneOffset)?|Da(?:y|te)|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Da(?:y|te)|FullYear)|FullYear|A(?:ttention|llResponseHeaders)))|m(?:in|ove(?:B(?:y|elow)|To(?:Absolute)?|Above)|ergeAttributes|a(?:tch|rgins|x))|b(?:toa|ig|o(?:ld|rderWidths)|link|ack))\b(?=\()/
            }, {
                token : "support.function.dom",
                regex : /(s(?:ub(?:stringData|mit)|plitText|e(?:t(?:NamedItem|Attribute(?:Node)?)|lect))|has(?:ChildNodes|Feature)|namedItem|c(?:l(?:ick|o(?:se|neNode))|reate(?:C(?:omment|DATASection|aption)|T(?:Head|extNode|Foot)|DocumentFragment|ProcessingInstruction|E(?:ntityReference|lement)|Attribute))|tabIndex|i(?:nsert(?:Row|Before|Cell|Data)|tem)|open|delete(?:Row|C(?:ell|aption)|T(?:Head|Foot)|Data)|focus|write(?:ln)?|a(?:dd|ppend(?:Child|Data))|re(?:set|place(?:Child|Data)|move(?:NamedItem|Child|Attribute(?:Node)?)?)|get(?:NamedItem|Element(?:sBy(?:Name|TagName|ClassName)|ById)|Attribute(?:Node)?)|blur)\b(?=\()/
            }, {
                token :  "support.constant",
                regex : /(s(?:ystemLanguage|cr(?:ipts|ollbars|een(?:X|Y|Top|Left))|t(?:yle(?:Sheets)?|atus(?:Text|bar)?)|ibling(?:Below|Above)|ource|uffixes|e(?:curity(?:Policy)?|l(?:ection|f)))|h(?:istory|ost(?:name)?|as(?:h|Focus))|y|X(?:MLDocument|SLDocument)|n(?:ext|ame(?:space(?:s|URI)|Prop))|M(?:IN_VALUE|AX_VALUE)|c(?:haracterSet|o(?:n(?:structor|trollers)|okieEnabled|lorDepth|mp(?:onents|lete))|urrent|puClass|l(?:i(?:p(?:boardData)?|entInformation)|osed|asses)|alle(?:e|r)|rypto)|t(?:o(?:olbar|p)|ext(?:Transform|Indent|Decoration|Align)|ags)|SQRT(?:1_2|2)|i(?:n(?:ner(?:Height|Width)|put)|ds|gnoreCase)|zIndex|o(?:scpu|n(?:readystatechange|Line)|uter(?:Height|Width)|p(?:sProfile|ener)|ffscreenBuffering)|NEGATIVE_INFINITY|d(?:i(?:splay|alog(?:Height|Top|Width|Left|Arguments)|rectories)|e(?:scription|fault(?:Status|Ch(?:ecked|arset)|View)))|u(?:ser(?:Profile|Language|Agent)|n(?:iqueID|defined)|pdateInterval)|_content|p(?:ixelDepth|ort|ersonalbar|kcs11|l(?:ugins|atform)|a(?:thname|dding(?:Right|Bottom|Top|Left)|rent(?:Window|Layer)?|ge(?:X(?:Offset)?|Y(?:Offset)?))|r(?:o(?:to(?:col|type)|duct(?:Sub)?|mpter)|e(?:vious|fix)))|e(?:n(?:coding|abledPlugin)|x(?:ternal|pando)|mbeds)|v(?:isibility|endor(?:Sub)?|Linkcolor)|URLUnencoded|P(?:I|OSITIVE_INFINITY)|f(?:ilename|o(?:nt(?:Size|Family|Weight)|rmName)|rame(?:s|Element)|gColor)|E|whiteSpace|l(?:i(?:stStyleType|n(?:eHeight|kColor))|o(?:ca(?:tion(?:bar)?|lName)|wsrc)|e(?:ngth|ft(?:Context)?)|a(?:st(?:M(?:odified|atch)|Index|Paren)|yer(?:s|X)|nguage))|a(?:pp(?:MinorVersion|Name|Co(?:deName|re)|Version)|vail(?:Height|Top|Width|Left)|ll|r(?:ity|guments)|Linkcolor|bove)|r(?:ight(?:Context)?|e(?:sponse(?:XML|Text)|adyState))|global|x|m(?:imeTypes|ultiline|enubar|argin(?:Right|Bottom|Top|Left))|L(?:N(?:10|2)|OG(?:10E|2E))|b(?:o(?:ttom|rder(?:Width|RightWidth|BottomWidth|Style|Color|TopWidth|LeftWidth))|ufferDepth|elow|ackground(?:Color|Image)))\b/
            }, {
                token : "identifier",
                regex : identifierRe
            }, {
                regex: "",
                token: "empty",
                next: "no_regex"
            }
        ],
        "start": [
            DocCommentHighlightRules.getStartRule("doc-start"),
            comments("start"),
            {
                token: "string.regexp",
                regex: "\\/",
                next: "regex"
            }, {
                token : "text",
                regex : "\\s+|^$",
                next : "start"
            }, {
                token: "empty",
                regex: "",
                next: "no_regex"
            }
        ],
        "regex": [
            {
                token: "regexp.keyword.operator",
                regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
            }, {
                token: "string.regexp",
                regex: "/[sxngimy]*",
                next: "no_regex"
            }, {
                token : "invalid",
                regex: /\{\d+\b,?\d*\}[+*]|[+*$^?][+*]|[$^][?]|\?{3,}/
            }, {
                token : "constant.language.escape",
                regex: /\(\?[:=!]|\)|\{\d+\b,?\d*\}|[+*]\?|[()$^+*?.]/
            }, {
                token : "constant.language.delimiter",
                regex: /\|/
            }, {
                token: "constant.language.escape",
                regex: /\[\^?/,
                next: "regex_character_class"
            }, {
                token: "empty",
                regex: "$",
                next: "no_regex"
            }, {
                defaultToken: "string.regexp"
            }
        ],
        "regex_character_class": [
            {
                token: "regexp.charclass.keyword.operator",
                regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
            }, {
                token: "constant.language.escape",
                regex: "]",
                next: "regex"
            }, {
                token: "constant.language.escape",
                regex: "-"
            }, {
                token: "empty",
                regex: "$",
                next: "no_regex"
            }, {
                defaultToken: "string.regexp.charachterclass"
            }
        ],
        "function_arguments": [
            {
                token: "variable.parameter",
                regex: identifierRe
            }, {
                token: "punctuation.operator",
                regex: "[, ]+"
            }, {
                token: "punctuation.operator",
                regex: "$"
            }, {
                token: "empty",
                regex: "",
                next: "no_regex"
            }
        ],
        "qqstring" : [
            {
                token : "constant.language.escape",
                regex : escapedRe
            }, {
                token : "string",
                regex : "\\\\$",
                consumeLineEnd  : true
            }, {
                token : "string",
                regex : '"|$',
                next  : "no_regex"
            }, {
                defaultToken: "string"
            }
        ],
        "qstring" : [
            {
                token : "constant.language.escape",
                regex : escapedRe
            }, {
                token : "string",
                regex : "\\\\$",
                consumeLineEnd  : true
            }, {
                token : "string",
                regex : "'|$",
                next  : "no_regex"
            }, {
                defaultToken: "string"
            }
        ]
    };


    if (!options || !options.noES6) {
        this.$rules.no_regex.unshift({
            regex: "[{}]", onMatch: function(val, state, stack) {
                this.next = val == "{" ? this.nextState : "";
                if (val == "{" && stack.length) {
                    stack.unshift("start", state);
                }
                else if (val == "}" && stack.length) {
                    stack.shift();
                    this.next = stack.shift();
                    if (this.next.indexOf("string") != -1 || this.next.indexOf("jsx") != -1)
                        return "paren.quasi.end";
                }
                return val == "{" ? "paren.lparen" : "paren.rparen";
            },
            nextState: "start"
        }, {
            token : "string.quasi.start",
            regex : /`/,
            push  : [{
                token : "constant.language.escape",
                regex : escapedRe
            }, {
                token : "paren.quasi.start",
                regex : /\${/,
                push  : "start"
            }, {
                token : "string.quasi.end",
                regex : /`/,
                next  : "pop"
            }, {
                defaultToken: "string.quasi"
            }]
        });

        if (!options || options.jsx != false)
            JSX.call(this);
    }

    this.embedRules(DocCommentHighlightRules, "doc-",
        [ DocCommentHighlightRules.getEndRule("no_regex") ]);

    this.normalizeRules();
};

oop.inherits(JavaScriptHighlightRules, TextHighlightRules);

function JSX() {
    var tagRegex = identifierRe.replace("\\d", "\\d\\-");
    var jsxTag = {
        onMatch : function(val, state, stack) {
            var offset = val.charAt(1) == "/" ? 2 : 1;
            if (offset == 1) {
                if (state != this.nextState)
                    stack.unshift(this.next, this.nextState, 0);
                else
                    stack.unshift(this.next);
                stack[2]++;
            } else if (offset == 2) {
                if (state == this.nextState) {
                    stack[1]--;
                    if (!stack[1] || stack[1] < 0) {
                        stack.shift();
                        stack.shift();
                    }
                }
            }
            return [{
                type: "meta.tag.punctuation." + (offset == 1 ? "" : "end-") + "tag-open.xml",
                value: val.slice(0, offset)
            }, {
                type: "meta.tag.tag-name.xml",
                value: val.substr(offset)
            }];
        },
        regex : "</?" + tagRegex + "",
        next: "jsxAttributes",
        nextState: "jsx"
    };
    this.$rules.start.unshift(jsxTag);
    var jsxJsRule = {
        regex: "{",
        token: "paren.quasi.start",
        push: "start"
    };
    this.$rules.jsx = [
        jsxJsRule,
        jsxTag,
        {include : "reference"},
        {defaultToken: "string"}
    ];
    this.$rules.jsxAttributes = [{
        token : "meta.tag.punctuation.tag-close.xml",
        regex : "/?>",
        onMatch : function(value, currentState, stack) {
            if (currentState == stack[0])
                stack.shift();
            if (value.length == 2) {
                if (stack[0] == this.nextState)
                    stack[1]--;
                if (!stack[1] || stack[1] < 0) {
                    stack.splice(0, 2);
                }
            }
            this.next = stack[0] || "start";
            return [{type: this.token, value: value}];
        },
        nextState: "jsx"
    },
    jsxJsRule,
    comments("jsxAttributes"),
    {
        token : "entity.other.attribute-name.xml",
        regex : tagRegex
    }, {
        token : "keyword.operator.attribute-equals.xml",
        regex : "="
    }, {
        token : "text.tag-whitespace.xml",
        regex : "\\s+"
    }, {
        token : "string.attribute-value.xml",
        regex : "'",
        stateName : "jsx_attr_q",
        push : [
            {token : "string.attribute-value.xml", regex: "'", next: "pop"},
            {include : "reference"},
            {defaultToken : "string.attribute-value.xml"}
        ]
    }, {
        token : "string.attribute-value.xml",
        regex : '"',
        stateName : "jsx_attr_qq",
        push : [
            {token : "string.attribute-value.xml", regex: '"', next: "pop"},
            {include : "reference"},
            {defaultToken : "string.attribute-value.xml"}
        ]
    },
    jsxTag
    ];
    this.$rules.reference = [{
        token : "constant.language.escape.reference.xml",
        regex : "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
    }];
}

function comments(next) {
    return [
        {
            token : "comment", // multi line comment
            regex : /\/\*/,
            next: [
                DocCommentHighlightRules.getTagRule(),
                {token : "comment", regex : "\\*\\/", next : next || "pop"},
                {defaultToken : "comment", caseInsensitive: true}
            ]
        }, {
            token : "comment",
            regex : "\\/\\/",
            next: [
                DocCommentHighlightRules.getTagRule(),
                {token : "comment", regex : "$|^", next : next || "pop"},
                {defaultToken : "comment", caseInsensitive: true}
            ]
        }
    ];
}
exports.JavaScriptHighlightRules = JavaScriptHighlightRules;
});

ace.define("ace/mode/matching_brace_outdent",["require","exports","module","ace/range"], function(require, exports, module) {
"use strict";

var Range = require("../range").Range;

var MatchingBraceOutdent = function() {};

(function() {

    this.checkOutdent = function(line, input) {
        if (! /^\s+$/.test(line))
            return false;

        return /^\s*\}/.test(input);
    };

    this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);
    };

    this.$getIndent = function(line) {
        return line.match(/^\s*/)[0];
    };

}).call(MatchingBraceOutdent.prototype);

exports.MatchingBraceOutdent = MatchingBraceOutdent;
});

ace.define("ace/mode/folding/cstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function(commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
        );
        this.foldingStopMarker = new RegExp(
            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
        );
    }
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {
    
    this.foldingStartMarker = /([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/;
    this.foldingStopMarker = /^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/;
    this.singleLineBlockCommentRe= /^\s*(\/\*).*\*\/\s*$/;
    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
    this._getFoldWidgetBase = this.getFoldWidget;
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
    
        if (this.singleLineBlockCommentRe.test(line)) {
            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
                return "";
        }
    
        var fw = this._getFoldWidgetBase(session, foldStyle, row);
    
        if (!fw && this.startRegionRe.test(line))
            return "start"; // lineCommentRegionStart
    
        return fw;
    };

    this.getFoldWidgetRange = function(session, foldStyle, row, forceMultiline) {
        var line = session.getLine(row);
        
        if (this.startRegionRe.test(line))
            return this.getCommentRegionBlock(session, line, row);
        
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);
                
            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
            
            if (range && !range.isMultiLine()) {
                if (forceMultiline) {
                    range = this.getSectionRange(session, row);
                } else if (foldStyle != "all")
                    range = null;
            }
            
            return range;
        }

        if (foldStyle === "markbegin")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };
    
    this.getSectionRange = function(session, row) {
        var line = session.getLine(row);
        var startIndent = line.search(/\S/);
        var startRow = row;
        var startColumn = line.length;
        row = row + 1;
        var endRow = row;
        var maxRow = session.getLength();
        while (++row < maxRow) {
            line = session.getLine(row);
            var indent = line.search(/\S/);
            if (indent === -1)
                continue;
            if  (startIndent > indent)
                break;
            var subRange = this.getFoldWidgetRange(session, "all", row);
            
            if (subRange) {
                if (subRange.start.row <= startRow) {
                    break;
                } else if (subRange.isMultiLine()) {
                    row = subRange.end.row;
                } else if (startIndent == indent) {
                    break;
                }
            }
            endRow = row;
        }
        
        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
    };
    this.getCommentRegionBlock = function(session, line, row) {
        var startColumn = line.search(/\s*$/);
        var maxRow = session.getLength();
        var startRow = row;
        
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
        var depth = 1;
        while (++row < maxRow) {
            line = session.getLine(row);
            var m = re.exec(line);
            if (!m) continue;
            if (m[1]) depth--;
            else depth++;

            if (!depth) break;
        }

        var endRow = row;
        if (endRow > startRow) {
            return new Range(startRow, startColumn, endRow, line.length);
        }
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/javascript",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/javascript_highlight_rules","ace/mode/matching_brace_outdent","ace/worker/worker_client","ace/mode/behaviour/cstyle","ace/mode/folding/cstyle"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
var WorkerClient = require("../worker/worker_client").WorkerClient;
var CstyleBehaviour = require("./behaviour/cstyle").CstyleBehaviour;
var CStyleFoldMode = require("./folding/cstyle").FoldMode;

var Mode = function() {
    this.HighlightRules = JavaScriptHighlightRules;
    
    this.$outdent = new MatchingBraceOutdent();
    this.$behaviour = new CstyleBehaviour();
    this.foldingRules = new CStyleFoldMode();
};
oop.inherits(Mode, TextMode);

(function() {

    this.lineCommentStart = "//";
    this.blockComment = {start: "/*", end: "*/"};
    this.$quotes = {'"': '"', "'": "'", "`": "`"};

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        if (state == "start" || state == "no_regex") {
            var match = line.match(/^.*(?:\bcase\b.*:|[\{\(\[])\s*$/);
            if (match) {
                indent += tab;
            }
        } else if (state == "doc-start") {
            if (endState == "start" || endState == "no_regex") {
                return "";
            }
            var match = line.match(/^\s*(\/?)\*/);
            if (match) {
                if (match[1]) {
                    indent += " ";
                }
                indent += "* ";
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };

    this.createWorker = function(session) {
        var worker = new WorkerClient(["ace"], "ace/mode/javascript_worker", "JavaScriptWorker");
        worker.attachToDocument(session.getDocument());

        worker.on("annotate", function(results) {
            session.setAnnotations(results.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };

    this.$id = "ace/mode/javascript";
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define("ace/mode/xml_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var XmlHighlightRules = function(normalize) {
    var tagRegex = "[_:a-zA-Z\xc0-\uffff][-_:.a-zA-Z0-9\xc0-\uffff]*";

    this.$rules = {
        start : [
            {token : "string.cdata.xml", regex : "<\\!\\[CDATA\\[", next : "cdata"},
            {
                token : ["punctuation.instruction.xml", "keyword.instruction.xml"],
                regex : "(<\\?)(" + tagRegex + ")", next : "processing_instruction"
            },
            {token : "comment.start.xml", regex : "<\\!--", next : "comment"},
            {
                token : ["xml-pe.doctype.xml", "xml-pe.doctype.xml"],
                regex : "(<\\!)(DOCTYPE)(?=[\\s])", next : "doctype", caseInsensitive: true
            },
            {include : "tag"},
            {token : "text.end-tag-open.xml", regex: "</"},
            {token : "text.tag-open.xml", regex: "<"},
            {include : "reference"},
            {defaultToken : "text.xml"}
        ],

        processing_instruction : [{
            token : "entity.other.attribute-name.decl-attribute-name.xml",
            regex : tagRegex
        }, {
            token : "keyword.operator.decl-attribute-equals.xml",
            regex : "="
        }, {
            include: "whitespace"
        }, {
            include: "string"
        }, {
            token : "punctuation.xml-decl.xml",
            regex : "\\?>",
            next : "start"
        }],

        doctype : [
            {include : "whitespace"},
            {include : "string"},
            {token : "xml-pe.doctype.xml", regex : ">", next : "start"},
            {token : "xml-pe.xml", regex : "[-_a-zA-Z0-9:]+"},
            {token : "punctuation.int-subset", regex : "\\[", push : "int_subset"}
        ],

        int_subset : [{
            token : "text.xml",
            regex : "\\s+"
        }, {
            token: "punctuation.int-subset.xml",
            regex: "]",
            next: "pop"
        }, {
            token : ["punctuation.markup-decl.xml", "keyword.markup-decl.xml"],
            regex : "(<\\!)(" + tagRegex + ")",
            push : [{
                token : "text",
                regex : "\\s+"
            },
            {
                token : "punctuation.markup-decl.xml",
                regex : ">",
                next : "pop"
            },
            {include : "string"}]
        }],

        cdata : [
            {token : "string.cdata.xml", regex : "\\]\\]>", next : "start"},
            {token : "text.xml", regex : "\\s+"},
            {token : "text.xml", regex : "(?:[^\\]]|\\](?!\\]>))+"}
        ],

        comment : [
            {token : "comment.end.xml", regex : "-->", next : "start"},
            {defaultToken : "comment.xml"}
        ],

        reference : [{
            token : "constant.language.escape.reference.xml",
            regex : "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
        }],

        attr_reference : [{
            token : "constant.language.escape.reference.attribute-value.xml",
            regex : "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
        }],

        tag : [{
            token : ["meta.tag.punctuation.tag-open.xml", "meta.tag.punctuation.end-tag-open.xml", "meta.tag.tag-name.xml"],
            regex : "(?:(<)|(</))((?:" + tagRegex + ":)?" + tagRegex + ")",
            next: [
                {include : "attributes"},
                {token : "meta.tag.punctuation.tag-close.xml", regex : "/?>", next : "start"}
            ]
        }],

        tag_whitespace : [
            {token : "text.tag-whitespace.xml", regex : "\\s+"}
        ],
        whitespace : [
            {token : "text.whitespace.xml", regex : "\\s+"}
        ],
        string: [{
            token : "string.xml",
            regex : "'",
            push : [
                {token : "string.xml", regex: "'", next: "pop"},
                {defaultToken : "string.xml"}
            ]
        }, {
            token : "string.xml",
            regex : '"',
            push : [
                {token : "string.xml", regex: '"', next: "pop"},
                {defaultToken : "string.xml"}
            ]
        }],

        attributes: [{
            token : "entity.other.attribute-name.xml",
            regex : tagRegex
        }, {
            token : "keyword.operator.attribute-equals.xml",
            regex : "="
        }, {
            include: "tag_whitespace"
        }, {
            include: "attribute_value"
        }],

        attribute_value: [{
            token : "string.attribute-value.xml",
            regex : "'",
            push : [
                {token : "string.attribute-value.xml", regex: "'", next: "pop"},
                {include : "attr_reference"},
                {defaultToken : "string.attribute-value.xml"}
            ]
        }, {
            token : "string.attribute-value.xml",
            regex : '"',
            push : [
                {token : "string.attribute-value.xml", regex: '"', next: "pop"},
                {include : "attr_reference"},
                {defaultToken : "string.attribute-value.xml"}
            ]
        }]
    };

    if (this.constructor === XmlHighlightRules)
        this.normalizeRules();
};


(function() {

    this.embedTagRules = function(HighlightRules, prefix, tag){
        this.$rules.tag.unshift({
            token : ["meta.tag.punctuation.tag-open.xml", "meta.tag." + tag + ".tag-name.xml"],
            regex : "(<)(" + tag + "(?=\\s|>|$))",
            next: [
                {include : "attributes"},
                {token : "meta.tag.punctuation.tag-close.xml", regex : "/?>", next : prefix + "start"}
            ]
        });

        this.$rules[tag + "-end"] = [
            {include : "attributes"},
            {token : "meta.tag.punctuation.tag-close.xml", regex : "/?>",  next: "start",
                onMatch : function(value, currentState, stack) {
                    stack.splice(0);
                    return this.token;
            }}
        ];

        this.embedRules(HighlightRules, prefix, [{
            token: ["meta.tag.punctuation.end-tag-open.xml", "meta.tag." + tag + ".tag-name.xml"],
            regex : "(</)(" + tag + "(?=\\s|>|$))",
            next: tag + "-end"
        }, {
            token: "string.cdata.xml",
            regex : "<\\!\\[CDATA\\["
        }, {
            token: "string.cdata.xml",
            regex : "\\]\\]>"
        }]);
    };

}).call(TextHighlightRules.prototype);

oop.inherits(XmlHighlightRules, TextHighlightRules);

exports.XmlHighlightRules = XmlHighlightRules;
});

ace.define("ace/mode/behaviour/xml",["require","exports","module","ace/lib/oop","ace/mode/behaviour","ace/token_iterator","ace/lib/lang"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Behaviour = require("../behaviour").Behaviour;
var TokenIterator = require("../../token_iterator").TokenIterator;
var lang = require("../../lib/lang");

function is(token, type) {
    return token.type.lastIndexOf(type + ".xml") > -1;
}

var XmlBehaviour = function () {

    this.add("string_dquotes", "insertion", function (state, action, editor, session, text) {
        if (text == '"' || text == "'") {
            var quote = text;
            var selected = session.doc.getTextRange(editor.getSelectionRange());
            if (selected !== "" && selected !== "'" && selected != '"' && editor.getWrapBehavioursEnabled()) {
                return {
                    text: quote + selected + quote,
                    selection: false
                };
            }

            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            var iterator = new TokenIterator(session, cursor.row, cursor.column);
            var token = iterator.getCurrentToken();

            if (rightChar == quote && (is(token, "attribute-value") || is(token, "string"))) {
                return {
                    text: "",
                    selection: [1, 1]
                };
            }

            if (!token)
                token = iterator.stepBackward();

            if (!token)
                return;

            while (is(token, "tag-whitespace") || is(token, "whitespace")) {
                token = iterator.stepBackward();
            }
            var rightSpace = !rightChar || rightChar.match(/\s/);
            if (is(token, "attribute-equals") && (rightSpace || rightChar == '>') || (is(token, "decl-attribute-equals") && (rightSpace || rightChar == '?'))) {
                return {
                    text: quote + quote,
                    selection: [1, 1]
                };
            }
        }
    });

    this.add("string_dquotes", "deletion", function(state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
            if (rightChar == selected) {
                range.end.column++;
                return range;
            }
        }
    });

    this.add("autoclosing", "insertion", function (state, action, editor, session, text) {
        if (text == '>') {
            var position = editor.getSelectionRange().start;
            var iterator = new TokenIterator(session, position.row, position.column);
            var token = iterator.getCurrentToken() || iterator.stepBackward();
            if (!token || !(is(token, "tag-name") || is(token, "tag-whitespace") || is(token, "attribute-name") || is(token, "attribute-equals") || is(token, "attribute-value")))
                return;
            if (is(token, "reference.attribute-value"))
                return;
            if (is(token, "attribute-value")) {
                var tokenEndColumn = iterator.getCurrentTokenColumn() + token.value.length;
                if (position.column < tokenEndColumn)
                    return;
                if (position.column == tokenEndColumn) {
                    if (is(iterator.stepForward(), "attribute-value"))
                        return;
                    iterator.stepBackward();
                }
            }
            
            if (/^\s*>/.test(session.getLine(position.row).slice(position.column)))
                return;
            while (!is(token, "tag-name")) {
                token = iterator.stepBackward();
                if (token.value == "<") {
                    token = iterator.stepForward();
                    break;
                }
            }

            var tokenRow = iterator.getCurrentTokenRow();
            var tokenColumn = iterator.getCurrentTokenColumn();
            if (is(iterator.stepBackward(), "end-tag-open"))
                return;

            var element = token.value;
            if (tokenRow == position.row)
                element = element.substring(0, position.column - tokenColumn);

            if (this.voidElements.hasOwnProperty(element.toLowerCase()))
                 return;

            return {
               text: ">" + "</" + element + ">",
               selection: [1, 1]
            };
        }
    });

    this.add("autoindent", "insertion", function (state, action, editor, session, text) {
        if (text == "\n") {
            var cursor = editor.getCursorPosition();
            var line = session.getLine(cursor.row);
            var iterator = new TokenIterator(session, cursor.row, cursor.column);
            var token = iterator.getCurrentToken();

            if (token && token.type.indexOf("tag-close") !== -1) {
                if (token.value == "/>")
                    return;
                while (token && token.type.indexOf("tag-name") === -1) {
                    token = iterator.stepBackward();
                }

                if (!token) {
                    return;
                }

                var tag = token.value;
                var row = iterator.getCurrentTokenRow();
                token = iterator.stepBackward();
                if (!token || token.type.indexOf("end-tag") !== -1) {
                    return;
                }

                if (this.voidElements && !this.voidElements[tag]) {
                    var nextToken = session.getTokenAt(cursor.row, cursor.column+1);
                    var line = session.getLine(row);
                    var nextIndent = this.$getIndent(line);
                    var indent = nextIndent + session.getTabString();

                    if (nextToken && nextToken.value === "</") {
                        return {
                            text: "\n" + indent + "\n" + nextIndent,
                            selection: [1, indent.length, 1, indent.length]
                        };
                    } else {
                        return {
                            text: "\n" + indent
                        };
                    }
                }
            }
        }
    });

};

oop.inherits(XmlBehaviour, Behaviour);

exports.XmlBehaviour = XmlBehaviour;
});

ace.define("ace/mode/folding/xml",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/range","ace/mode/folding/fold_mode","ace/token_iterator"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var lang = require("../../lib/lang");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;
var TokenIterator = require("../../token_iterator").TokenIterator;

var FoldMode = exports.FoldMode = function(voidElements, optionalEndTags) {
    BaseFoldMode.call(this);
    this.voidElements = voidElements || {};
    this.optionalEndTags = oop.mixin({}, this.voidElements);
    if (optionalEndTags)
        oop.mixin(this.optionalEndTags, optionalEndTags);
    
};
oop.inherits(FoldMode, BaseFoldMode);

var Tag = function() {
    this.tagName = "";
    this.closing = false;
    this.selfClosing = false;
    this.start = {row: 0, column: 0};
    this.end = {row: 0, column: 0};
};

function is(token, type) {
    return token.type.lastIndexOf(type + ".xml") > -1;
}

(function() {

    this.getFoldWidget = function(session, foldStyle, row) {
        var tag = this._getFirstTagInLine(session, row);

        if (!tag)
            return this.getCommentFoldWidget(session, row);

        if (tag.closing || (!tag.tagName && tag.selfClosing))
            return foldStyle == "markbeginend" ? "end" : "";

        if (!tag.tagName || tag.selfClosing || this.voidElements.hasOwnProperty(tag.tagName.toLowerCase()))
            return "";

        if (this._findEndTagInLine(session, row, tag.tagName, tag.end.column))
            return "";

        return "start";
    };
    
    this.getCommentFoldWidget = function(session, row) {
        if (/comment/.test(session.getState(row)) && /<!-/.test(session.getLine(row)))
            return "start";
        return "";
    };
    this._getFirstTagInLine = function(session, row) {
        var tokens = session.getTokens(row);
        var tag = new Tag();

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (is(token, "tag-open")) {
                tag.end.column = tag.start.column + token.value.length;
                tag.closing = is(token, "end-tag-open");
                token = tokens[++i];
                if (!token)
                    return null;
                tag.tagName = token.value;
                tag.end.column += token.value.length;
                for (i++; i < tokens.length; i++) {
                    token = tokens[i];
                    tag.end.column += token.value.length;
                    if (is(token, "tag-close")) {
                        tag.selfClosing = token.value == '/>';
                        break;
                    }
                }
                return tag;
            } else if (is(token, "tag-close")) {
                tag.selfClosing = token.value == '/>';
                return tag;
            }
            tag.start.column += token.value.length;
        }

        return null;
    };

    this._findEndTagInLine = function(session, row, tagName, startColumn) {
        var tokens = session.getTokens(row);
        var column = 0;
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            column += token.value.length;
            if (column < startColumn)
                continue;
            if (is(token, "end-tag-open")) {
                token = tokens[i + 1];
                if (token && token.value == tagName)
                    return true;
            }
        }
        return false;
    };
    this._readTagForward = function(iterator) {
        var token = iterator.getCurrentToken();
        if (!token)
            return null;

        var tag = new Tag();
        do {
            if (is(token, "tag-open")) {
                tag.closing = is(token, "end-tag-open");
                tag.start.row = iterator.getCurrentTokenRow();
                tag.start.column = iterator.getCurrentTokenColumn();
            } else if (is(token, "tag-name")) {
                tag.tagName = token.value;
            } else if (is(token, "tag-close")) {
                tag.selfClosing = token.value == "/>";
                tag.end.row = iterator.getCurrentTokenRow();
                tag.end.column = iterator.getCurrentTokenColumn() + token.value.length;
                iterator.stepForward();
                return tag;
            }
        } while(token = iterator.stepForward());

        return null;
    };
    
    this._readTagBackward = function(iterator) {
        var token = iterator.getCurrentToken();
        if (!token)
            return null;

        var tag = new Tag();
        do {
            if (is(token, "tag-open")) {
                tag.closing = is(token, "end-tag-open");
                tag.start.row = iterator.getCurrentTokenRow();
                tag.start.column = iterator.getCurrentTokenColumn();
                iterator.stepBackward();
                return tag;
            } else if (is(token, "tag-name")) {
                tag.tagName = token.value;
            } else if (is(token, "tag-close")) {
                tag.selfClosing = token.value == "/>";
                tag.end.row = iterator.getCurrentTokenRow();
                tag.end.column = iterator.getCurrentTokenColumn() + token.value.length;
            }
        } while(token = iterator.stepBackward());

        return null;
    };
    
    this._pop = function(stack, tag) {
        while (stack.length) {
            
            var top = stack[stack.length-1];
            if (!tag || top.tagName == tag.tagName) {
                return stack.pop();
            }
            else if (this.optionalEndTags.hasOwnProperty(top.tagName)) {
                stack.pop();
                continue;
            } else {
                return null;
            }
        }
    };
    
    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var firstTag = this._getFirstTagInLine(session, row);
        
        if (!firstTag) {
            return this.getCommentFoldWidget(session, row)
                && session.getCommentFoldRange(row, session.getLine(row).length);
        }
        
        var isBackward = firstTag.closing || firstTag.selfClosing;
        var stack = [];
        var tag;
        
        if (!isBackward) {
            var iterator = new TokenIterator(session, row, firstTag.start.column);
            var start = {
                row: row,
                column: firstTag.start.column + firstTag.tagName.length + 2
            };
            if (firstTag.start.row == firstTag.end.row)
                start.column = firstTag.end.column;
            while (tag = this._readTagForward(iterator)) {
                if (tag.selfClosing) {
                    if (!stack.length) {
                        tag.start.column += tag.tagName.length + 2;
                        tag.end.column -= 2;
                        return Range.fromPoints(tag.start, tag.end);
                    } else
                        continue;
                }
                
                if (tag.closing) {
                    this._pop(stack, tag);
                    if (stack.length == 0)
                        return Range.fromPoints(start, tag.start);
                }
                else {
                    stack.push(tag);
                }
            }
        }
        else {
            var iterator = new TokenIterator(session, row, firstTag.end.column);
            var end = {
                row: row,
                column: firstTag.start.column
            };
            
            while (tag = this._readTagBackward(iterator)) {
                if (tag.selfClosing) {
                    if (!stack.length) {
                        tag.start.column += tag.tagName.length + 2;
                        tag.end.column -= 2;
                        return Range.fromPoints(tag.start, tag.end);
                    } else
                        continue;
                }
                
                if (!tag.closing) {
                    this._pop(stack, tag);
                    if (stack.length == 0) {
                        tag.start.column += tag.tagName.length + 2;
                        if (tag.start.row == tag.end.row && tag.start.column < tag.end.column)
                            tag.start.column = tag.end.column;
                        return Range.fromPoints(tag.start, end);
                    }
                }
                else {
                    stack.push(tag);
                }
            }
        }
        
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/xml",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text","ace/mode/xml_highlight_rules","ace/mode/behaviour/xml","ace/mode/folding/xml","ace/worker/worker_client"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var TextMode = require("./text").Mode;
var XmlHighlightRules = require("./xml_highlight_rules").XmlHighlightRules;
var XmlBehaviour = require("./behaviour/xml").XmlBehaviour;
var XmlFoldMode = require("./folding/xml").FoldMode;
var WorkerClient = require("../worker/worker_client").WorkerClient;

var Mode = function() {
   this.HighlightRules = XmlHighlightRules;
   this.$behaviour = new XmlBehaviour();
   this.foldingRules = new XmlFoldMode();
};

oop.inherits(Mode, TextMode);

(function() {

    this.voidElements = lang.arrayToMap([]);

    this.blockComment = {start: "<!--", end: "-->"};

    this.createWorker = function(session) {
        var worker = new WorkerClient(["ace"], "ace/mode/xml_worker", "Worker");
        worker.attachToDocument(session.getDocument());

        worker.on("error", function(e) {
            session.setAnnotations(e.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };
    
    this.$id = "ace/mode/xml";
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define("ace/mode/css_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var supportType = exports.supportType = "align-content|align-items|align-self|all|animation|animation-delay|animation-direction|animation-duration|animation-fill-mode|animation-iteration-count|animation-name|animation-play-state|animation-timing-function|backface-visibility|background|background-attachment|background-blend-mode|background-clip|background-color|background-image|background-origin|background-position|background-repeat|background-size|border|border-bottom|border-bottom-color|border-bottom-left-radius|border-bottom-right-radius|border-bottom-style|border-bottom-width|border-collapse|border-color|border-image|border-image-outset|border-image-repeat|border-image-slice|border-image-source|border-image-width|border-left|border-left-color|border-left-style|border-left-width|border-radius|border-right|border-right-color|border-right-style|border-right-width|border-spacing|border-style|border-top|border-top-color|border-top-left-radius|border-top-right-radius|border-top-style|border-top-width|border-width|bottom|box-shadow|box-sizing|caption-side|clear|clip|color|column-count|column-fill|column-gap|column-rule|column-rule-color|column-rule-style|column-rule-width|column-span|column-width|columns|content|counter-increment|counter-reset|cursor|direction|display|empty-cells|filter|flex|flex-basis|flex-direction|flex-flow|flex-grow|flex-shrink|flex-wrap|float|font|font-family|font-size|font-size-adjust|font-stretch|font-style|font-variant|font-weight|hanging-punctuation|height|justify-content|left|letter-spacing|line-height|list-style|list-style-image|list-style-position|list-style-type|margin|margin-bottom|margin-left|margin-right|margin-top|max-height|max-width|max-zoom|min-height|min-width|min-zoom|nav-down|nav-index|nav-left|nav-right|nav-up|opacity|order|outline|outline-color|outline-offset|outline-style|outline-width|overflow|overflow-x|overflow-y|padding|padding-bottom|padding-left|padding-right|padding-top|page-break-after|page-break-before|page-break-inside|perspective|perspective-origin|position|quotes|resize|right|tab-size|table-layout|text-align|text-align-last|text-decoration|text-decoration-color|text-decoration-line|text-decoration-style|text-indent|text-justify|text-overflow|text-shadow|text-transform|top|transform|transform-origin|transform-style|transition|transition-delay|transition-duration|transition-property|transition-timing-function|unicode-bidi|user-select|user-zoom|vertical-align|visibility|white-space|width|word-break|word-spacing|word-wrap|z-index";
var supportFunction = exports.supportFunction = "rgb|rgba|url|attr|counter|counters";
var supportConstant = exports.supportConstant = "absolute|after-edge|after|all-scroll|all|alphabetic|always|antialiased|armenian|auto|avoid-column|avoid-page|avoid|balance|baseline|before-edge|before|below|bidi-override|block-line-height|block|bold|bolder|border-box|both|bottom|box|break-all|break-word|capitalize|caps-height|caption|center|central|char|circle|cjk-ideographic|clone|close-quote|col-resize|collapse|column|consider-shifts|contain|content-box|cover|crosshair|cubic-bezier|dashed|decimal-leading-zero|decimal|default|disabled|disc|disregard-shifts|distribute-all-lines|distribute-letter|distribute-space|distribute|dotted|double|e-resize|ease-in|ease-in-out|ease-out|ease|ellipsis|end|exclude-ruby|fill|fixed|georgian|glyphs|grid-height|groove|hand|hanging|hebrew|help|hidden|hiragana-iroha|hiragana|horizontal|icon|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space|ideographic|inactive|include-ruby|inherit|initial|inline-block|inline-box|inline-line-height|inline-table|inline|inset|inside|inter-ideograph|inter-word|invert|italic|justify|katakana-iroha|katakana|keep-all|last|left|lighter|line-edge|line-through|line|linear|list-item|local|loose|lower-alpha|lower-greek|lower-latin|lower-roman|lowercase|lr-tb|ltr|mathematical|max-height|max-size|medium|menu|message-box|middle|move|n-resize|ne-resize|newspaper|no-change|no-close-quote|no-drop|no-open-quote|no-repeat|none|normal|not-allowed|nowrap|nw-resize|oblique|open-quote|outset|outside|overline|padding-box|page|pointer|pre-line|pre-wrap|pre|preserve-3d|progress|relative|repeat-x|repeat-y|repeat|replaced|reset-size|ridge|right|round|row-resize|rtl|s-resize|scroll|se-resize|separate|slice|small-caps|small-caption|solid|space|square|start|static|status-bar|step-end|step-start|steps|stretch|strict|sub|super|sw-resize|table-caption|table-cell|table-column-group|table-column|table-footer-group|table-header-group|table-row-group|table-row|table|tb-rl|text-after-edge|text-before-edge|text-bottom|text-size|text-top|text|thick|thin|transparent|underline|upper-alpha|upper-latin|upper-roman|uppercase|use-script|vertical-ideographic|vertical-text|visible|w-resize|wait|whitespace|z-index|zero|zoom";
var supportConstantColor = exports.supportConstantColor = "aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen";
var supportConstantFonts = exports.supportConstantFonts = "arial|century|comic|courier|cursive|fantasy|garamond|georgia|helvetica|impact|lucida|symbol|system|tahoma|times|trebuchet|utopia|verdana|webdings|sans-serif|serif|monospace";

var numRe = exports.numRe = "\\-?(?:(?:[0-9]+(?:\\.[0-9]+)?)|(?:\\.[0-9]+))";
var pseudoElements = exports.pseudoElements = "(\\:+)\\b(after|before|first-letter|first-line|moz-selection|selection)\\b";
var pseudoClasses  = exports.pseudoClasses =  "(:)\\b(active|checked|disabled|empty|enabled|first-child|first-of-type|focus|hover|indeterminate|invalid|last-child|last-of-type|link|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|required|root|target|valid|visited)\\b";

var CssHighlightRules = function() {

    var keywordMapper = this.createKeywordMapper({
        "support.function": supportFunction,
        "support.constant": supportConstant,
        "support.type": supportType,
        "support.constant.color": supportConstantColor,
        "support.constant.fonts": supportConstantFonts
    }, "text", true);

    this.$rules = {
        "start" : [{
            include : ["strings", "url", "comments"]
        }, {
            token: "paren.lparen",
            regex: "\\{",
            next:  "ruleset"
        }, {
            token: "paren.rparen",
            regex: "\\}"
        }, {
            token: "string",
            regex: "@(?!viewport)",
            next:  "media"
        }, {
            token: "keyword",
            regex: "#[a-z0-9-_]+"
        }, {
            token: "keyword",
            regex: "%"
        }, {
            token: "variable",
            regex: "\\.[a-z0-9-_]+"
        }, {
            token: "string",
            regex: ":[a-z0-9-_]+"
        }, {
            token : "constant.numeric",
            regex : numRe
        }, {
            token: "constant",
            regex: "[a-z0-9-_]+"
        }, {
            caseInsensitive: true
        }],
        
        "media": [{
            include : ["strings", "url", "comments"]
        }, {
            token: "paren.lparen",
            regex: "\\{",
            next:  "start"
        }, {
            token: "paren.rparen",
            regex: "\\}",
            next:  "start"
        }, {
            token: "string",
            regex: ";",
            next:  "start"
        }, {
            token: "keyword",
            regex: "(?:media|supports|document|charset|import|namespace|media|supports|document"
                + "|page|font|keyframes|viewport|counter-style|font-feature-values"
                + "|swash|ornaments|annotation|stylistic|styleset|character-variant)"
        }],

        "comments" : [{
            token: "comment", // multi line comment
            regex: "\\/\\*",
            push: [{
                token : "comment",
                regex : "\\*\\/",
                next : "pop"
            }, {
                defaultToken : "comment"
            }]
        }],

        "ruleset" : [{
            regex : "-(webkit|ms|moz|o)-",
            token : "text"
        }, {
            token : "paren.rparen",
            regex : "\\}",
            next : "start"
        }, {
            include : ["strings", "url", "comments"]
        }, {
            token : ["constant.numeric", "keyword"],
            regex : "(" + numRe + ")(ch|cm|deg|em|ex|fr|gd|grad|Hz|in|kHz|mm|ms|pc|pt|px|rad|rem|s|turn|vh|vmax|vmin|vm|vw|%)"
        }, {
            token : "constant.numeric",
            regex : numRe
        }, {
            token : "constant.numeric",  // hex6 color
            regex : "#[a-f0-9]{6}"
        }, {
            token : "constant.numeric", // hex3 color
            regex : "#[a-f0-9]{3}"
        }, {
            token : ["punctuation", "entity.other.attribute-name.pseudo-element.css"],
            regex : pseudoElements
        }, {
            token : ["punctuation", "entity.other.attribute-name.pseudo-class.css"],
            regex : pseudoClasses
        }, {
            include: "url"
        }, {
            token : keywordMapper,
            regex : "\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*"
        }, {
            caseInsensitive: true
        }],
        
        url: [{
            token : "support.function",
            regex : "(?:url(:?-prefix)?|domain|regexp)\\(",
            push: [{
                token : "support.function",
                regex : "\\)",
                next : "pop"
            }, {
                defaultToken: "string"
            }]
        }],
        
        strings: [{
            token : "string.start",
            regex : "'",
            push : [{
                token : "string.end",
                regex : "'|$",
                next: "pop"
            }, {
                include : "escapes"
            }, {
                token : "constant.language.escape",
                regex : /\\$/,
                consumeLineEnd: true
            }, {
                defaultToken: "string"
            }]
        }, {
            token : "string.start",
            regex : '"',
            push : [{
                token : "string.end",
                regex : '"|$',
                next: "pop"
            }, {
                include : "escapes"
            }, {
                token : "constant.language.escape",
                regex : /\\$/,
                consumeLineEnd: true
            }, {
                defaultToken: "string"
            }]
        }],
        escapes: [{
            token : "constant.language.escape",
            regex : /\\([a-fA-F\d]{1,6}|[^a-fA-F\d])/
        }]
        
    };

    this.normalizeRules();
};

oop.inherits(CssHighlightRules, TextHighlightRules);

exports.CssHighlightRules = CssHighlightRules;

});

ace.define("ace/mode/css_completions",["require","exports","module"], function(require, exports, module) {
"use strict";

var propertyMap = {
    "background": {"#$0": 1},
    "background-color": {"#$0": 1, "transparent": 1, "fixed": 1},
    "background-image": {"url('/$0')": 1},
    "background-repeat": {"repeat": 1, "repeat-x": 1, "repeat-y": 1, "no-repeat": 1, "inherit": 1},
    "background-position": {"bottom":2, "center":2, "left":2, "right":2, "top":2, "inherit":2},
    "background-attachment": {"scroll": 1, "fixed": 1},
    "background-size": {"cover": 1, "contain": 1},
    "background-clip": {"border-box": 1, "padding-box": 1, "content-box": 1},
    "background-origin": {"border-box": 1, "padding-box": 1, "content-box": 1},
    "border": {"solid $0": 1, "dashed $0": 1, "dotted $0": 1, "#$0": 1},
    "border-color": {"#$0": 1},
    "border-style": {"solid":2, "dashed":2, "dotted":2, "double":2, "groove":2, "hidden":2, "inherit":2, "inset":2, "none":2, "outset":2, "ridged":2},
    "border-collapse": {"collapse": 1, "separate": 1},
    "bottom": {"px": 1, "em": 1, "%": 1},
    "clear": {"left": 1, "right": 1, "both": 1, "none": 1},
    "color": {"#$0": 1, "rgb(#$00,0,0)": 1},
    "cursor": {"default": 1, "pointer": 1, "move": 1, "text": 1, "wait": 1, "help": 1, "progress": 1, "n-resize": 1, "ne-resize": 1, "e-resize": 1, "se-resize": 1, "s-resize": 1, "sw-resize": 1, "w-resize": 1, "nw-resize": 1},
    "display": {"none": 1, "block": 1, "inline": 1, "inline-block": 1, "table-cell": 1},
    "empty-cells": {"show": 1, "hide": 1},
    "float": {"left": 1, "right": 1, "none": 1},
    "font-family": {"Arial":2,"Comic Sans MS":2,"Consolas":2,"Courier New":2,"Courier":2,"Georgia":2,"Monospace":2,"Sans-Serif":2, "Segoe UI":2,"Tahoma":2,"Times New Roman":2,"Trebuchet MS":2,"Verdana": 1},
    "font-size": {"px": 1, "em": 1, "%": 1},
    "font-weight": {"bold": 1, "normal": 1},
    "font-style": {"italic": 1, "normal": 1},
    "font-variant": {"normal": 1, "small-caps": 1},
    "height": {"px": 1, "em": 1, "%": 1},
    "left": {"px": 1, "em": 1, "%": 1},
    "letter-spacing": {"normal": 1},
    "line-height": {"normal": 1},
    "list-style-type": {"none": 1, "disc": 1, "circle": 1, "square": 1, "decimal": 1, "decimal-leading-zero": 1, "lower-roman": 1, "upper-roman": 1, "lower-greek": 1, "lower-latin": 1, "upper-latin": 1, "georgian": 1, "lower-alpha": 1, "upper-alpha": 1},
    "margin": {"px": 1, "em": 1, "%": 1},
    "margin-right": {"px": 1, "em": 1, "%": 1},
    "margin-left": {"px": 1, "em": 1, "%": 1},
    "margin-top": {"px": 1, "em": 1, "%": 1},
    "margin-bottom": {"px": 1, "em": 1, "%": 1},
    "max-height": {"px": 1, "em": 1, "%": 1},
    "max-width": {"px": 1, "em": 1, "%": 1},
    "min-height": {"px": 1, "em": 1, "%": 1},
    "min-width": {"px": 1, "em": 1, "%": 1},
    "overflow": {"hidden": 1, "visible": 1, "auto": 1, "scroll": 1},
    "overflow-x": {"hidden": 1, "visible": 1, "auto": 1, "scroll": 1},
    "overflow-y": {"hidden": 1, "visible": 1, "auto": 1, "scroll": 1},
    "padding": {"px": 1, "em": 1, "%": 1},
    "padding-top": {"px": 1, "em": 1, "%": 1},
    "padding-right": {"px": 1, "em": 1, "%": 1},
    "padding-bottom": {"px": 1, "em": 1, "%": 1},
    "padding-left": {"px": 1, "em": 1, "%": 1},
    "page-break-after": {"auto": 1, "always": 1, "avoid": 1, "left": 1, "right": 1},
    "page-break-before": {"auto": 1, "always": 1, "avoid": 1, "left": 1, "right": 1},
    "position": {"absolute": 1, "relative": 1, "fixed": 1, "static": 1},
    "right": {"px": 1, "em": 1, "%": 1},
    "table-layout": {"fixed": 1, "auto": 1},
    "text-decoration": {"none": 1, "underline": 1, "line-through": 1, "blink": 1},
    "text-align": {"left": 1, "right": 1, "center": 1, "justify": 1},
    "text-transform": {"capitalize": 1, "uppercase": 1, "lowercase": 1, "none": 1},
    "top": {"px": 1, "em": 1, "%": 1},
    "vertical-align": {"top": 1, "bottom": 1},
    "visibility": {"hidden": 1, "visible": 1},
    "white-space": {"nowrap": 1, "normal": 1, "pre": 1, "pre-line": 1, "pre-wrap": 1},
    "width": {"px": 1, "em": 1, "%": 1},
    "word-spacing": {"normal": 1},
    "filter": {"alpha(opacity=$0100)": 1},

    "text-shadow": {"$02px 2px 2px #777": 1},
    "text-overflow": {"ellipsis-word": 1, "clip": 1, "ellipsis": 1},
    "-moz-border-radius": 1,
    "-moz-border-radius-topright": 1,
    "-moz-border-radius-bottomright": 1,
    "-moz-border-radius-topleft": 1,
    "-moz-border-radius-bottomleft": 1,
    "-webkit-border-radius": 1,
    "-webkit-border-top-right-radius": 1,
    "-webkit-border-top-left-radius": 1,
    "-webkit-border-bottom-right-radius": 1,
    "-webkit-border-bottom-left-radius": 1,
    "-moz-box-shadow": 1,
    "-webkit-box-shadow": 1,
    "transform": {"rotate($00deg)": 1, "skew($00deg)": 1},
    "-moz-transform": {"rotate($00deg)": 1, "skew($00deg)": 1},
    "-webkit-transform": {"rotate($00deg)": 1, "skew($00deg)": 1 }
};

var CssCompletions = function() {

};

(function() {

    this.completionsDefined = false;

    this.defineCompletions = function() {
        if (document) {
            var style = document.createElement('c').style;

            for (var i in style) {
                if (typeof style[i] !== 'string')
                    continue;

                var name = i.replace(/[A-Z]/g, function(x) {
                    return '-' + x.toLowerCase();
                });

                if (!propertyMap.hasOwnProperty(name))
                    propertyMap[name] = 1;
            }
        }

        this.completionsDefined = true;
    };

    this.getCompletions = function(state, session, pos, prefix) {
        if (!this.completionsDefined) {
            this.defineCompletions();
        }

        var token = session.getTokenAt(pos.row, pos.column);

        if (!token)
            return [];
        if (state==='ruleset'){
            var line = session.getLine(pos.row).substr(0, pos.column);
            if (/:[^;]+$/.test(line)) {
                /([\w\-]+):[^:]*$/.test(line);

                return this.getPropertyValueCompletions(state, session, pos, prefix);
            } else {
                return this.getPropertyCompletions(state, session, pos, prefix);
            }
        }

        return [];
    };

    this.getPropertyCompletions = function(state, session, pos, prefix) {
        var properties = Object.keys(propertyMap);
        return properties.map(function(property){
            return {
                caption: property,
                snippet: property + ': $0;',
                meta: "property",
                score: Number.MAX_VALUE
            };
        });
    };

    this.getPropertyValueCompletions = function(state, session, pos, prefix) {
        var line = session.getLine(pos.row).substr(0, pos.column);
        var property = (/([\w\-]+):[^:]*$/.exec(line) || {})[1];

        if (!property)
            return [];
        var values = [];
        if (property in propertyMap && typeof propertyMap[property] === "object") {
            values = Object.keys(propertyMap[property]);
        }
        return values.map(function(value){
            return {
                caption: value,
                snippet: value,
                meta: "property value",
                score: Number.MAX_VALUE
            };
        });
    };

}).call(CssCompletions.prototype);

exports.CssCompletions = CssCompletions;
});

ace.define("ace/mode/behaviour/css",["require","exports","module","ace/lib/oop","ace/mode/behaviour","ace/mode/behaviour/cstyle","ace/token_iterator"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Behaviour = require("../behaviour").Behaviour;
var CstyleBehaviour = require("./cstyle").CstyleBehaviour;
var TokenIterator = require("../../token_iterator").TokenIterator;

var CssBehaviour = function () {

    this.inherit(CstyleBehaviour);

    this.add("colon", "insertion", function (state, action, editor, session, text) {
        if (text === ':') {
            var cursor = editor.getCursorPosition();
            var iterator = new TokenIterator(session, cursor.row, cursor.column);
            var token = iterator.getCurrentToken();
            if (token && token.value.match(/\s+/)) {
                token = iterator.stepBackward();
            }
            if (token && token.type === 'support.type') {
                var line = session.doc.getLine(cursor.row);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                if (rightChar === ':') {
                    return {
                       text: '',
                       selection: [1, 1]
                    };
                }
                if (!line.substring(cursor.column).match(/^\s*;/)) {
                    return {
                       text: ':;',
                       selection: [1, 1]
                    };
                }
            }
        }
    });

    this.add("colon", "deletion", function (state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected === ':') {
            var cursor = editor.getCursorPosition();
            var iterator = new TokenIterator(session, cursor.row, cursor.column);
            var token = iterator.getCurrentToken();
            if (token && token.value.match(/\s+/)) {
                token = iterator.stepBackward();
            }
            if (token && token.type === 'support.type') {
                var line = session.doc.getLine(range.start.row);
                var rightChar = line.substring(range.end.column, range.end.column + 1);
                if (rightChar === ';') {
                    range.end.column ++;
                    return range;
                }
            }
        }
    });

    this.add("semicolon", "insertion", function (state, action, editor, session, text) {
        if (text === ';') {
            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar === ';') {
                return {
                   text: '',
                   selection: [1, 1]
                };
            }
        }
    });

};
oop.inherits(CssBehaviour, CstyleBehaviour);

exports.CssBehaviour = CssBehaviour;
});

ace.define("ace/mode/css",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/css_highlight_rules","ace/mode/matching_brace_outdent","ace/worker/worker_client","ace/mode/css_completions","ace/mode/behaviour/css","ace/mode/folding/cstyle"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var CssHighlightRules = require("./css_highlight_rules").CssHighlightRules;
var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
var WorkerClient = require("../worker/worker_client").WorkerClient;
var CssCompletions = require("./css_completions").CssCompletions;
var CssBehaviour = require("./behaviour/css").CssBehaviour;
var CStyleFoldMode = require("./folding/cstyle").FoldMode;

var Mode = function() {
    this.HighlightRules = CssHighlightRules;
    this.$outdent = new MatchingBraceOutdent();
    this.$behaviour = new CssBehaviour();
    this.$completer = new CssCompletions();
    this.foldingRules = new CStyleFoldMode();
};
oop.inherits(Mode, TextMode);

(function() {

    this.foldingRules = "cStyle";
    this.blockComment = {start: "/*", end: "*/"};

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);
        var tokens = this.getTokenizer().getLineTokens(line, state).tokens;
        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        var match = line.match(/^.*\{\s*$/);
        if (match) {
            indent += tab;
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };

    this.getCompletions = function(state, session, pos, prefix) {
        return this.$completer.getCompletions(state, session, pos, prefix);
    };

    this.createWorker = function(session) {
        var worker = new WorkerClient(["ace"], "ace/mode/css_worker", "Worker");
        worker.attachToDocument(session.getDocument());

        worker.on("annotate", function(e) {
            session.setAnnotations(e.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };

    this.$id = "ace/mode/css";
}).call(Mode.prototype);

exports.Mode = Mode;

});

ace.define("ace/mode/html_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/css_highlight_rules","ace/mode/javascript_highlight_rules","ace/mode/xml_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var CssHighlightRules = require("./css_highlight_rules").CssHighlightRules;
var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
var XmlHighlightRules = require("./xml_highlight_rules").XmlHighlightRules;

var tagMap = lang.createMap({
    a           : 'anchor',
    button 	    : 'form',
    form        : 'form',
    img         : 'image',
    input       : 'form',
    label       : 'form',
    option      : 'form',
    script      : 'script',
    select      : 'form',
    textarea    : 'form',
    style       : 'style',
    table       : 'table',
    tbody       : 'table',
    td          : 'table',
    tfoot       : 'table',
    th          : 'table',
    tr          : 'table'
});

var HtmlHighlightRules = function() {
    XmlHighlightRules.call(this);

    this.addRules({
        attributes: [{
            include : "tag_whitespace"
        }, {
            token : "entity.other.attribute-name.xml",
            regex : "[-_a-zA-Z0-9:.]+"
        }, {
            token : "keyword.operator.attribute-equals.xml",
            regex : "=",
            push : [{
                include: "tag_whitespace"
            }, {
                token : "string.unquoted.attribute-value.html",
                regex : "[^<>='\"`\\s]+",
                next : "pop"
            }, {
                token : "empty",
                regex : "",
                next : "pop"
            }]
        }, {
            include : "attribute_value"
        }],
        tag: [{
            token : function(start, tag) {
                var group = tagMap[tag];
                return ["meta.tag.punctuation." + (start == "<" ? "" : "end-") + "tag-open.xml",
                    "meta.tag" + (group ? "." + group : "") + ".tag-name.xml"];
            },
            regex : "(</?)([-_a-zA-Z0-9:.]+)",
            next: "tag_stuff"
        }],
        tag_stuff: [
            {include : "attributes"},
            {token : "meta.tag.punctuation.tag-close.xml", regex : "/?>", next : "start"}
        ]
    });

    this.embedTagRules(CssHighlightRules, "css-", "style");
    this.embedTagRules(new JavaScriptHighlightRules({jsx: false}).getRules(), "js-", "script");

    if (this.constructor === HtmlHighlightRules)
        this.normalizeRules();
};

oop.inherits(HtmlHighlightRules, XmlHighlightRules);

exports.HtmlHighlightRules = HtmlHighlightRules;
});

ace.define("ace/mode/folding/mixed",["require","exports","module","ace/lib/oop","ace/mode/folding/fold_mode"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function(defaultMode, subModes) {
    this.defaultMode = defaultMode;
    this.subModes = subModes;
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {


    this.$getMode = function(state) {
        if (typeof state != "string") 
            state = state[0];
        for (var key in this.subModes) {
            if (state.indexOf(key) === 0)
                return this.subModes[key];
        }
        return null;
    };
    
    this.$tryMode = function(state, session, foldStyle, row) {
        var mode = this.$getMode(state);
        return (mode ? mode.getFoldWidget(session, foldStyle, row) : "");
    };

    this.getFoldWidget = function(session, foldStyle, row) {
        return (
            this.$tryMode(session.getState(row-1), session, foldStyle, row) ||
            this.$tryMode(session.getState(row), session, foldStyle, row) ||
            this.defaultMode.getFoldWidget(session, foldStyle, row)
        );
    };

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var mode = this.$getMode(session.getState(row-1));
        
        if (!mode || !mode.getFoldWidget(session, foldStyle, row))
            mode = this.$getMode(session.getState(row));
        
        if (!mode || !mode.getFoldWidget(session, foldStyle, row))
            mode = this.defaultMode;
        
        return mode.getFoldWidgetRange(session, foldStyle, row);
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/folding/html",["require","exports","module","ace/lib/oop","ace/mode/folding/mixed","ace/mode/folding/xml","ace/mode/folding/cstyle"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var MixedFoldMode = require("./mixed").FoldMode;
var XmlFoldMode = require("./xml").FoldMode;
var CStyleFoldMode = require("./cstyle").FoldMode;

var FoldMode = exports.FoldMode = function(voidElements, optionalTags) {
    MixedFoldMode.call(this, new XmlFoldMode(voidElements, optionalTags), {
        "js-": new CStyleFoldMode(),
        "css-": new CStyleFoldMode()
    });
};

oop.inherits(FoldMode, MixedFoldMode);

});

ace.define("ace/mode/html_completions",["require","exports","module","ace/token_iterator"], function(require, exports, module) {
"use strict";

var TokenIterator = require("../token_iterator").TokenIterator;

var commonAttributes = [
    "accesskey",
    "class",
    "contenteditable",
    "contextmenu",
    "dir",
    "draggable",
    "dropzone",
    "hidden",
    "id",
    "inert",
    "itemid",
    "itemprop",
    "itemref",
    "itemscope",
    "itemtype",
    "lang",
    "spellcheck",
    "style",
    "tabindex",
    "title",
    "translate"
];

var eventAttributes = [
    "onabort",
    "onblur",
    "oncancel",
    "oncanplay",
    "oncanplaythrough",
    "onchange",
    "onclick",
    "onclose",
    "oncontextmenu",
    "oncuechange",
    "ondblclick",
    "ondrag",
    "ondragend",
    "ondragenter",
    "ondragleave",
    "ondragover",
    "ondragstart",
    "ondrop",
    "ondurationchange",
    "onemptied",
    "onended",
    "onerror",
    "onfocus",
    "oninput",
    "oninvalid",
    "onkeydown",
    "onkeypress",
    "onkeyup",
    "onload",
    "onloadeddata",
    "onloadedmetadata",
    "onloadstart",
    "onmousedown",
    "onmousemove",
    "onmouseout",
    "onmouseover",
    "onmouseup",
    "onmousewheel",
    "onpause",
    "onplay",
    "onplaying",
    "onprogress",
    "onratechange",
    "onreset",
    "onscroll",
    "onseeked",
    "onseeking",
    "onselect",
    "onshow",
    "onstalled",
    "onsubmit",
    "onsuspend",
    "ontimeupdate",
    "onvolumechange",
    "onwaiting"
];

var globalAttributes = commonAttributes.concat(eventAttributes);

var attributeMap = {
    "html": {"manifest": 1},
    "head": {},
    "title": {},
    "base": {"href": 1, "target": 1},
    "link": {"href": 1, "hreflang": 1, "rel": {"stylesheet": 1, "icon": 1}, "media": {"all": 1, "screen": 1, "print": 1}, "type": {"text/css": 1, "image/png": 1, "image/jpeg": 1, "image/gif": 1}, "sizes": 1},
    "meta": {"http-equiv": {"content-type": 1}, "name": {"description": 1, "keywords": 1}, "content": {"text/html; charset=UTF-8": 1}, "charset": 1},
    "style": {"type": 1, "media": {"all": 1, "screen": 1, "print": 1}, "scoped": 1},
    "script": {"charset": 1, "type": {"text/javascript": 1}, "src": 1, "defer": 1, "async": 1},
    "noscript": {"href": 1},
    "body": {"onafterprint": 1, "onbeforeprint": 1, "onbeforeunload": 1, "onhashchange": 1, "onmessage": 1, "onoffline": 1, "onpopstate": 1, "onredo": 1, "onresize": 1, "onstorage": 1, "onundo": 1, "onunload": 1},
    "section": {},
    "nav": {},
    "article": {"pubdate": 1},
    "aside": {},
    "h1": {},
    "h2": {},
    "h3": {},
    "h4": {},
    "h5": {},
    "h6": {},
    "header": {},
    "footer": {},
    "address": {},
    "main": {},
    "p": {},
    "hr": {},
    "pre": {},
    "blockquote": {"cite": 1},
    "ol": {"start": 1, "reversed": 1},
    "ul": {},
    "li": {"value": 1},
    "dl": {},
    "dt": {},
    "dd": {},
    "figure": {},
    "figcaption": {},
    "div": {},
    "a": {"href": 1, "target": {"_blank": 1, "top": 1}, "ping": 1, "rel": {"nofollow": 1, "alternate": 1, "author": 1, "bookmark": 1, "help": 1, "license": 1, "next": 1, "noreferrer": 1, "prefetch": 1, "prev": 1, "search": 1, "tag": 1}, "media": 1, "hreflang": 1, "type": 1},
    "em": {},
    "strong": {},
    "small": {},
    "s": {},
    "cite": {},
    "q": {"cite": 1},
    "dfn": {},
    "abbr": {},
    "data": {},
    "time": {"datetime": 1},
    "code": {},
    "var": {},
    "samp": {},
    "kbd": {},
    "sub": {},
    "sup": {},
    "i": {},
    "b": {},
    "u": {},
    "mark": {},
    "ruby": {},
    "rt": {},
    "rp": {},
    "bdi": {},
    "bdo": {},
    "span": {},
    "br": {},
    "wbr": {},
    "ins": {"cite": 1, "datetime": 1},
    "del": {"cite": 1, "datetime": 1},
    "img": {"alt": 1, "src": 1, "height": 1, "width": 1, "usemap": 1, "ismap": 1},
    "iframe": {"name": 1, "src": 1, "height": 1, "width": 1, "sandbox": {"allow-same-origin": 1, "allow-top-navigation": 1, "allow-forms": 1, "allow-scripts": 1}, "seamless": {"seamless": 1}},
    "embed": {"src": 1, "height": 1, "width": 1, "type": 1},
    "object": {"param": 1, "data": 1, "type": 1, "height" : 1, "width": 1, "usemap": 1, "name": 1, "form": 1, "classid": 1},
    "param": {"name": 1, "value": 1},
    "video": {"src": 1, "autobuffer": 1, "autoplay": {"autoplay": 1}, "loop": {"loop": 1}, "controls": {"controls": 1}, "width": 1, "height": 1, "poster": 1, "muted": {"muted": 1}, "preload": {"auto": 1, "metadata": 1, "none": 1}},
    "audio": {"src": 1, "autobuffer": 1, "autoplay": {"autoplay": 1}, "loop": {"loop": 1}, "controls": {"controls": 1}, "muted": {"muted": 1}, "preload": {"auto": 1, "metadata": 1, "none": 1 }},
    "source": {"src": 1, "type": 1, "media": 1},
    "track": {"kind": 1, "src": 1, "srclang": 1, "label": 1, "default": 1},
    "canvas": {"width": 1, "height": 1},
    "map": {"name": 1},
    "area": {"shape": 1, "coords": 1, "href": 1, "hreflang": 1, "alt": 1, "target": 1, "media": 1, "rel": 1, "ping": 1, "type": 1},
    "svg": {},
    "math": {},
    "table": {"summary": 1},
    "caption": {},
    "colgroup": {"span": 1},
    "col": {"span": 1},
    "tbody": {},
    "thead": {},
    "tfoot": {},
    "tr": {},
    "td": {"headers": 1, "rowspan": 1, "colspan": 1},
    "th": {"headers": 1, "rowspan": 1, "colspan": 1, "scope": 1},
    "form": {"accept-charset": 1, "action": 1, "autocomplete": 1, "enctype": {"multipart/form-data": 1, "application/x-www-form-urlencoded": 1}, "method": {"get": 1, "post": 1}, "name": 1, "novalidate": 1, "target": {"_blank": 1, "top": 1}},
    "fieldset": {"disabled": 1, "form": 1, "name": 1},
    "legend": {},
    "label": {"form": 1, "for": 1},
    "input": {
        "type": {"text": 1, "password": 1, "hidden": 1, "checkbox": 1, "submit": 1, "radio": 1, "file": 1, "button": 1, "reset": 1, "image": 31, "color": 1, "date": 1, "datetime": 1, "datetime-local": 1, "email": 1, "month": 1, "number": 1, "range": 1, "search": 1, "tel": 1, "time": 1, "url": 1, "week": 1},
        "accept": 1, "alt": 1, "autocomplete": {"on": 1, "off": 1}, "autofocus": {"autofocus": 1}, "checked": {"checked": 1}, "disabled": {"disabled": 1}, "form": 1, "formaction": 1, "formenctype": {"application/x-www-form-urlencoded": 1, "multipart/form-data": 1, "text/plain": 1}, "formmethod": {"get": 1, "post": 1}, "formnovalidate": {"formnovalidate": 1}, "formtarget": {"_blank": 1, "_self": 1, "_parent": 1, "_top": 1}, "height": 1, "list": 1, "max": 1, "maxlength": 1, "min": 1, "multiple": {"multiple": 1}, "name": 1, "pattern": 1, "placeholder": 1, "readonly": {"readonly": 1}, "required": {"required": 1}, "size": 1, "src": 1, "step": 1, "width": 1, "files": 1, "value": 1},
    "button": {"autofocus": 1, "disabled": {"disabled": 1}, "form": 1, "formaction": 1, "formenctype": 1, "formmethod": 1, "formnovalidate": 1, "formtarget": 1, "name": 1, "value": 1, "type": {"button": 1, "submit": 1}},
    "select": {"autofocus": 1, "disabled": 1, "form": 1, "multiple": {"multiple": 1}, "name": 1, "size": 1, "readonly":{"readonly": 1}},
    "datalist": {},
    "optgroup": {"disabled": 1, "label": 1},
    "option": {"disabled": 1, "selected": 1, "label": 1, "value": 1},
    "textarea": {"autofocus": {"autofocus": 1}, "disabled": {"disabled": 1}, "form": 1, "maxlength": 1, "name": 1, "placeholder": 1, "readonly": {"readonly": 1}, "required": {"required": 1}, "rows": 1, "cols": 1, "wrap": {"on": 1, "off": 1, "hard": 1, "soft": 1}},
    "keygen": {"autofocus": 1, "challenge": {"challenge": 1}, "disabled": {"disabled": 1}, "form": 1, "keytype": {"rsa": 1, "dsa": 1, "ec": 1}, "name": 1},
    "output": {"for": 1, "form": 1, "name": 1},
    "progress": {"value": 1, "max": 1},
    "meter": {"value": 1, "min": 1, "max": 1, "low": 1, "high": 1, "optimum": 1},
    "details": {"open": 1},
    "summary": {},
    "command": {"type": 1, "label": 1, "icon": 1, "disabled": 1, "checked": 1, "radiogroup": 1, "command": 1},
    "menu": {"type": 1, "label": 1},
    "dialog": {"open": 1}
};

var elements = Object.keys(attributeMap);

function is(token, type) {
    return token.type.lastIndexOf(type + ".xml") > -1;
}

function findTagName(session, pos) {
    var iterator = new TokenIterator(session, pos.row, pos.column);
    var token = iterator.getCurrentToken();
    while (token && !is(token, "tag-name")){
        token = iterator.stepBackward();
    }
    if (token)
        return token.value;
}

function findAttributeName(session, pos) {
    var iterator = new TokenIterator(session, pos.row, pos.column);
    var token = iterator.getCurrentToken();
    while (token && !is(token, "attribute-name")){
        token = iterator.stepBackward();
    }
    if (token)
        return token.value;
}

var HtmlCompletions = function() {

};

(function() {

    this.getCompletions = function(state, session, pos, prefix) {
        var token = session.getTokenAt(pos.row, pos.column);

        if (!token)
            return [];
        if (is(token, "tag-name") || is(token, "tag-open") || is(token, "end-tag-open"))
            return this.getTagCompletions(state, session, pos, prefix);
        if (is(token, "tag-whitespace") || is(token, "attribute-name"))
            return this.getAttributeCompletions(state, session, pos, prefix);
        if (is(token, "attribute-value"))
            return this.getAttributeValueCompletions(state, session, pos, prefix);
        var line = session.getLine(pos.row).substr(0, pos.column);
        if (/&[a-z]*$/i.test(line))
            return this.getHTMLEntityCompletions(state, session, pos, prefix);

        return [];
    };

    this.getTagCompletions = function(state, session, pos, prefix) {
        return elements.map(function(element){
            return {
                value: element,
                meta: "tag",
                score: Number.MAX_VALUE
            };
        });
    };

    this.getAttributeCompletions = function(state, session, pos, prefix) {
        var tagName = findTagName(session, pos);
        if (!tagName)
            return [];
        var attributes = globalAttributes;
        if (tagName in attributeMap) {
            attributes = attributes.concat(Object.keys(attributeMap[tagName]));
        }
        return attributes.map(function(attribute){
            return {
                caption: attribute,
                snippet: attribute + '="$0"',
                meta: "attribute",
                score: Number.MAX_VALUE
            };
        });
    };

    this.getAttributeValueCompletions = function(state, session, pos, prefix) {
        var tagName = findTagName(session, pos);
        var attributeName = findAttributeName(session, pos);
        
        if (!tagName)
            return [];
        var values = [];
        if (tagName in attributeMap && attributeName in attributeMap[tagName] && typeof attributeMap[tagName][attributeName] === "object") {
            values = Object.keys(attributeMap[tagName][attributeName]);
        }
        return values.map(function(value){
            return {
                caption: value,
                snippet: value,
                meta: "attribute value",
                score: Number.MAX_VALUE
            };
        });
    };

    this.getHTMLEntityCompletions = function(state, session, pos, prefix) {
        var values = ['Aacute;', 'aacute;', 'Acirc;', 'acirc;', 'acute;', 'AElig;', 'aelig;', 'Agrave;', 'agrave;', 'alefsym;', 'Alpha;', 'alpha;', 'amp;', 'and;', 'ang;', 'Aring;', 'aring;', 'asymp;', 'Atilde;', 'atilde;', 'Auml;', 'auml;', 'bdquo;', 'Beta;', 'beta;', 'brvbar;', 'bull;', 'cap;', 'Ccedil;', 'ccedil;', 'cedil;', 'cent;', 'Chi;', 'chi;', 'circ;', 'clubs;', 'cong;', 'copy;', 'crarr;', 'cup;', 'curren;', 'Dagger;', 'dagger;', 'dArr;', 'darr;', 'deg;', 'Delta;', 'delta;', 'diams;', 'divide;', 'Eacute;', 'eacute;', 'Ecirc;', 'ecirc;', 'Egrave;', 'egrave;', 'empty;', 'emsp;', 'ensp;', 'Epsilon;', 'epsilon;', 'equiv;', 'Eta;', 'eta;', 'ETH;', 'eth;', 'Euml;', 'euml;', 'euro;', 'exist;', 'fnof;', 'forall;', 'frac12;', 'frac14;', 'frac34;', 'frasl;', 'Gamma;', 'gamma;', 'ge;', 'gt;', 'hArr;', 'harr;', 'hearts;', 'hellip;', 'Iacute;', 'iacute;', 'Icirc;', 'icirc;', 'iexcl;', 'Igrave;', 'igrave;', 'image;', 'infin;', 'int;', 'Iota;', 'iota;', 'iquest;', 'isin;', 'Iuml;', 'iuml;', 'Kappa;', 'kappa;', 'Lambda;', 'lambda;', 'lang;', 'laquo;', 'lArr;', 'larr;', 'lceil;', 'ldquo;', 'le;', 'lfloor;', 'lowast;', 'loz;', 'lrm;', 'lsaquo;', 'lsquo;', 'lt;', 'macr;', 'mdash;', 'micro;', 'middot;', 'minus;', 'Mu;', 'mu;', 'nabla;', 'nbsp;', 'ndash;', 'ne;', 'ni;', 'not;', 'notin;', 'nsub;', 'Ntilde;', 'ntilde;', 'Nu;', 'nu;', 'Oacute;', 'oacute;', 'Ocirc;', 'ocirc;', 'OElig;', 'oelig;', 'Ograve;', 'ograve;', 'oline;', 'Omega;', 'omega;', 'Omicron;', 'omicron;', 'oplus;', 'or;', 'ordf;', 'ordm;', 'Oslash;', 'oslash;', 'Otilde;', 'otilde;', 'otimes;', 'Ouml;', 'ouml;', 'para;', 'part;', 'permil;', 'perp;', 'Phi;', 'phi;', 'Pi;', 'pi;', 'piv;', 'plusmn;', 'pound;', 'Prime;', 'prime;', 'prod;', 'prop;', 'Psi;', 'psi;', 'quot;', 'radic;', 'rang;', 'raquo;', 'rArr;', 'rarr;', 'rceil;', 'rdquo;', 'real;', 'reg;', 'rfloor;', 'Rho;', 'rho;', 'rlm;', 'rsaquo;', 'rsquo;', 'sbquo;', 'Scaron;', 'scaron;', 'sdot;', 'sect;', 'shy;', 'Sigma;', 'sigma;', 'sigmaf;', 'sim;', 'spades;', 'sub;', 'sube;', 'sum;', 'sup;', 'sup1;', 'sup2;', 'sup3;', 'supe;', 'szlig;', 'Tau;', 'tau;', 'there4;', 'Theta;', 'theta;', 'thetasym;', 'thinsp;', 'THORN;', 'thorn;', 'tilde;', 'times;', 'trade;', 'Uacute;', 'uacute;', 'uArr;', 'uarr;', 'Ucirc;', 'ucirc;', 'Ugrave;', 'ugrave;', 'uml;', 'upsih;', 'Upsilon;', 'upsilon;', 'Uuml;', 'uuml;', 'weierp;', 'Xi;', 'xi;', 'Yacute;', 'yacute;', 'yen;', 'Yuml;', 'yuml;', 'Zeta;', 'zeta;', 'zwj;', 'zwnj;'];

        return values.map(function(value){
            return {
                caption: value,
                snippet: value,
                meta: "html entity",
                score: Number.MAX_VALUE
            };
        });
    };

}).call(HtmlCompletions.prototype);

exports.HtmlCompletions = HtmlCompletions;
});

ace.define("ace/mode/html",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text","ace/mode/javascript","ace/mode/css","ace/mode/html_highlight_rules","ace/mode/behaviour/xml","ace/mode/folding/html","ace/mode/html_completions","ace/worker/worker_client"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var TextMode = require("./text").Mode;
var JavaScriptMode = require("./javascript").Mode;
var CssMode = require("./css").Mode;
var HtmlHighlightRules = require("./html_highlight_rules").HtmlHighlightRules;
var XmlBehaviour = require("./behaviour/xml").XmlBehaviour;
var HtmlFoldMode = require("./folding/html").FoldMode;
var HtmlCompletions = require("./html_completions").HtmlCompletions;
var WorkerClient = require("../worker/worker_client").WorkerClient;
var voidElements = ["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "menuitem", "param", "source", "track", "wbr"];
var optionalEndTags = ["li", "dt", "dd", "p", "rt", "rp", "optgroup", "option", "colgroup", "td", "th"];

var Mode = function(options) {
    this.fragmentContext = options && options.fragmentContext;
    this.HighlightRules = HtmlHighlightRules;
    this.$behaviour = new XmlBehaviour();
    this.$completer = new HtmlCompletions();
    
    this.createModeDelegates({
        "js-": JavaScriptMode,
        "css-": CssMode
    });
    
    this.foldingRules = new HtmlFoldMode(this.voidElements, lang.arrayToMap(optionalEndTags));
};
oop.inherits(Mode, TextMode);

(function() {

    this.blockComment = {start: "<!--", end: "-->"};

    this.voidElements = lang.arrayToMap(voidElements);

    this.getNextLineIndent = function(state, line, tab) {
        return this.$getIndent(line);
    };

    this.checkOutdent = function(state, line, input) {
        return false;
    };

    this.getCompletions = function(state, session, pos, prefix) {
        return this.$completer.getCompletions(state, session, pos, prefix);
    };

    this.createWorker = function(session) {
        if (this.constructor != Mode)
            return;
        var worker = new WorkerClient(["ace"], "ace/mode/html_worker", "Worker");
        worker.attachToDocument(session.getDocument());

        if (this.fragmentContext)
            worker.call("setOptions", [{context: this.fragmentContext}]);

        worker.on("error", function(e) {
            session.setAnnotations(e.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };

    this.$id = "ace/mode/html";
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define("ace/mode/tex_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var lang = require("../lib/lang");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var TexHighlightRules = function(textClass) {

    if (!textClass)
        textClass = "text";

    this.$rules = {
        "start" : [
            {
                token : "comment",
                regex : "%.*$"
            }, {
                token : textClass, // non-command
                regex : "\\\\[$&%#\\{\\}]"
            }, {
                token : "keyword", // command
                regex : "\\\\(?:documentclass|usepackage|newcounter|setcounter|addtocounter|value|arabic|stepcounter|newenvironment|renewenvironment|ref|vref|eqref|pageref|label|cite[a-zA-Z]*|tag|begin|end|bibitem)\\b",
               next : "nospell"
            }, {
                token : "keyword", // command
                regex : "\\\\(?:[a-zA-Z0-9]+|[^a-zA-Z0-9])"
            }, {
               token : "paren.keyword.operator",
                regex : "[[({]"
            }, {
               token : "paren.keyword.operator",
                regex : "[\\])}]"
            }, {
                token : textClass,
                regex : "\\s+"
            }
        ],
        "nospell" : [
           {
               token : "comment",
               regex : "%.*$",
               next : "start"
           }, {
               token : "nospell." + textClass, // non-command
               regex : "\\\\[$&%#\\{\\}]"
           }, {
               token : "keyword", // command
               regex : "\\\\(?:documentclass|usepackage|newcounter|setcounter|addtocounter|value|arabic|stepcounter|newenvironment|renewenvironment|ref|vref|eqref|pageref|label|cite[a-zA-Z]*|tag|begin|end|bibitem)\\b"
           }, {
               token : "keyword", // command
               regex : "\\\\(?:[a-zA-Z0-9]+|[^a-zA-Z0-9])",
               next : "start"
           }, {
               token : "paren.keyword.operator",
               regex : "[[({]"
           }, {
               token : "paren.keyword.operator",
               regex : "[\\])]"
           }, {
               token : "paren.keyword.operator",
               regex : "}",
               next : "start"
           }, {
               token : "nospell." + textClass,
               regex : "\\s+"
           }, {
               token : "nospell." + textClass,
               regex : "\\w+"
           }
        ]
    };
};

oop.inherits(TexHighlightRules, TextHighlightRules);

exports.TexHighlightRules = TexHighlightRules;
});

ace.define("ace/mode/ptr_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules","ace/mode/tex_highlight_rules"], function(require, exports, module)
{

   var oop = require("../lib/oop");
   var lang = require("../lib/lang");
   var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
   var TexHighlightRules = require("./tex_highlight_rules").TexHighlightRules;

   var PtrHighlightRules = function()
   {

      var keywords = lang.arrayToMap(
            ("function|if|in|break|next|repeat|else|for|return|switch|while|try|tryCatch|stop|warning|require|library|attach|detach|source|setMethod|setGeneric|setGroupGeneric|setClass")
                  .split("|")
            );

      var buildinConstants = lang.arrayToMap(
            ("NULL|NA|TRUE|FALSE|T|F|Inf|NaN|NA_integer_|NA_real_|NA_character_|" +
             "NA_complex_").split("|")
            );
       
      
      var svgRAN=lang.arrayToMap("animate|animateColor|animateMotion|animateTransform|set".split("|"));
      var svgRME=lang.arrayToMap("desc|metadata|title".split("|"));
      var svgRFE=lang.arrayToMap("feBlend|feColorMatrix|feComponentTransfer|feComposite|feConvolveMatrix|feDiffuseLighting|feDisplacementMap|feFlood|feGaussianBlur|feImage|feMerge|feMorphology|feOffset|feSpecularLighting|feTile|feTurbulence".split("|"));
      var svgRGR=lang.arrayToMap("linearGradient|radialGradient".split("|"));
      var svgRSH=lang.arrayToMap("circle|ellipse|line|path|polygon|polyline|rect".split("|"));
      var svgRCO=lang.arrayToMap("ptR|tagR|svg|svgR|defs|g|Merge|symbol|use".split("|"));
      var svgRTX=lang.arrayToMap("altGlyph|textPath|tref|tspan|text".split("|"));
      var svgRFI=lang.arrayToMap("filter".split("|"));
      var svgRMM=lang.arrayToMap("mask|marker".split("|"));

      this.$rules = {
         "start" : [
            {
               token : "comment.sectionhead",
               regex : "#+(?!').*(?:----|====|####)\\s*$"
            },
            {
               token : "comment",
               regex : "#+'",
               next : "rd-start"
            },
            {
               token : "comment",
               regex : "#.*$"
            },
            {
               token : "string", // multi line string start
               regex : '["]',
               next : "qqstring"
            },
            {
               token : "string", // multi line string start
               regex : "[']",
               next : "qstring"
            },
            {
               token : "constant.numeric", // hex
               regex : "0[xX][0-9a-fA-F]+[Li]?\\b"
            },
            {
               token : "constant.numeric", // explicit integer
               regex : "\\d+L\\b"
            },
            {
               token : "constant.numeric", // number
               regex : "\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d*)?i?\\b"
            },
            {
               token : "constant.numeric", // number with leading decimal
               regex : "\\.\\d+(?:[eE][+\\-]?\\d*)?i?\\b"
            },
            {
               token : "constant.language.boolean",
               regex : "(?:TRUE|FALSE|T|F)\\b"
            },
            {
               token : "identifier",
               regex : "`.*?`"
            },
	    {
		    token: ["identifier", "text", "keyword.operator"],
		     regex : "([a-zA-Z.][a-zA-Z0-9._]*\\b)(\\s*)(=)"
	    },
            {
               onMatch : function(value) {
                  if (keywords[value])
                     return "keyword";
                  else if (buildinConstants[value])
                     return "constant.language";
                  else if (svgRAN[value])
                     return ".bold.italic.svgRAN";
                  else if (svgRME[value])
                     return ".bold.italic.svgRME";                   
                  else if (svgRFE[value])
                     return ".bold.italic.svgRFE";                   
                  else if (svgRGR[value])
                     return ".bold.italic.svgRGR";                   
                  else if (svgRSH[value])
                     return ".bold.italic.svgRSH";                   
                  else if (svgRCO[value])
                     return ".bold.italic.svgRCO";                   
                  else if (svgRTX[value])
                     return ".bold.italic.svgRTX";                   
                  else if (svgRFI[value])
                     return ".bold.italic.svgRFI";                   
                  else if (svgRMM[value])
                     return ".bold.italic.svgRMM";                   
                else if (value == '...' || value.match(/^\.\.\d+$/))
                     return "variable.language";
                  else
                     return "identifier";
               },
               regex : "[a-zA-Z.][a-zA-Z0-9._]*\\b"
            },
            {
               token : "keyword.operator",
               regex : "%%|>=|<=|==|!=|\\->|<\\-|\\|\\||&&|=|\\+|\\-|\\*|/|\\^|>|<|!|&|\\||~|\\$|:"
            },
            {
               token : "keyword.operator", // infix operators
               regex : "%.*?%"
            },
            {
               token : "paren.keyword.operator",
               regex : "[[({]"
            },
            {
               token : "paren.keyword.operator",
               regex : "[\\])}]"
            },
            {
               token : "text",
               regex : "\\s+"
            }
         ],
         "qqstring" : [
            {
               token : "string",
               regex : '(?:(?:\\\\.)|(?:[^"\\\\]))*?"',
               next : "start"
            },
            {
               token : "string",
               regex : '.+'
            }
         ],
         "qstring" : [
            {
               token : "string",
               regex : "(?:(?:\\\\.)|(?:[^'\\\\]))*?'",
               next : "start"
            },
            {
               token : "string",
               regex : '.+'
            }
         ]
      };

      var rdRules = new TexHighlightRules("comment").getRules();
      for (var i = 0; i < rdRules["start"].length; i++) {
         rdRules["start"][i].token += ".virtual-comment";
      }

      this.addRules(rdRules, "rd-");
      this.$rules["rd-start"].unshift({
          token: "text",
          regex: "^",
          next: "start"
      });
      this.$rules["rd-start"].unshift({
         token : "keyword",
         regex : "@(?!@)[^ ]*"
      });
      this.$rules["rd-start"].unshift({
         token : "comment",
         regex : "@@"
      });
      this.$rules["rd-start"].push({
         token : "comment",
         regex : "[^%\\\\[({\\])}]+"
      });
   };

   oop.inherits(PtrHighlightRules, TextHighlightRules);

   exports.PtrHighlightRules = PtrHighlightRules;
});

ace.define("ace/mode/ptr/ptrparse",["require","exports","module"], function(require, exports, module) {
"use strict";
var PTRPARSER = (function(){

      var mssgStack=[];
      
      
      var contextStack=[];
      
      function comparePos( r1, c1, r2, c2){
          
          if( r1<r2 ){
                  return 1;
          }
           if( r1>r2 ){
              return -1;
          }
          if(r1===r2){
              if(c1<c2){
                  return 1;
              } 
              if(c1>c2){
                  return -1;
              } 
          }
          return 0;
      };
      
      function  eleScopeContainsCursor( svgEleInfo, cursorPos){
  	var comp1=comparePos( 
                      svgEleInfo.location.start.line, 
                      svgEleInfo.location.start.column,
                      cursorPos.row,
                      cursorPos.column
                  );
      
  	var comp2=comparePos( 
                      cursorPos.row,
                      cursorPos.column,
                      svgEleInfo.location.end.line, 
                      svgEleInfo.location.end.column
                  );
  	return (comparePos( 
                      svgEleInfo.location.start.line, 
                      svgEleInfo.location.start.column,
                      cursorPos.row,
                      cursorPos.column
                  )==1 
              &&
              comparePos( 
                      cursorPos.row,
                      cursorPos.column,
                      svgEleInfo.location.end.line, 
                      svgEleInfo.location.end.column
                  )==1 );
    
      };
      
      function pushContext( svgEleInfo, cursorPos, stail){
      
          if(cursorPos){
      
      
      var comp1=comparePos( 
                      svgEleInfo.location.start.line, 
                      svgEleInfo.location.start.column,
                      cursorPos.row,
                      cursorPos.column
                  );
      
      var comp2=comparePos( 
                      cursorPos.row,
                      cursorPos.column,
                      svgEleInfo.location.end.line, 
                      svgEleInfo.location.end.column
                  );
     
              if(
                  comparePos( 
                      svgEleInfo.location.start.line, 
                      svgEleInfo.location.start.column,
                      cursorPos.row,
                      cursorPos.column
                  )==1 
              &&
              comparePos( 
                      cursorPos.row,
                      cursorPos.column,
                      svgEleInfo.location.end.line, 
                      svgEleInfo.location.end.column
                  )==1 
              ){
  		var svgAttrs=[];
  		
  		if(!!stail){ 
  		   svgAttrs=stail.filter(function(e){
  			return e instanceof SvgAttrInfo;
  		   }).map(function(e){ e.token})
  	        }
                  contextStack.push(
                      {
                          token: svgEleInfo.token,
                          location: svgEleInfo.location,
  			attrs: svgAttrs
                      }
                  );

              }
          }
      };
      
      function clearContext(){
          contextStack=[];
      };
      
      function addWarning( text, alocation ){
          mssgStack.push(
          {
              message: text,
              location: alocation,
              type: "warning"
          });
      };
      
      
      function addError( text, alocation ){
          mssgStack.push(
          {
              message: text,
              location: alocation,
              type: "error"
          });
      };
      
      function clearMssgs(){
          mssgStack=[];
      };
      
      
      function showResult(title, result){
          console.log("\n" + title + " Result:\n" + JSON.stringify(result) +"\n");
      }
      
      
      Array.prototype.hasValue = function(value) {
        var i;
        for (i=0; i<this.length; i++) { if (this[i] === value) return true; }
        return false;
      };
      
      function SvgAttrInfo(tok, loc){
          this.token=tok;
          this.location=loc;
      };
     
      function SvgEleInfo(tok, loc){
          this.token=tok;
          this.location=loc;
      };
      
      function printLocation(loc){
          if(loc){
              console.log("location: " + loc.start.line + "," + loc.start.column);
          } else {
              console.log("location is null");
          }
      };

  var acceptedAttributes = {
    "circle": ["cxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "cx", "cy", "r", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter"],
    "ellipse": ["cxy", "rxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "cx", "cy", "rx", "ry", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter"],
    "radialGradient": ["cxy", "fxy", "colors", "offsets", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "cx", "cy", "fx", "fy", "gradientTransform", "gradientUnits", "r", "spreadMethod", "xlink.href", "xlink.arcrole", "xlink.role", "xlink.title", "xlink.type"],
    "altGlyph": ["dxy", "xy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "dx", "dy", "format", "glyphRef", "rotate", "x", "xlink.href", "y", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "glyph.orientation.vertical", "glyph.orientation.horizontal", "direction", "unicode.bidi", "text.anchor", "dominant.baseline", "alignment.baseline", "baseline.shift", "font.family", "font.style", "font.variant", "font.weight", "font.stretch", "font.size", "font.size.adjust", "kerning", "letter.spacing", "word.spacing", "text.decoration", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color"],
    "glyphRef": ["dxy", "xy", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "dx", "dy", "format", "glyphRef", "x", "xlink.href", "y", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "tref": ["dxy", "xy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "dx", "dy", "lengthAdjust", "rotate", "textLength", "x", "xlink.href", "y", "xlink.arcrole", "xlink.role", "xlink.title", "xlink.type", "glyph.orientation.vertical", "glyph.orientation.horizontal", "direction", "unicode.bidi", "text.anchor", "dominant.baseline", "alignment.baseline", "baseline.shift", "font.family", "font.style", "font.variant", "font.weight", "font.stretch", "font.size", "font.size.adjust", "kerning", "letter.spacing", "word.spacing", "text.decoration", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color"],
    "tspan": ["dxy", "xy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "dx", "dy", "lengthAdjust", "rotate", "textLength", "x", "y", "glyph.orientation.vertical", "glyph.orientation.horizontal", "direction", "unicode.bidi", "text.anchor", "dominant.baseline", "alignment.baseline", "baseline.shift", "font.family", "font.style", "font.variant", "font.weight", "font.stretch", "font.size", "font.size.adjust", "kerning", "letter.spacing", "word.spacing", "text.decoration", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color"],
    "text": ["dxy", "xy", "cxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "dx", "dy", "lengthAdjust", "rotate", "textLength", "x", "y", "transform", "writing.mode", "glyph.orientation.vertical", "glyph.orientation.horizontal", "direction", "unicode.bidi", "text.anchor", "dominant.baseline", "font.family", "font.style", "font.variant", "font.weight", "font.stretch", "font.size", "font.size.adjust", "kerning", "letter.spacing", "word.spacing", "text.decoration", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "display", "visibility", "visibility", "color.interpolation", "color.rendering", "text.rendering", "pointer.events", "cursor", "filter", "color"],
    "feOffset": ["dxy", "wh", "in1", "xy", "cxy", "dx", "dy", "height", "in1", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "hkern": ["g12", "u12", "g1", "g2", "k", "u1", "u2", "id", "xml.base", "xml.lang", "xml.space"],
    "vkern": ["g12", "u12", "g1", "g2", "k", "u1", "u2", "id", "xml.base", "xml.lang", "xml.space"],
    "filter": ["wh", "xy", "cxy", "filterRes", "filterUnits", "height", "primitiveUnits", "width", "x", "xlink.href", "y", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "feBlend": ["wh", "in12", "in1", "xy", "cxy", "height", "in1", "in2", "mode", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feColorMatrix": ["wh", "in1", "xy", "cxy", "height", "in1", "result", "type", "values", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feComponentTransfer": ["wh", "in1", "xy", "cxy", "height", "in1", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feComposite": ["wh", "in12", "in1", "k1234", "xy", "cxy", "height", "in1", "in2", "k1", "k2", "k3", "k4", "operator", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feConvolveMatrix": ["wh", "in1", "targetXY", "xy", "cxy", "bias", "divisor", "edgeMode", "height", "in1", "kernelMatrix", "kernelUnitLength", "order", "preserveAlpha", "result", "targetX", "targetY", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feDiffuseLighting": ["wh", "in1", "xy", "cxy", "diffuseConstant", "height", "in1", "kernelUnitLength", "result", "surfaceScale", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters", "color", "lighting.color"],
    "feDisplacementMap": ["wh", "in12", "in1", "xy", "cxy", "height", "in1", "in2", "result", "scale", "width", "x", "xChannelSelector", "y", "yChannelSelector", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feFlood": ["wh", "xy", "cxy", "height", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters", "color", "flood.color", "flood.opacity"],
    "feGaussianBlur": ["wh", "in1", "xy", "cxy", "height", "in1", "result", "stdDeviation", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feImage": ["wh", "xy", "cxy", "height", "result", "width", "x", "xlink.href", "y", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "preserveAspectRatio", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "color.interpolation.filters"],
    "feMerge": ["wh", "xy", "cxy", "height", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feMorphology": ["wh", "in1", "xy", "cxy", "height", "in1", "operator", "radius", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feSpecularLighting": ["wh", "in1", "xy", "cxy", "height", "in1", "kernelUnitLength", "result", "specularConstant", "specularExponent", "surfaceScale", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters", "color", "lighting.color"],
    "feTile": ["wh", "in1", "xy", "cxy", "height", "in1", "result", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "feTurbulence": ["wh", "xy", "cxy", "baseFrequency", "height", "numOctaves", "result", "seed", "stitchTiles", "type", "width", "x", "y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "color.interpolation.filters"],
    "foreignObject": ["wh", "xy", "cxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "height", "width", "x", "y", "transform", "overflow", "clip", "display"],
    "image": ["wh", "xy", "cxy", "externalResourcesRequired", "height", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "width", "x", "xlink.href", "xml.base", "xml.lang", "xml.space", "y", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "preserveAspectRatio", "transform", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "overflow", "clip", "clip.path", "clip.rule", "mask", "opacity", "display", "visibility", "color.interpolation", "color.rendering", "image.rendering", "pointer.events", "cursor", "filter", "color.profile"],
    "mask": ["wh", "xy", "cxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "height", "maskContentUnits", "maskUnits", "width", "x", "y", "clip.path", "mask", "color.interpolation", "color.rendering", "cursor", "enable.background"],
    "pattern": ["wh", "xy", "cxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "height", "patternContentUnits", "patternTransform", "patternUnits", "width", "x", "xlink.href", "y", "preserveAspectRatio", "viewBox", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "overflow", "clip", "clip.path", "mask", "opacity", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "rect": ["wh", "rxy", "xy", "cxy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "height", "rx", "ry", "width", "x", "y", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter"],
    "svg": ["wh", "xy", "cxy", "baseProfile", "externalResourcesRequired", "height", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "version", "width", "x", "xml.base", "xml.lang", "xml.space", "y", "class", "contentStyleType", "style", "contentScriptType", "onabort", "onactivate", "onclick", "onerror", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onresize", "onscroll", "onunload", "onzoom", "preserveAspectRatio", "viewBox", "zoomAndPan", "overflow", "clip", "clip.path", "mask", "opacity", "display", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "use": ["wh", "xy", "cxy", "externalResourcesRequired", "height", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "width", "x", "xlink.href", "xml.base", "xml.lang", "xml.space", "y", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "transform", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "clip.path", "clip.rule", "mask", "opacity", "display", "visibility", "color.interpolation", "color.rendering", "pointer.events", "cursor", "filter"],
    "font": ["horiz.origin.xy", "vert.origin.xy", "horiz.adv.x", "horiz.origin.x", "horiz.origin.y", "vert.adv.y", "vert.origin.x", "vert.origin.y", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style"],
    "feSpotLight": ["pointsAtXYZ", "xyz", "limitingConeAngle", "pointsAtX", "pointsAtY", "pointsAtZ", "specularExponent", "x", "y", "z", "id", "xml.base", "xml.lang", "xml.space"],
    "marker": ["refXY", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "markerHeight", "markerUnits", "markerWidth", "orient", "refX", "refY", "preserveAspectRatio", "viewBox", "overflow", "clip", "clip.path", "mask", "opacity", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "glyph": ["vert.origin.xy", "arabic.form", "d", "glyph.name", "horiz.adv.x", "lang", "orientation", "unicode", "vert.adv.y", "vert.origin.x", "vert.origin.y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "clip.path", "mask", "opacity", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "missing.glyph": ["vert.origin.xy", "d", "horiz.adv.x", "vert.adv.y", "vert.origin.x", "vert.origin.y", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "clip.path", "mask", "opacity", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "cursor": ["xy", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "x", "xlink.href", "y"],
    "fePointLight": ["xyz", "x", "y", "z", "id", "xml.base", "xml.lang", "xml.space"],
    "line": ["x12", "xy1", "xy2", "y12", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "x1", "x2", "y1", "y2", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter", "marker.start", "marker.mid", "marker.end"],
    "linearGradient": ["x12", "xy1", "xy2", "y12", "colors", "offsets", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "gradientTransform", "gradientUnits", "spreadMethod", "x1", "x2", "xlink.href", "y1", "y2", "xlink.arcrole", "xlink.role", "xlink.title", "xlink.type"],
    "svgR": ["wh", "baseProfile", "externalResourcesRequired", "height", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "version", "width", "xml.base", "xml.lang", "xml.space", "class", "contentStyleType", "style", "contentScriptType", "onabort", "onactivate", "onclick", "onerror", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onresize", "onscroll", "onunload", "onzoom", "preserveAspectRatio", "viewBox", "zoomAndPan", "overflow", "clip", "clip.path", "mask", "opacity", "display", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "font.face": ["accent.height", "alphabetic", "ascent", "bbox", "cap.height", "descent", "font.family", "font.size", "font.stretch", "font.style", "font.variant", "font.weight", "hanging", "ideographic", "mathematical", "overline.position", "overline.thickness", "panose.1", "slope", "stemh", "stemv", "strikethrough.position", "strikethrough.thickness", "underline.position", "underline.thickness", "unicode.range", "units.per.em", "v.alphabetic", "v.hanging", "v.ideographic", "v.mathematical", "widths", "x.height", "id", "xml.base", "xml.lang", "xml.space"],
    "font.face.name": ["name", "id", "xml.base", "xml.lang", "xml.space"],
    "font.face.format": ["string", "id", "xml.base", "xml.lang", "xml.space"],
    "font.face.uri": ["xlink.href", "id", "xml.base", "xml.lang", "xml.space", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "animate": ["accumulate", "additive", "attributeName", "attributeType", "begin", "by", "calcMode", "dur", "end", "fill", "from", "keySplines", "keyTimes", "max", "min", "repeatCount", "repeatDur", "restart", "to", "values", "xlink.href", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "onbegin", "onend", "onload", "onrepeat", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "color.interpolation", "color.rendering"],
    "animateColor": ["accumulate", "additive", "attributeName", "attributeType", "begin", "by", "calcMode", "dur", "end", "fill", "from", "keySplines", "keyTimes", "max", "min", "repeatCount", "repeatDur", "restart", "to", "values", "xlink.href", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "onbegin", "onend", "onload", "onrepeat", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "color.interpolation", "color.rendering"],
    "animateMotion": ["accumulate", "additive", "begin", "by", "calcMode", "dur", "end", "fill", "from", "keyPoints", "keySplines", "keyTimes", "max", "min", "origin", "path", "repeatCount", "repeatDur", "restart", "rotate", "to", "values", "xlink.href", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "onbegin", "onend", "onload", "onrepeat", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "animateTransform": ["accumulate", "additive", "attributeName", "attributeType", "begin", "by", "calcMode", "dur", "end", "fill", "from", "keySplines", "keyTimes", "max", "min", "repeatCount", "repeatDur", "restart", "to", "type", "values", "xlink.href", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "onbegin", "onend", "onload", "onrepeat", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "set": ["attributeName", "attributeType", "begin", "dur", "end", "fill", "max", "min", "repeatCount", "repeatDur", "restart", "to", "xlink.href", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "onbegin", "onend", "onload", "onrepeat", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "mpath": ["xlink.href", "externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "feFuncA": ["amplitude", "exponent", "intercept", "offset", "slope", "tableValues", "type", "id", "xml.base", "xml.lang", "xml.space"],
    "feFuncB": ["amplitude", "exponent", "intercept", "offset", "slope", "tableValues", "type", "id", "xml.base", "xml.lang", "xml.space"],
    "feFuncG": ["amplitude", "exponent", "intercept", "offset", "slope", "tableValues", "type", "id", "xml.base", "xml.lang", "xml.space"],
    "feFuncR": ["amplitude", "exponent", "intercept", "offset", "slope", "tableValues", "type", "id", "xml.base", "xml.lang", "xml.space"],
    "feDistantLight": ["azimuth", "elevation", "id", "xml.base", "xml.lang", "xml.space"],
    "a": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "transform", "target", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "clip.path", "mask", "opacity", "display", "visibility", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "clipPath": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "clipPathUnits", "transform", "clip.path"],
    "defs": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "transform", "clip.path", "mask", "opacity", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "g": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "transform", "clip.path", "mask", "opacity", "display", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "path": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "d", "pathLength", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter", "marker.start", "marker.mid", "marker.end"],
    "polygon": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "points", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter", "marker.start", "marker.mid", "marker.end"],
    "polyline": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "points", "transform", "clip.path", "clip.rule", "mask", "opacity", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color.interpolation", "color.rendering", "shape.rendering", "color", "pointer.events", "cursor", "filter", "marker.start", "marker.mid", "marker.end"],
    "script": ["externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "type", "xlink.href", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "switch": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "transform", "clip.path", "mask", "opacity", "display", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "symbol": ["externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "preserveAspectRatio", "viewBox", "overflow", "clip", "clip.path", "mask", "opacity", "color.interpolation", "color.rendering", "cursor", "filter", "enable.background"],
    "textPath": ["externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "xml.base", "xml.lang", "xml.space", "class", "style", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "lengthAdjust", "method", "spacing", "startOffset", "textLength", "xlink.href", "xlink.arcrole", "xlink.role", "xlink.title", "xlink.type", "glyph.orientation.vertical", "glyph.orientation.horizontal", "direction", "unicode.bidi", "text.anchor", "dominant.baseline", "alignment.baseline", "baseline.shift", "font.family", "font.style", "font.variant", "font.weight", "font.stretch", "font.size", "font.size.adjust", "kerning", "letter.spacing", "word.spacing", "text.decoration", "fill", "fill.rule", "fill.opacity", "stroke", "stroke.width", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.dasharray", "stroke.dashoffset", "stroke.opacity", "display", "visibility", "color"],
    "view": ["externalResourcesRequired", "id", "xml.base", "xml.lang", "xml.space", "preserveAspectRatio", "viewBox", "viewTarget", "zoomAndPan"],
    "altGlyphDef": ["id", "xml.base", "xml.lang", "xml.space"],
    "altGlyphItem": ["id", "xml.base", "xml.lang", "xml.space"],
    "color.profile": ["id", "xml.base", "xml.lang", "xml.space", "local", "name", "rendering.intent", "xlink.href", "xlink.actuate", "xlink.arcrole", "xlink.role", "xlink.show", "xlink.title", "xlink.type"],
    "desc": ["id", "xml.base", "xml.lang", "xml.space", "class", "style"],
    "feMergeNode": ["id", "xml.base", "xml.lang", "xml.space", "in1"],
    "font.face.src": ["id", "xml.base", "xml.lang", "xml.space"],
    "metadata": ["id", "xml.base", "xml.lang", "xml.space"],
    "stop": ["id", "xml.base", "xml.lang", "xml.space", "class", "style", "offset", "color", "stop.color", "stop.opacity"],
    "style": ["id", "xml.base", "xml.lang", "xml.space", "media", "title", "type"],
    "title": ["id", "xml.base", "xml.lang", "xml.space", "class", "style"]
  };

  var allElements = ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "svgR", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"];
  var acceptContentEle = {
    "glyphRef": ["Empty."],
    "hkern": ["Empty."],
    "vkern": ["Empty."],
    "font.face.format": ["Empty."],
    "font.face.name": ["Empty."],
    "a": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "text": ["a", "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "tspan", "tref", "textPath", "altGlyph"],
    "tspan": ["a", "altGlyph", "animate", "animateColor", "desc", "title", "metadata", "set", "tref", "tspan"],
    "textPath": ["a", "altGlyph", "animate", "animateColor", "desc", "title", "metadata", "set", "tref", "tspan"],
    "mask": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "svg": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "g": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "defs": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "symbol": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "switch": ["a", "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "foreignObject", "g", "image", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "switch", "text", "use"],
    "glyph": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "missing.glyph": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "pattern": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "marker": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "svgR": ["a", "altGlyphDef", "animate", "set", "animateMotion", "animateColor", "animateTransform", "clipPath", "color.profile", "cursor", "desc", "title", "metadata", "filter", "font", "font.face", "foreignObject", "linearGradient", "radialGradient", "image", "marker", "mask", "pattern", "script", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "style", "switch", "text", "view"],
    "altGlyphDef": ["altGlyphItem", "glyphRef"],
    "tref": ["animate", "animateColor", "desc", "title", "metadata", "set"],
    "filter": ["animate", "desc", "title", "metadata", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feFlood", "feGaussianBlur", "feImage", "feMerge", "feMorphology", "feOffset", "feSpecularLighting", "feTile", "feTurbulence", "set"],
    "feDistantLight": ["animate", "set"],
    "fePointLight": ["animate", "set"],
    "feSpotLight": ["animate", "set"],
    "feBlend": ["animate", "set"],
    "feColorMatrix": ["animate", "set"],
    "feFuncR": ["animate", "set"],
    "feFuncG": ["animate", "set"],
    "feFuncB": ["animate", "set"],
    "feFuncA": ["animate", "set"],
    "feComposite": ["animate", "set"],
    "feConvolveMatrix": ["animate", "set"],
    "feDisplacementMap": ["animate", "set"],
    "feFlood": ["animate", "animateColor", "set"],
    "feGaussianBlur": ["animate", "set"],
    "feImage": ["animate", "animateTransform", "set"],
    "feMergeNode": ["animate", "set"],
    "feMorphology": ["animate", "set"],
    "feOffset": ["animate", "set"],
    "feTile": ["animate", "set"],
    "feTurbulence": ["animate", "set"],
    "linearGradient": ["animate", "animateTransform", "desc", "title", "metadata", "set", "stop"],
    "radialGradient": ["animate", "animateTransform", "desc", "title", "metadata", "set", "stop"],
    "stop": ["animate", "animateColor", "set"],
    "rect": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "circle": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "ellipse": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "line": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "polyline": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "polygon": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "clipPath": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "use"],
    "use": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "image": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "path": ["animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata"],
    "altGlyph": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "desc": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "title": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "foreignObject": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "metadata": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "script": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "style": ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color.profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font.face", "font.face.format", "font.face.name", "font.face.src", "font.face.uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing.glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"],
    "view": ["desc", "title", "metadata"],
    "animate": ["desc", "title", "metadata"],
    "set": ["desc", "title", "metadata"],
    "animateMotion": ["desc", "title", "metadata", "mpath"],
    "mpath": ["desc", "title", "metadata"],
    "animateColor": ["desc", "title", "metadata"],
    "animateTransform": ["desc", "title", "metadata"],
    "color.profile": ["desc", "title", "metadata"],
    "cursor": ["desc", "title", "metadata"],
    "feDiffuseLighting": ["desc", "title", "metadata", "feDistantLight", "fePointLight", "feSpotLight"],
    "feSpecularLighting": ["desc", "title", "metadata", "feDistantLight", "fePointLight", "feSpotLight"],
    "font": ["desc", "title", "metadata", "font.face", "glyph", "hkern", "missing.glyph", "vkern"],
    "font.face": ["desc", "title", "metadata", "font.face.src"],
    "feComponentTransfer": ["feFuncA", "feFuncB", "feFuncG", "feFuncR"],
    "feMerge": ["feMergeNode"],
    "font.face.uri": ["font.face.format"],
    "font.face.src": ["font.face.name", "font.face.uri"],
    "altGlyphItem": ["glyphRef"]
  };

  var scopeCompletionCandidates = [["a","altGlyph","altGlyphDef","altGlyphItem","animate","animateColor","animateMotion","animateTransform","circle","clipPath","color.profile","cursor","defs","desc","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","font","font.face","font.face.format","font.face.name","font.face.src","font.face.uri","foreignObject","g","glyph","glyphRef","hkern","image","line","linearGradient","marker","mask","metadata","missing.glyph","mpath","path","pattern","polygon","polyline","radialGradient","rect","script","set","stop","style","svg","switch","symbol","text","textPath","title","tref","tspan","use","view","vkern"],["colors","cxy","dxy","fxy","g12","horiz.origin.xy","in1","in12","k1234","offsets","pointsAtXYZ","refXY","rxy","targetXY","u12","vert.origin.xy","wh","x12","xy","xy1","xy2","xyz","y12"],["accent.height","accumulate","additive","alphabetic","amplitude","arabic.form","ascent","attributeName","attributeType","azimuth","baseFrequency","baseProfile","bbox","begin","bias","by","calcMode","cap.height","class","clipPathUnits","contentScriptType","contentStyleType","cx","cy","d","descent","diffuseConstant","divisor","dur","dx","dy","edgeMode","elevation","end","exponent","externalResourcesRequired","fill","filterRes","filterUnits","font.family","font.size","font.stretch","font.style","font.variant","font.weight","format","from","fx","fy","g1","g2","glyph.name","glyphRef","gradientTransform","gradientUnits","hanging","height","horiz.adv.x","horiz.origin.x","horiz.origin.y","id","ideographic","in1","in2","intercept","k","k1","k2","k3","k4","kernelMatrix","kernelUnitLength","keyPoints","keySplines","keyTimes","lang","lengthAdjust","limitingConeAngle","local","markerHeight","markerUnits","markerWidth","maskContentUnits","maskUnits","mathematical","max","media","method","min","mode","name","numOctaves","offset","onabort","onactivate","onbegin","onclick","onend","onerror","onfocusin","onfocusout","onload","onmousedown","onmousemove","onmouseout","onmouseover","onmouseup","onrepeat","onresize","onscroll","onunload","onzoom","operator","order","orient","orientation","origin","overline.position","overline.thickness","panose.1","path","pathLength","patternContentUnits","patternTransform","patternUnits","points","pointsAtX","pointsAtY","pointsAtZ","preserveAlpha","preserveAspectRatio","primitiveUnits","r","radius","refX","refY","rendering.intent","repeatCount","repeatDur","requiredExtensions","requiredFeatures","restart","result","rotate","rx","ry","scale","seed","slope","spacing","specularConstant","specularExponent","spreadMethod","startOffset","stdDeviation","stemh","stemv","stitchTiles","strikethrough.position","strikethrough.thickness","string","style","surfaceScale","systemLanguage","tableValues","target","targetX","targetY","textLength","title","to","transform","type","u1","u2","underline.position","underline.thickness","unicode","unicode.range","units.per.em","v.alphabetic","v.hanging","v.ideographic","v.mathematical","values","version","vert.adv.y","vert.origin.x","vert.origin.y","viewBox","viewTarget","width","widths","x","x.height","x1","x2","xChannelSelector","xlink.actuate","xlink.arcrole","xlink.href","xlink.role","xlink.show","xlink.title","xlink.type","xml.base","xml.lang","xml.space","y","y1","y2","yChannelSelector","z","zoomAndPan"],["alignment.baseline","baseline.shift","clip","clip.path","clip.rule","color","color.interpolation","color.interpolation.filters","color.profile","color.rendering","cursor","direction","display","dominant.baseline","enable.background","fill","fill.opacity","fill.rule","filter","flood.color","flood.opacity","font.family","font.size","font.size.adjust","font.stretch","font.style","font.variant","font.weight","glyph.orientation.horizontal","glyph.orientation.vertical","image.rendering","kerning","letter.spacing","lighting.color","marker.end","marker.mid","marker.start","mask","opacity","overflow","pointer.events","shape.rendering","stop.color","stop.opacity","stroke","stroke.dasharray","stroke.dashoffset","stroke.linecap","stroke.linejoin","stroke.miterlimit","stroke.opacity","stroke.width","text.anchor","text.decoration","text.rendering","unicode.bidi","visibility","word.spacing","writing.mode"]];

  var scopeCompletions = {"glyphRef":[[15,0],[2,1],[18,1],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[29,2],[30,2],[45,2],[52,2],[193,2],[200,2],[208,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"hkern":[[15,0],[4,1],[14,1],[49,2],[50,2],[65,2],[173,2],[174,2],[60,2],[205,2],[206,2],[207,2]],"vkern":[[15,0],[4,1],[14,1],[49,2],[50,2],[65,2],[173,2],[174,2],[60,2],[205,2],[206,2],[207,2]],"font.face.format":[[15,0],[160,2],[60,2],[205,2],[206,2],[207,2]],"font.face.name":[[15,0],[90,2],[60,2],[205,2],[206,2],[207,2]],"a":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[171,2],[165,2],[198,2],[199,2],[200,2],[201,2],[202,2],[203,2],[204,2],[3,3],[37,3],[38,3],[12,3],[56,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"text":[[0,0],[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[77,0],[76,0],[74,0],[1,0],[2,1],[18,1],[1,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[29,2],[30,2],[76,2],[143,2],[168,2],[193,2],[208,2],[171,2],[58,3],[29,3],[28,3],[11,3],[55,3],[52,3],[13,3],[21,3],[25,3],[26,3],[27,3],[24,3],[22,3],[23,3],[31,3],[32,3],[57,3],[53,3],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[12,3],[56,3],[56,3],[6,3],[9,3],[54,3],[40,3],[10,3],[18,3],[5,3]],"tspan":[[0,0],[1,0],[4,0],[5,0],[13,0],[75,0],[57,0],[67,0],[76,0],[77,0],[2,1],[18,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[29,2],[30,2],[76,2],[143,2],[168,2],[193,2],[208,2],[29,3],[28,3],[11,3],[55,3],[52,3],[13,3],[0,3],[1,3],[21,3],[25,3],[26,3],[27,3],[24,3],[22,3],[23,3],[31,3],[32,3],[57,3],[53,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[5,3]],"textPath":[[0,0],[1,0],[4,0],[5,0],[13,0],[75,0],[57,0],[67,0],[76,0],[77,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[76,2],[87,2],[149,2],[153,2],[168,2],[200,2],[199,2],[201,2],[203,2],[204,2],[29,3],[28,3],[11,3],[55,3],[52,3],[13,3],[0,3],[1,3],[21,3],[25,3],[26,3],[27,3],[24,3],[22,3],[23,3],[31,3],[32,3],[57,3],[53,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[5,3]],"mask":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[16,1],[18,1],[1,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[56,2],[82,2],[83,2],[191,2],[193,2],[208,2],[3,3],[37,3],[6,3],[9,3],[10,3],[14,3]],"svg":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[16,1],[18,1],[1,1],[11,2],[35,2],[56,2],[60,2],[139,2],[140,2],[163,2],[185,2],[191,2],[193,2],[205,2],[206,2],[207,2],[208,2],[18,2],[21,2],[161,2],[20,2],[93,2],[94,2],[96,2],[98,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[108,2],[109,2],[110,2],[111,2],[130,2],[189,2],[213,2],[39,3],[2,3],[3,3],[37,3],[38,3],[12,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"g":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[171,2],[3,3],[37,3],[38,3],[12,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"defs":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[171,2],[3,3],[37,3],[38,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"symbol":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[130,2],[189,2],[39,3],[2,3],[3,3],[37,3],[38,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"switch":[[0,0],[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[47,0],[48,0],[52,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[71,0],[73,0],[78,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[171,2],[3,3],[37,3],[38,3],[12,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"glyph":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[15,1],[5,2],[24,2],[51,2],[57,2],[75,2],[115,2],[177,2],[186,2],[187,2],[188,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[3,3],[37,3],[38,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"missing.glyph":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[15,1],[24,2],[57,2],[186,2],[187,2],[188,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[3,3],[37,3],[38,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"pattern":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[16,1],[18,1],[1,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[56,2],[122,2],[123,2],[124,2],[191,2],[193,2],[200,2],[208,2],[130,2],[189,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[39,3],[2,3],[3,3],[37,3],[38,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"marker":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[11,1],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[79,2],[80,2],[81,2],[114,2],[134,2],[135,2],[130,2],[189,2],[39,3],[2,3],[3,3],[37,3],[38,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"svgR":[[0,0],[2,0],[4,0],[67,0],[6,0],[5,0],[7,0],[9,0],[10,0],[11,0],[13,0],[75,0],[57,0],[40,0],[41,0],[42,0],[47,0],[54,0],[64,0],[52,0],[55,0],[56,0],[61,0],[66,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[70,0],[48,0],[12,0],[72,0],[78,0],[69,0],[71,0],[73,0],[79,0],[16,1],[11,2],[35,2],[56,2],[60,2],[139,2],[140,2],[163,2],[185,2],[191,2],[205,2],[206,2],[207,2],[18,2],[21,2],[161,2],[20,2],[93,2],[94,2],[96,2],[98,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[108,2],[109,2],[110,2],[111,2],[130,2],[189,2],[213,2],[39,3],[2,3],[3,3],[37,3],[38,3],[12,3],[6,3],[9,3],[10,3],[18,3],[14,3]],"altGlyphDef":[[3,0],[50,0],[60,2],[205,2],[206,2],[207,2]],"tref":[[4,0],[5,0],[13,0],[75,0],[57,0],[67,0],[2,1],[18,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[29,2],[30,2],[76,2],[143,2],[168,2],[193,2],[200,2],[208,2],[199,2],[201,2],[203,2],[204,2],[29,3],[28,3],[11,3],[55,3],[52,3],[13,3],[0,3],[1,3],[21,3],[25,3],[26,3],[27,3],[24,3],[22,3],[23,3],[31,3],[32,3],[57,3],[53,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[5,3]],"filter":[[4,0],[13,0],[75,0],[57,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[24,0],[29,0],[30,0],[31,0],[33,0],[34,0],[36,0],[38,0],[39,0],[67,0],[16,1],[18,1],[1,1],[37,2],[38,2],[56,2],[131,2],[191,2],[193,2],[200,2],[208,2],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"feDistantLight":[[4,0],[67,0],[9,2],[32,2],[60,2],[205,2],[206,2],[207,2]],"fePointLight":[[4,0],[67,0],[21,1],[193,2],[208,2],[212,2],[60,2],[205,2],[206,2],[207,2]],"feSpotLight":[[4,0],[67,0],[10,1],[21,1],[77,2],[126,2],[127,2],[128,2],[151,2],[193,2],[208,2],[212,2],[60,2],[205,2],[206,2],[207,2]],"feBlend":[[4,0],[67,0],[16,1],[7,1],[6,1],[18,1],[1,1],[56,2],[62,2],[63,2],[89,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feColorMatrix":[[4,0],[67,0],[16,1],[6,1],[18,1],[1,1],[56,2],[62,2],[142,2],[172,2],[184,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feFuncR":[[4,0],[67,0],[4,2],[34,2],[64,2],[92,2],[148,2],[164,2],[172,2],[60,2],[205,2],[206,2],[207,2]],"feFuncG":[[4,0],[67,0],[4,2],[34,2],[64,2],[92,2],[148,2],[164,2],[172,2],[60,2],[205,2],[206,2],[207,2]],"feFuncB":[[4,0],[67,0],[4,2],[34,2],[64,2],[92,2],[148,2],[164,2],[172,2],[60,2],[205,2],[206,2],[207,2]],"feFuncA":[[4,0],[67,0],[4,2],[34,2],[64,2],[92,2],[148,2],[164,2],[172,2],[60,2],[205,2],[206,2],[207,2]],"feComposite":[[4,0],[67,0],[16,1],[7,1],[6,1],[8,1],[18,1],[1,1],[56,2],[62,2],[63,2],[66,2],[67,2],[68,2],[69,2],[112,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feConvolveMatrix":[[4,0],[67,0],[16,1],[6,1],[13,1],[18,1],[1,1],[14,2],[27,2],[31,2],[56,2],[62,2],[70,2],[71,2],[113,2],[129,2],[142,2],[166,2],[167,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feDisplacementMap":[[4,0],[67,0],[16,1],[7,1],[6,1],[18,1],[1,1],[56,2],[62,2],[63,2],[142,2],[146,2],[191,2],[193,2],[197,2],[208,2],[211,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feFlood":[[4,0],[5,0],[67,0],[16,1],[18,1],[1,1],[56,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3],[5,3],[19,3],[20,3]],"feGaussianBlur":[[4,0],[67,0],[16,1],[6,1],[18,1],[1,1],[56,2],[62,2],[142,2],[154,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feImage":[[4,0],[7,0],[67,0],[16,1],[18,1],[1,1],[56,2],[142,2],[191,2],[193,2],[200,2],[208,2],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[130,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[7,3]],"feMergeNode":[[4,0],[67,0],[60,2],[205,2],[206,2],[207,2],[62,2]],"feMorphology":[[4,0],[67,0],[16,1],[6,1],[18,1],[1,1],[56,2],[62,2],[112,2],[133,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feOffset":[[4,0],[67,0],[2,1],[16,1],[6,1],[18,1],[1,1],[29,2],[30,2],[56,2],[62,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feTile":[[4,0],[67,0],[16,1],[6,1],[18,1],[1,1],[56,2],[62,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feTurbulence":[[4,0],[67,0],[16,1],[18,1],[1,1],[10,2],[56,2],[91,2],[142,2],[147,2],[157,2],[172,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"linearGradient":[[4,0],[7,0],[13,0],[75,0],[57,0],[67,0],[68,0],[17,1],[19,1],[20,1],[22,1],[0,1],[9,1],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[53,2],[54,2],[152,2],[195,2],[196,2],[200,2],[209,2],[210,2],[199,2],[201,2],[203,2],[204,2]],"radialGradient":[[4,0],[7,0],[13,0],[75,0],[57,0],[67,0],[68,0],[1,1],[3,1],[0,1],[9,1],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[22,2],[23,2],[47,2],[48,2],[53,2],[54,2],[132,2],[152,2],[200,2],[199,2],[201,2],[203,2],[204,2]],"stop":[[4,0],[5,0],[67,0],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[92,2],[5,3],[42,3],[43,3]],"rect":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[16,1],[12,1],[18,1],[1,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[56,2],[144,2],[145,2],[191,2],[193,2],[208,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3]],"circle":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[1,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[22,2],[23,2],[132,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3]],"ellipse":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[1,1],[12,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[22,2],[23,2],[144,2],[145,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3]],"line":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[17,1],[19,1],[20,1],[22,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[195,2],[196,2],[209,2],[210,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3],[36,3],[35,3],[34,3]],"polyline":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[125,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3],[36,3],[35,3],[34,3]],"polygon":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[125,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3],[36,3],[35,3],[34,3]],"clipPath":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[65,0],[8,0],[14,0],[53,0],[63,0],[62,0],[60,0],[73,0],[78,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[19,2],[171,2],[3,3]],"use":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[16,1],[18,1],[1,1],[35,2],[56,2],[60,2],[139,2],[140,2],[163,2],[191,2],[193,2],[200,2],[205,2],[206,2],[207,2],[208,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[171,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[3,3],[4,3],[37,3],[38,3],[12,3],[56,3],[6,3],[9,3],[40,3],[10,3],[18,3]],"image":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[16,1],[18,1],[1,1],[35,2],[56,2],[60,2],[139,2],[140,2],[163,2],[191,2],[193,2],[200,2],[205,2],[206,2],[207,2],[208,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[130,2],[171,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[39,3],[2,3],[3,3],[4,3],[37,3],[38,3],[12,3],[56,3],[6,3],[9,3],[30,3],[40,3],[10,3],[18,3],[8,3]],"path":[[4,0],[67,0],[6,0],[5,0],[7,0],[13,0],[75,0],[57,0],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[24,2],[121,2],[171,2],[3,3],[4,3],[37,3],[38,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[6,3],[9,3],[41,3],[5,3],[40,3],[10,3],[18,3],[36,3],[35,3],[34,3]],"altGlyph":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[2,1],[18,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[29,2],[30,2],[45,2],[52,2],[143,2],[193,2],[200,2],[208,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[29,3],[28,3],[11,3],[55,3],[52,3],[13,3],[0,3],[1,3],[21,3],[25,3],[26,3],[27,3],[24,3],[22,3],[23,3],[31,3],[32,3],[57,3],[53,3],[15,3],[17,3],[16,3],[44,3],[51,3],[47,3],[48,3],[49,3],[45,3],[46,3],[50,3],[12,3],[56,3],[5,3]],"desc":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2]],"title":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2]],"foreignObject":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[16,1],[18,1],[1,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[18,2],[161,2],[94,2],[96,2],[99,2],[100,2],[101,2],[102,2],[103,2],[104,2],[105,2],[106,2],[56,2],[191,2],[193,2],[208,2],[171,2],[39,3],[2,3],[12,3]],"metadata":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[60,2],[205,2],[206,2],[207,2]],"script":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[35,2],[60,2],[205,2],[206,2],[207,2],[172,2],[200,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"style":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[16,0],[17,0],[18,0],[19,0],[20,0],[21,0],[22,0],[23,0],[24,0],[25,0],[26,0],[27,0],[28,0],[29,0],[30,0],[31,0],[32,0],[33,0],[34,0],[35,0],[36,0],[37,0],[38,0],[39,0],[40,0],[41,0],[42,0],[43,0],[44,0],[45,0],[46,0],[47,0],[48,0],[49,0],[50,0],[51,0],[52,0],[53,0],[54,0],[55,0],[56,0],[57,0],[58,0],[59,0],[60,0],[61,0],[62,0],[63,0],[64,0],[65,0],[66,0],[67,0],[68,0],[69,0],[70,0],[71,0],[72,0],[73,0],[74,0],[75,0],[76,0],[77,0],[78,0],[79,0],[80,0],[60,2],[205,2],[206,2],[207,2],[86,2],[169,2],[172,2]],"view":[[13,0],[75,0],[57,0],[35,2],[60,2],[205,2],[206,2],[207,2],[130,2],[189,2],[190,2],[213,2]],"animate":[[13,0],[75,0],[57,0],[1,2],[2,2],[7,2],[8,2],[13,2],[15,2],[16,2],[28,2],[33,2],[36,2],[46,2],[73,2],[74,2],[85,2],[88,2],[137,2],[138,2],[141,2],[170,2],[184,2],[200,2],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[95,2],[97,2],[101,2],[107,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[6,3],[9,3]],"set":[[13,0],[75,0],[57,0],[7,2],[8,2],[13,2],[28,2],[33,2],[36,2],[85,2],[88,2],[137,2],[138,2],[141,2],[170,2],[200,2],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[95,2],[97,2],[101,2],[107,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"animateMotion":[[13,0],[75,0],[57,0],[59,0],[1,2],[2,2],[13,2],[15,2],[16,2],[28,2],[33,2],[36,2],[46,2],[72,2],[73,2],[74,2],[85,2],[88,2],[116,2],[120,2],[137,2],[138,2],[141,2],[143,2],[170,2],[184,2],[200,2],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[95,2],[97,2],[101,2],[107,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"mpath":[[13,0],[75,0],[57,0],[200,2],[35,2],[60,2],[205,2],[206,2],[207,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"animateColor":[[13,0],[75,0],[57,0],[1,2],[2,2],[7,2],[8,2],[13,2],[15,2],[16,2],[28,2],[33,2],[36,2],[46,2],[73,2],[74,2],[85,2],[88,2],[137,2],[138,2],[141,2],[170,2],[184,2],[200,2],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[95,2],[97,2],[101,2],[107,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[6,3],[9,3]],"animateTransform":[[13,0],[75,0],[57,0],[1,2],[2,2],[7,2],[8,2],[13,2],[15,2],[16,2],[28,2],[33,2],[36,2],[46,2],[73,2],[74,2],[85,2],[88,2],[137,2],[138,2],[141,2],[170,2],[172,2],[184,2],[200,2],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[95,2],[97,2],[101,2],[107,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"color.profile":[[13,0],[75,0],[57,0],[60,2],[205,2],[206,2],[207,2],[78,2],[90,2],[136,2],[200,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"cursor":[[13,0],[75,0],[57,0],[18,1],[35,2],[60,2],[139,2],[140,2],[163,2],[205,2],[206,2],[207,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2],[193,2],[200,2],[208,2]],"feDiffuseLighting":[[13,0],[75,0],[57,0],[23,0],[35,0],[37,0],[16,1],[6,1],[18,1],[1,1],[26,2],[56,2],[62,2],[71,2],[142,2],[162,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3],[5,3],[33,3]],"feSpecularLighting":[[13,0],[75,0],[57,0],[23,0],[35,0],[37,0],[16,1],[6,1],[18,1],[1,1],[56,2],[62,2],[71,2],[142,2],[150,2],[151,2],[162,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3],[5,3],[33,3]],"font":[[13,0],[75,0],[57,0],[42,0],[49,0],[51,0],[58,0],[80,0],[5,1],[15,1],[57,2],[58,2],[59,2],[186,2],[187,2],[188,2],[35,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2]],"font.face":[[13,0],[75,0],[57,0],[45,0],[0,2],[3,2],[6,2],[12,2],[17,2],[25,2],[39,2],[40,2],[41,2],[42,2],[43,2],[44,2],[55,2],[61,2],[84,2],[117,2],[118,2],[119,2],[148,2],[155,2],[156,2],[158,2],[159,2],[175,2],[176,2],[178,2],[179,2],[180,2],[181,2],[182,2],[183,2],[192,2],[194,2],[60,2],[205,2],[206,2],[207,2]],"feComponentTransfer":[[25,0],[26,0],[27,0],[28,0],[16,1],[6,1],[18,1],[1,1],[56,2],[62,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"feMerge":[[32,0],[16,1],[18,1],[1,1],[56,2],[142,2],[191,2],[193,2],[208,2],[60,2],[205,2],[206,2],[207,2],[18,2],[161,2],[7,3]],"font.face.uri":[[43,0],[200,2],[60,2],[205,2],[206,2],[207,2],[198,2],[199,2],[201,2],[202,2],[203,2],[204,2]],"font.face.src":[[44,0],[46,0],[60,2],[205,2],[206,2],[207,2]],"altGlyphItem":[[50,0],[60,2],[205,2],[206,2],[207,2]]};


"use strict";

function peg$subclass(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
}

function peg$SyntaxError(message, expected, found, location) {
  this.message  = message;
  this.expected = expected;
  this.found    = found;
  this.location = location;
  this.name     = "SyntaxError";

  if (typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(this, peg$SyntaxError);
  }
}

peg$subclass(peg$SyntaxError, Error);

peg$SyntaxError.buildMessage = function(expected, found) {
  var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return "\"" + literalEscape(expectation.text) + "\"";
        },

        "class": function(expectation) {
          var escapedParts = "",
              i;

          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array
              ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
              : classEscape(expectation.parts[i]);
          }

          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },

        any: function(expectation) {
          return "any character";
        },

        end: function(expectation) {
          return "end of input";
        },

        other: function(expectation) {
          return expectation.description;
        }
      };

  function hex(ch) {
    return ch.charCodeAt(0).toString(16).toUpperCase();
  }

  function literalEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/"/g,  '\\"')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function classEscape(s) {
    return s
      .replace(/\\/g, '\\\\')
      .replace(/\]/g, '\\]')
      .replace(/\^/g, '\\^')
      .replace(/-/g,  '\\-')
      .replace(/\0/g, '\\0')
      .replace(/\t/g, '\\t')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/[\x00-\x0F]/g,          function(ch) { return '\\x0' + hex(ch); })
      .replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) { return '\\x'  + hex(ch); });
  }

  function describeExpectation(expectation) {
    return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
  }

  function describeExpected(expected) {
    var descriptions = new Array(expected.length),
        i, j;

    for (i = 0; i < expected.length; i++) {
      descriptions[i] = describeExpectation(expected[i]);
    }

    descriptions.sort();

    if (descriptions.length > 0) {
      for (i = 1, j = 1; i < descriptions.length; i++) {
        if (descriptions[i - 1] !== descriptions[i]) {
          descriptions[j] = descriptions[i];
          j++;
        }
      }
      descriptions.length = j;
    }

    switch (descriptions.length) {
      case 1:
        return descriptions[0];

      case 2:
        return descriptions[0] + " or " + descriptions[1];

      default:
        return descriptions.slice(0, -1).join(", ")
          + ", or "
          + descriptions[descriptions.length - 1];
    }
  }

  function describeFound(found) {
    return found ? "\"" + literalEscape(found) + "\"" : "end of input";
  }

  return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};

function peg$parse(input, options) {
  options = options !== void 0 ? options : {};

  var peg$FAILED = {},

      peg$startRuleFunctions = { start: peg$parsestart },
      peg$startRuleFunction  = peg$parsestart,

      peg$c0 = "\r",
      peg$c1 = peg$literalExpectation("\r", false),
      peg$c2 = "\n",
      peg$c3 = peg$literalExpectation("\n", false),
      peg$c4 = peg$anyExpectation(),
      peg$c5 = ";",
      peg$c6 = peg$literalExpectation(";", false),
      peg$c7 = "!",
      peg$c8 = peg$literalExpectation("!", false),
      peg$c9 = "NULL",
      peg$c10 = peg$literalExpectation("NULL", false),
      peg$c11 = "NA",
      peg$c12 = peg$literalExpectation("NA", false),
      peg$c13 = "Inf",
      peg$c14 = peg$literalExpectation("Inf", false),
      peg$c15 = "NaN",
      peg$c16 = peg$literalExpectation("NaN", false),
      peg$c17 = "TRUE",
      peg$c18 = peg$literalExpectation("TRUE", false),
      peg$c19 = "FALSE",
      peg$c20 = peg$literalExpectation("FALSE", false),
      peg$c21 = "next",
      peg$c22 = peg$literalExpectation("next", false),
      peg$c23 = "break",
      peg$c24 = peg$literalExpectation("break", false),
      peg$c25 = "{",
      peg$c26 = peg$literalExpectation("{", false),
      peg$c27 = "}",
      peg$c28 = peg$literalExpectation("}", false),
      peg$c29 = "if",
      peg$c30 = peg$literalExpectation("if", false),
      peg$c31 = "(",
      peg$c32 = peg$literalExpectation("(", false),
      peg$c33 = ")",
      peg$c34 = peg$literalExpectation(")", false),
      peg$c35 = "else",
      peg$c36 = peg$literalExpectation("else", false),
      peg$c37 = "for",
      peg$c38 = peg$literalExpectation("for", false),
      peg$c39 = "in",
      peg$c40 = peg$literalExpectation("in", false),
      peg$c41 = "while",
      peg$c42 = peg$literalExpectation("while", false),
      peg$c43 = "repeat",
      peg$c44 = peg$literalExpectation("repeat", false),
      peg$c45 = "function",
      peg$c46 = peg$literalExpectation("function", false),
      peg$c47 = "+",
      peg$c48 = peg$literalExpectation("+", false),
      peg$c49 = "-",
      peg$c50 = peg$literalExpectation("-", false),
      peg$c51 = "~",
      peg$c52 = peg$literalExpectation("~", false),
      peg$c53 = "=",
      peg$c54 = peg$literalExpectation("=", false),
      peg$c55 = "...",
      peg$c56 = peg$literalExpectation("...", false),
      peg$c57 = ",",
      peg$c58 = peg$literalExpectation(",", false),
      peg$c59 = function() {
          addError( "comma issues", location() ); 
          return "comma";
      },
      peg$c60 = function() { 
          addError( "comma issues", location() ); 
          return "comma";
      },
      peg$c61 = "[",
      peg$c62 = peg$literalExpectation("[", false),
      peg$c63 = "]",
      peg$c64 = peg$literalExpectation("]", false),
      peg$c65 = "[[",
      peg$c66 = peg$literalExpectation("[[", false),
      peg$c67 = "]]",
      peg$c68 = peg$literalExpectation("]]", false),
      peg$c69 = function(head, tail, rightParen) {
          var i, tailTok, tailLoc, result, headTok = head;
          
          if(tail){
              for( i=0; i< tail.length; i++){
                  if(tail[i]){
                      if(tail[i] instanceof SvgEleInfo){
                          tailTok=tail[i].token;
                          if(allElements.hasValue( tailTok ) ){
                              if(!acceptContentEle[headTok].hasValue(tailTok)){
                                  tailLoc=tail[i].location;
                                  addWarning( "Warning: " + tailTok + " not in content model of " + headTok, tailLoc );
                              }
                          }
                      } else {
                          if(tail[i] instanceof SvgAttrInfo){
                              tailTok=tail[i].token;
                              if(!acceptedAttributes[headTok].hasValue(tailTok)){
                                  tailLoc=tail[i].location;
                                  addWarning( "Warning: " + tailTok + " not an attribute of " + headTok, tailLoc );
                              }
                          }
                      }
                  }
              }
          }
          if( rightParen ){
          } else {
              addError("Missing Closing Right Parenthesis", location() );
          }
          result= new SvgEleInfo(headTok, location());
          
           if( !!options.cursorPos ){
      	if ( eleScopeContainsCursor( result, options.cursorPos) ){
      		containedAttrs=[]
      		if(!!tail){
      			containedAttrs=tail.filter(function(e){
      				return !!e && (e instanceof SvgAttrInfo );
      			}).map( function(e) { return e.token; });
      		};
      		contextStack.push(
                          {
                              token: result.token,
                              location: result.location,
      			attrs: containedAttrs
                          }
                      );
      	}
           }
          return result;
      },
      peg$c70 = function(attr) {
         var result;
         result= new SvgAttrInfo(attr, location());
         return result;},
      peg$c71 = function() {
          var result = elem;
          return result;
      },
      peg$c72 = function(head, tail) {   
          var result=tail, loc;
          if(result){
              loc=location();
          } else {
          }
          return result;
      },
      peg$c73 = function(tail) { 
          var result=tail;
          addError( "comma issues", location() ); 
          return result;
      },
      peg$c74 = function(tail) {
          var result=tail;
          var resultType;
          if(result){
              resultType = typeof result;
          } else {
          }
          return result;
      },
      peg$c75 = function(head, tail) {
          var result = tail;
          var resultType =typeof head;
          
          if(result){
              resultType = typeof result;
              result.unshift(head);
          } else {
              result = [head];
          }
          return result;
      },
      peg$c76 = /^[><:+&*\-.$=\/]/,
      peg$c77 = peg$classExpectation([">", "<", ":", "+", "&", "*", "-", ".", "$", "=", "/"], false, false),
      peg$c78 = "%",
      peg$c79 = peg$literalExpectation("%", false),
      peg$c80 = "<<-",
      peg$c81 = peg$literalExpectation("<<-", false),
      peg$c82 = "->>",
      peg$c83 = peg$literalExpectation("->>", false),
      peg$c84 = ":::",
      peg$c85 = peg$literalExpectation(":::", false),
      peg$c86 = "<-",
      peg$c87 = peg$literalExpectation("<-", false),
      peg$c88 = "==",
      peg$c89 = peg$literalExpectation("==", false),
      peg$c90 = "::",
      peg$c91 = peg$literalExpectation("::", false),
      peg$c92 = ">=",
      peg$c93 = peg$literalExpectation(">=", false),
      peg$c94 = "!=",
      peg$c95 = peg$literalExpectation("!=", false),
      peg$c96 = "||",
      peg$c97 = peg$literalExpectation("||", false),
      peg$c98 = "&&",
      peg$c99 = peg$literalExpectation("&&", false),
      peg$c100 = ":=",
      peg$c101 = peg$literalExpectation(":=", false),
      peg$c102 = "<=",
      peg$c103 = peg$literalExpectation("<=", false),
      peg$c104 = "->",
      peg$c105 = peg$literalExpectation("->", false),
      peg$c106 = "$",
      peg$c107 = peg$literalExpectation("$", false),
      peg$c108 = "@",
      peg$c109 = peg$literalExpectation("@", false),
      peg$c110 = "^",
      peg$c111 = peg$literalExpectation("^", false),
      peg$c112 = ":",
      peg$c113 = peg$literalExpectation(":", false),
      peg$c114 = "*",
      peg$c115 = peg$literalExpectation("*", false),
      peg$c116 = "/",
      peg$c117 = peg$literalExpectation("/", false),
      peg$c118 = ">",
      peg$c119 = peg$literalExpectation(">", false),
      peg$c120 = "<",
      peg$c121 = peg$literalExpectation("<", false),
      peg$c122 = "&",
      peg$c123 = peg$literalExpectation("&", false),
      peg$c124 = "|",
      peg$c125 = peg$literalExpectation("|", false),
      peg$c126 = /^[\n\r\u2028\u2029]/,
      peg$c127 = peg$classExpectation(["\n", "\r", "\u2028", "\u2029"], false, false),
      peg$c128 = /^[\t\x0B\f \xA0\uFEFF\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/,
      peg$c129 = peg$classExpectation(["\t", "\x0B", "\f", " ", "\xA0", "\uFEFF", "\u1680", "\u180E", ["\u2000", "\u200A"], "\u202F", "\u205F", "\u3000"], false, false),
      peg$c130 = /^[a-zA-Z]/,
      peg$c131 = peg$classExpectation([["a", "z"], ["A", "Z"]], false, false),
      peg$c132 = ".",
      peg$c133 = peg$literalExpectation(".", false),
      peg$c134 = "_",
      peg$c135 = peg$literalExpectation("_", false),
      peg$c136 = function(head, tail) {
          var result = tail;
          if(result){
              result.unshift(head);
              result=result.join("");
          } else {
              result=head
          }
          return result;
      },
      peg$c137 = "feComponentTransfer",
      peg$c138 = peg$literalExpectation("feComponentTransfer", false),
      peg$c139 = "feSpecularLighting",
      peg$c140 = peg$literalExpectation("feSpecularLighting", false),
      peg$c141 = "feDiffuseLighting",
      peg$c142 = peg$literalExpectation("feDiffuseLighting", false),
      peg$c143 = "feDisplacementMap",
      peg$c144 = peg$literalExpectation("feDisplacementMap", false),
      peg$c145 = "animateTransform",
      peg$c146 = peg$literalExpectation("animateTransform", false),
      peg$c147 = "feConvolveMatrix",
      peg$c148 = peg$literalExpectation("feConvolveMatrix", false),
      peg$c149 = "font.face.format",
      peg$c150 = peg$literalExpectation("font.face.format", false),
      peg$c151 = "feDistantLight",
      peg$c152 = peg$literalExpectation("feDistantLight", false),
      peg$c153 = "feGaussianBlur",
      peg$c154 = peg$literalExpectation("feGaussianBlur", false),
      peg$c155 = "font.face.name",
      peg$c156 = peg$literalExpectation("font.face.name", false),
      peg$c157 = "linearGradient",
      peg$c158 = peg$literalExpectation("linearGradient", false),
      peg$c159 = "radialGradient",
      peg$c160 = peg$literalExpectation("radialGradient", false),
      peg$c161 = "animateMotion",
      peg$c162 = peg$literalExpectation("animateMotion", false),
      peg$c163 = "color.profile",
      peg$c164 = peg$literalExpectation("color.profile", false),
      peg$c165 = "feColorMatrix",
      peg$c166 = peg$literalExpectation("feColorMatrix", false),
      peg$c167 = "font.face.src",
      peg$c168 = peg$literalExpectation("font.face.src", false),
      peg$c169 = "font.face.uri",
      peg$c170 = peg$literalExpectation("font.face.uri", false),
      peg$c171 = "foreignObject",
      peg$c172 = peg$literalExpectation("foreignObject", false),
      peg$c173 = "missing.glyph",
      peg$c174 = peg$literalExpectation("missing.glyph", false),
      peg$c175 = "altGlyphItem",
      peg$c176 = peg$literalExpectation("altGlyphItem", false),
      peg$c177 = "animateColor",
      peg$c178 = peg$literalExpectation("animateColor", false),
      peg$c179 = "feMorphology",
      peg$c180 = peg$literalExpectation("feMorphology", false),
      peg$c181 = "fePointLight",
      peg$c182 = peg$literalExpectation("fePointLight", false),
      peg$c183 = "feTurbulence",
      peg$c184 = peg$literalExpectation("feTurbulence", false),
      peg$c185 = "altGlyphDef",
      peg$c186 = peg$literalExpectation("altGlyphDef", false),
      peg$c187 = "feComposite",
      peg$c188 = peg$literalExpectation("feComposite", false),
      peg$c189 = "feMergeNode",
      peg$c190 = peg$literalExpectation("feMergeNode", false),
      peg$c191 = "feSpotLight",
      peg$c192 = peg$literalExpectation("feSpotLight", false),
      peg$c193 = "font.face",
      peg$c194 = peg$literalExpectation("font.face", false),
      peg$c195 = "altGlyph",
      peg$c196 = peg$literalExpectation("altGlyph", false),
      peg$c197 = "clipPath",
      peg$c198 = peg$literalExpectation("clipPath", false),
      peg$c199 = "feOffset",
      peg$c200 = peg$literalExpectation("feOffset", false),
      peg$c201 = "glyphRef",
      peg$c202 = peg$literalExpectation("glyphRef", false),
      peg$c203 = "metadata",
      peg$c204 = peg$literalExpectation("metadata", false),
      peg$c205 = "polyline",
      peg$c206 = peg$literalExpectation("polyline", false),
      peg$c207 = "textPath",
      peg$c208 = peg$literalExpectation("textPath", false),
      peg$c209 = "animate",
      peg$c210 = peg$literalExpectation("animate", false),
      peg$c211 = "ellipse",
      peg$c212 = peg$literalExpectation("ellipse", false),
      peg$c213 = "feBlend",
      peg$c214 = peg$literalExpectation("feBlend", false),
      peg$c215 = "feFlood",
      peg$c216 = peg$literalExpectation("feFlood", false),
      peg$c217 = "feFuncA",
      peg$c218 = peg$literalExpectation("feFuncA", false),
      peg$c219 = "feFuncB",
      peg$c220 = peg$literalExpectation("feFuncB", false),
      peg$c221 = "feFuncG",
      peg$c222 = peg$literalExpectation("feFuncG", false),
      peg$c223 = "feFuncR",
      peg$c224 = peg$literalExpectation("feFuncR", false),
      peg$c225 = "feImage",
      peg$c226 = peg$literalExpectation("feImage", false),
      peg$c227 = "feMerge",
      peg$c228 = peg$literalExpectation("feMerge", false),
      peg$c229 = "pattern",
      peg$c230 = peg$literalExpectation("pattern", false),
      peg$c231 = "polygon",
      peg$c232 = peg$literalExpectation("polygon", false),
      peg$c233 = "circle",
      peg$c234 = peg$literalExpectation("circle", false),
      peg$c235 = "cursor",
      peg$c236 = peg$literalExpectation("cursor", false),
      peg$c237 = "feTile",
      peg$c238 = peg$literalExpectation("feTile", false),
      peg$c239 = "filter",
      peg$c240 = peg$literalExpectation("filter", false),
      peg$c241 = "marker",
      peg$c242 = peg$literalExpectation("marker", false),
      peg$c243 = "script",
      peg$c244 = peg$literalExpectation("script", false),
      peg$c245 = "switch",
      peg$c246 = peg$literalExpectation("switch", false),
      peg$c247 = "symbol",
      peg$c248 = peg$literalExpectation("symbol", false),
      peg$c249 = "glyph",
      peg$c250 = peg$literalExpectation("glyph", false),
      peg$c251 = "hkern",
      peg$c252 = peg$literalExpectation("hkern", false),
      peg$c253 = "image",
      peg$c254 = peg$literalExpectation("image", false),
      peg$c255 = "mpath",
      peg$c256 = peg$literalExpectation("mpath", false),
      peg$c257 = "style",
      peg$c258 = peg$literalExpectation("style", false),
      peg$c259 = "title",
      peg$c260 = peg$literalExpectation("title", false),
      peg$c261 = "tspan",
      peg$c262 = peg$literalExpectation("tspan", false),
      peg$c263 = "vkern",
      peg$c264 = peg$literalExpectation("vkern", false),
      peg$c265 = "defs",
      peg$c266 = peg$literalExpectation("defs", false),
      peg$c267 = "desc",
      peg$c268 = peg$literalExpectation("desc", false),
      peg$c269 = "font",
      peg$c270 = peg$literalExpectation("font", false),
      peg$c271 = "line",
      peg$c272 = peg$literalExpectation("line", false),
      peg$c273 = "mask",
      peg$c274 = peg$literalExpectation("mask", false),
      peg$c275 = "path",
      peg$c276 = peg$literalExpectation("path", false),
      peg$c277 = "rect",
      peg$c278 = peg$literalExpectation("rect", false),
      peg$c279 = "stop",
      peg$c280 = peg$literalExpectation("stop", false),
      peg$c281 = "text",
      peg$c282 = peg$literalExpectation("text", false),
      peg$c283 = "tref",
      peg$c284 = peg$literalExpectation("tref", false),
      peg$c285 = "view",
      peg$c286 = peg$literalExpectation("view", false),
      peg$c287 = "svgR",
      peg$c288 = peg$literalExpectation("svgR", false),
      peg$c289 = "set",
      peg$c290 = peg$literalExpectation("set", false),
      peg$c291 = "svg",
      peg$c292 = peg$literalExpectation("svg", false),
      peg$c293 = "use",
      peg$c294 = peg$literalExpectation("use", false),
      peg$c295 = "a",
      peg$c296 = peg$literalExpectation("a", false),
      peg$c297 = "g",
      peg$c298 = peg$literalExpectation("g", false),
      peg$c299 = function(head, tail) {   
          var result =tail;
          return result;
      },
      peg$c300 = /^[0-9]/,
      peg$c301 = peg$classExpectation([["0", "9"]], false, false),
      peg$c302 = /^[Ll]/,
      peg$c303 = peg$classExpectation(["L", "l"], false, false),
      peg$c304 = "E",
      peg$c305 = peg$literalExpectation("E", false),
      peg$c306 = "e",
      peg$c307 = peg$literalExpectation("e", false),
      peg$c308 = "i",
      peg$c309 = peg$literalExpectation("i", false),
      peg$c310 = "0",
      peg$c311 = peg$literalExpectation("0", false),
      peg$c312 = "x",
      peg$c313 = peg$literalExpectation("x", false),
      peg$c314 = "X",
      peg$c315 = peg$literalExpectation("X", false),
      peg$c316 = /^[a-f]/,
      peg$c317 = peg$classExpectation([["a", "f"]], false, false),
      peg$c318 = /^[A-F]/,
      peg$c319 = peg$classExpectation([["A", "F"]], false, false),
      peg$c320 = "\\",
      peg$c321 = peg$literalExpectation("\\", false),
      peg$c322 = /^[0-3]/,
      peg$c323 = peg$classExpectation([["0", "3"]], false, false),
      peg$c324 = /^[0-7]/,
      peg$c325 = peg$classExpectation([["0", "7"]], false, false),
      peg$c326 = "u",
      peg$c327 = peg$literalExpectation("u", false),
      peg$c328 = /^[abtnfrv"'\\]/,
      peg$c329 = peg$classExpectation(["a", "b", "t", "n", "f", "r", "v", "\"", "'", "\\"], false, false),
      peg$c330 = "\"",
      peg$c331 = peg$literalExpectation("\"", false),
      peg$c332 = "'",
      peg$c333 = peg$literalExpectation("'", false),
      peg$c334 = /^["]/,
      peg$c335 = peg$classExpectation(["\""], false, false),
      peg$c336 = /^[']/,
      peg$c337 = peg$classExpectation(["'"], false, false),
      peg$c338 = "#",
      peg$c339 = peg$literalExpectation("#", false),

      peg$currPos          = 0,
      peg$savedPos         = 0,
      peg$posDetailsCache  = [{ line: 1, column: 1 }],
      peg$maxFailPos       = 0,
      peg$maxFailExpected  = [],
      peg$silentFails      = 0,

      peg$result;

  if ("startRule" in options) {
    if (!(options.startRule in peg$startRuleFunctions)) {
      throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
    }

    peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
  }

  function text() {
    return input.substring(peg$savedPos, peg$currPos);
  }

  function location() {
    return peg$computeLocation(peg$savedPos, peg$currPos);
  }

  function expected(description, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildStructuredError(
      [peg$otherExpectation(description)],
      input.substring(peg$savedPos, peg$currPos),
      location
    );
  }

  function error(message, location) {
    location = location !== void 0 ? location : peg$computeLocation(peg$savedPos, peg$currPos)

    throw peg$buildSimpleError(message, location);
  }

  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: text, ignoreCase: ignoreCase };
  }

  function peg$classExpectation(parts, inverted, ignoreCase) {
    return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
  }

  function peg$anyExpectation() {
    return { type: "any" };
  }

  function peg$endExpectation() {
    return { type: "end" };
  }

  function peg$otherExpectation(description) {
    return { type: "other", description: description };
  }

  function peg$computePosDetails(pos) {
    var details = peg$posDetailsCache[pos], p;

    if (details) {
      return details;
    } else {
      p = pos - 1;
      while (!peg$posDetailsCache[p]) {
        p--;
      }

      details = peg$posDetailsCache[p];
      details = {
        line:   details.line,
        column: details.column
      };

      while (p < pos) {
        if (input.charCodeAt(p) === 10) {
          details.line++;
          details.column = 1;
        } else {
          details.column++;
        }

        p++;
      }

      peg$posDetailsCache[pos] = details;
      return details;
    }
  }

  function peg$computeLocation(startPos, endPos) {
    var startPosDetails = peg$computePosDetails(startPos),
        endPosDetails   = peg$computePosDetails(endPos);

    return {
      start: {
        offset: startPos,
        line:   startPosDetails.line,
        column: startPosDetails.column
      },
      end: {
        offset: endPos,
        line:   endPosDetails.line,
        column: endPosDetails.column
      }
    };
  }

  function peg$fail(expected) {
    if (peg$currPos < peg$maxFailPos) { return; }

    if (peg$currPos > peg$maxFailPos) {
      peg$maxFailPos = peg$currPos;
      peg$maxFailExpected = [];
    }

    peg$maxFailExpected.push(expected);
  }

  function peg$buildSimpleError(message, location) {
    return new peg$SyntaxError(message, null, null, location);
  }

  function peg$buildStructuredError(expected, found, location) {
    return new peg$SyntaxError(
      peg$SyntaxError.buildMessage(expected, found),
      expected,
      found,
      location
    );
  }

  function peg$parsestart() {
    var s0;

    s0 = peg$parseprogramme();

    return s0;
  }

  function peg$parseNL() {
    var s0, s1, s2;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 13) {
      s1 = peg$c0;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c1); }
    }
    if (s1 === peg$FAILED) {
      s1 = null;
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 10) {
        s2 = peg$c2;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c3); }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseEOF() {
    var s0, s1;

    s0 = peg$currPos;
    peg$silentFails++;
    if (input.length > peg$currPos) {
      s1 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c4); }
    }
    peg$silentFails--;
    if (s1 === peg$FAILED) {
      s0 = void 0;
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseexpr_seperator() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parsecomment();
    if (s1 !== peg$FAILED) {
      s2 = peg$parseNL();
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseNL();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 59) {
          s0 = peg$c5;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c6); }
        }
      }
    }

    return s0;
  }

  function peg$parseexpr_list() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

    s0 = peg$currPos;
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      s3 = peg$parseexpr();
      if (s3 !== peg$FAILED) {
        s4 = [];
        s5 = peg$currPos;
        s6 = peg$parse___();
        if (s6 !== peg$FAILED) {
          s7 = peg$parseexpr_seperator();
          if (s7 !== peg$FAILED) {
            s8 = peg$parse_();
            if (s8 !== peg$FAILED) {
              s9 = peg$parseexpr();
              if (s9 !== peg$FAILED) {
                s6 = [s6, s7, s8, s9];
                s5 = s6;
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        } else {
          peg$currPos = s5;
          s5 = peg$FAILED;
        }
        while (s5 !== peg$FAILED) {
          s4.push(s5);
          s5 = peg$currPos;
          s6 = peg$parse___();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseexpr_seperator();
            if (s7 !== peg$FAILED) {
              s8 = peg$parse_();
              if (s8 !== peg$FAILED) {
                s9 = peg$parseexpr();
                if (s9 !== peg$FAILED) {
                  s6 = [s6, s7, s8, s9];
                  s5 = s6;
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseprogramme() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseexpr_list();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseEOF();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseexpr() {
    var s0, s1, s2, s3;

    s0 = peg$parsesvgRCall();
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s2 = peg$c7;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse___();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsebinary_expr();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parseatomic_expr() {
    var s0;

    s0 = peg$parseID();
    if (s0 === peg$FAILED) {
      s0 = peg$parseSTRINGLITERAL();
      if (s0 === peg$FAILED) {
        s0 = peg$parseHEX();
        if (s0 === peg$FAILED) {
          s0 = peg$parseCOMPLEX();
          if (s0 === peg$FAILED) {
            s0 = peg$parseFLOAT();
            if (s0 === peg$FAILED) {
              s0 = peg$parseINT();
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c9) {
                  s0 = peg$c9;
                  peg$currPos += 4;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c10); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c11) {
                    s0 = peg$c11;
                    peg$currPos += 2;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c12); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 3) === peg$c13) {
                      s0 = peg$c13;
                      peg$currPos += 3;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c14); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 3) === peg$c15) {
                        s0 = peg$c15;
                        peg$currPos += 3;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c16); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 4) === peg$c17) {
                          s0 = peg$c17;
                          peg$currPos += 4;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c18); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 5) === peg$c19) {
                            s0 = peg$c19;
                            peg$currPos += 5;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c20); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 4) === peg$c21) {
                              s0 = peg$c21;
                              peg$currPos += 4;
                            } else {
                              s0 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c22); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 5) === peg$c23) {
                                s0 = peg$c23;
                                peg$currPos += 5;
                              } else {
                                s0 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c24); }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseleft_token_expr() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 123) {
      s1 = peg$c25;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c26); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseexpr_list();
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 125) {
              s5 = peg$c27;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c28); }
            }
            if (s5 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4, s5];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c29) {
        s1 = peg$c29;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse___();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 40) {
            s3 = peg$c31;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c32); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpr();
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 41) {
                    s7 = peg$c33;
                    peg$currPos++;
                  } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c34); }
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parse_();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseexpr();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parse___();
                        if (s10 !== peg$FAILED) {
                          if (input.substr(peg$currPos, 4) === peg$c35) {
                            s11 = peg$c35;
                            peg$currPos += 4;
                          } else {
                            s11 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c36); }
                          }
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parse_();
                            if (s12 !== peg$FAILED) {
                              s13 = peg$parseexpr();
                              if (s13 !== peg$FAILED) {
                                s1 = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13];
                                s0 = s1;
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c29) {
          s1 = peg$c29;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c30); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parse___();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
              s3 = peg$c31;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c32); }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parseexpr();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse_();
                  if (s6 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 41) {
                      s7 = peg$c33;
                      peg$currPos++;
                    } else {
                      s7 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c34); }
                    }
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parse_();
                      if (s8 !== peg$FAILED) {
                        s9 = peg$parseexpr();
                        if (s9 !== peg$FAILED) {
                          s1 = [s1, s2, s3, s4, s5, s6, s7, s8, s9];
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 3) === peg$c37) {
            s1 = peg$c37;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse___();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 40) {
                s3 = peg$c31;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c32); }
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parseID();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (s6 !== peg$FAILED) {
                      if (input.substr(peg$currPos, 2) === peg$c39) {
                        s7 = peg$c39;
                        peg$currPos += 2;
                      } else {
                        s7 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c40); }
                      }
                      if (s7 !== peg$FAILED) {
                        s8 = peg$parse_();
                        if (s8 !== peg$FAILED) {
                          s9 = peg$parseexpr();
                          if (s9 !== peg$FAILED) {
                            s10 = peg$parse_();
                            if (s10 !== peg$FAILED) {
                              if (input.charCodeAt(peg$currPos) === 41) {
                                s11 = peg$c33;
                                peg$currPos++;
                              } else {
                                s11 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c34); }
                              }
                              if (s11 !== peg$FAILED) {
                                s12 = peg$parse_();
                                if (s12 !== peg$FAILED) {
                                  s13 = peg$parseexpr();
                                  if (s13 !== peg$FAILED) {
                                    s1 = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13];
                                    s0 = s1;
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 5) === peg$c41) {
              s1 = peg$c41;
              peg$currPos += 5;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c42); }
            }
            if (s1 !== peg$FAILED) {
              s2 = peg$parse___();
              if (s2 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 40) {
                  s3 = peg$c31;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
                }
                if (s3 !== peg$FAILED) {
                  s4 = peg$parse_();
                  if (s4 !== peg$FAILED) {
                    s5 = peg$parseexpr();
                    if (s5 !== peg$FAILED) {
                      s6 = peg$parse_();
                      if (s6 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 41) {
                          s7 = peg$c33;
                          peg$currPos++;
                        } else {
                          s7 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c34); }
                        }
                        if (s7 !== peg$FAILED) {
                          s8 = peg$parse_();
                          if (s8 !== peg$FAILED) {
                            s9 = peg$parseexpr();
                            if (s9 !== peg$FAILED) {
                              s1 = [s1, s2, s3, s4, s5, s6, s7, s8, s9];
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 6) === peg$c43) {
                s1 = peg$c43;
                peg$currPos += 6;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c44); }
              }
              if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseexpr();
                  if (s3 !== peg$FAILED) {
                    s1 = [s1, s2, s3];
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 40) {
                  s1 = peg$c31;
                  peg$currPos++;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c32); }
                }
                if (s1 !== peg$FAILED) {
                  s2 = peg$parse_();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parseexpr();
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parse_();
                      if (s4 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 41) {
                          s5 = peg$c33;
                          peg$currPos++;
                        } else {
                          s5 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c34); }
                        }
                        if (s5 !== peg$FAILED) {
                          s1 = [s1, s2, s3, s4, s5];
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.substr(peg$currPos, 8) === peg$c45) {
                    s1 = peg$c45;
                    peg$currPos += 8;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c46); }
                  }
                  if (s1 !== peg$FAILED) {
                    s2 = peg$parse___();
                    if (s2 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 40) {
                        s3 = peg$c31;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c32); }
                      }
                      if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                          s5 = peg$parseformals();
                          if (s5 === peg$FAILED) {
                            s5 = null;
                          }
                          if (s5 !== peg$FAILED) {
                            s6 = peg$parse_();
                            if (s6 !== peg$FAILED) {
                              if (input.charCodeAt(peg$currPos) === 41) {
                                s7 = peg$c33;
                                peg$currPos++;
                              } else {
                                s7 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c34); }
                              }
                              if (s7 !== peg$FAILED) {
                                s8 = peg$parse_();
                                if (s8 !== peg$FAILED) {
                                  s9 = peg$parseexpr();
                                  if (s9 !== peg$FAILED) {
                                    s1 = [s1, s2, s3, s4, s5, s6, s7, s8, s9];
                                    s0 = s1;
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                  if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 43) {
                      s1 = peg$c47;
                      peg$currPos++;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c48); }
                    }
                    if (s1 === peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 45) {
                        s1 = peg$c49;
                        peg$currPos++;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c50); }
                      }
                      if (s1 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 126) {
                          s1 = peg$c51;
                          peg$currPos++;
                        } else {
                          s1 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c52); }
                        }
                      }
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parse_();
                      if (s2 !== peg$FAILED) {
                        s3 = peg$parseexpr();
                        if (s3 !== peg$FAILED) {
                          s1 = [s1, s2, s3];
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseformal() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseID();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse___();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c53;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseexpr();
            if (s5 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4, s5];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseID();
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c55) {
          s0 = peg$c55;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c56); }
        }
      }
    }

    return s0;
  }

  function peg$parseformalCombo1() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s1 = peg$c57;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c58); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseformal();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseformalCombo2() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parse_();
    if (s2 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 44) {
        s3 = peg$c57;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }
      if (s3 === peg$FAILED) {
        s3 = peg$parseformal();
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c59();
    }
    s0 = s1;

    return s0;
  }

  function peg$parseformals() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseformal();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse___();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseformalCombo1();
        if (s5 === peg$FAILED) {
          s5 = peg$parseformalCombo2();
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse___();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseformalCombo1();
          if (s5 === peg$FAILED) {
            s5 = peg$parseformalCombo2();
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseparameter() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseID();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse___();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c53;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseexpr();
            if (s5 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4, s5];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseexpr();
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c55) {
          s0 = peg$c55;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c56); }
        }
      }
    }

    return s0;
  }

  function peg$parseparamCombo1() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s1 = peg$c57;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c58); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseparameter();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseparamCombo2() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$currPos;
    s2 = peg$parse_();
    if (s2 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 44) {
        s3 = peg$c57;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }
      if (s3 === peg$FAILED) {
        s3 = peg$parseparameter();
      }
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      peg$savedPos = s0;
      s1 = peg$c60();
    }
    s0 = s1;

    return s0;
  }

  function peg$parseparameters() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseparameter();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse___();
      if (s4 !== peg$FAILED) {
        s5 = peg$parseparamCombo1();
        if (s5 === peg$FAILED) {
          s5 = peg$parseparamCombo2();
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse___();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseparamCombo1();
          if (s5 === peg$FAILED) {
            s5 = peg$parseparamCombo2();
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseslist_expr() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = peg$parse___();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 91) {
        s2 = peg$c61;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesublist();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s6 = peg$c63;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c64); }
              }
              if (s6 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4, s5, s6];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsedlist_expr() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = peg$parse___();
    if (s1 !== peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c65) {
        s2 = peg$c65;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesublist();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c67) {
                s6 = peg$c67;
                peg$currPos += 2;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c68); }
              }
              if (s6 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4, s5, s6];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsecall_expr() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 40) {
      s1 = peg$c31;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c32); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parse_();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseparameters();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c33;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c34); }
            }
            if (s5 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4, s5];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsecomposite_expr() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseleft_token_expr();
    if (s1 === peg$FAILED) {
      s1 = peg$parseatomic_expr();
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$currPos;
      peg$silentFails++;
      s5 = peg$parseexpr_seperator();
      peg$silentFails--;
      if (s5 === peg$FAILED) {
        s4 = void 0;
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      if (s4 !== peg$FAILED) {
        s5 = peg$parsedlist_expr();
        if (s5 === peg$FAILED) {
          s5 = peg$parseslist_expr();
          if (s5 === peg$FAILED) {
            s5 = peg$parsecall_expr();
          }
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parseexpr_seperator();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsedlist_expr();
          if (s5 === peg$FAILED) {
            s5 = peg$parseslist_expr();
            if (s5 === peg$FAILED) {
              s5 = peg$parsecall_expr();
            }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesvgRCall() {
    var s0, s1, s2, s3, s4, s5, s6;

    s0 = peg$currPos;
    s1 = peg$parsekeySVGR();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 40) {
        s2 = peg$c31;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c32); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesvgRparameters();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s6 = peg$c33;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c34); }
              }
              if (s6 === peg$FAILED) {
                s6 = peg$parseEOF();
              }
              if (s6 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c69(s1, s4, s6);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesvgRNamedParam() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parseID();
    if (s1 !== peg$FAILED) {
      s2 = peg$parse___();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
          s3 = peg$c53;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseexpr();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c70(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesvgRUnnamedParam() {
    var s0, s1;

    s0 = peg$parsesvgRCall();
    if (s0 === peg$FAILED) {
      s0 = peg$parseexpr();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 3) === peg$c55) {
          s1 = peg$c55;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c56); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c71();
        }
        s0 = s1;
      }
    }

    return s0;
  }

  function peg$parsesvgRparameter() {
    var s0;

    s0 = peg$parsesvgRNamedParam();
    if (s0 === peg$FAILED) {
      s0 = peg$parsesvgRUnnamedParam();
    }

    return s0;
  }

  function peg$parsesvgRparamCombo1() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s2 = peg$c57;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c58); }
    }
    if (s2 !== peg$FAILED) {
      s3 = peg$parse_();
      if (s3 !== peg$FAILED) {
        s2 = [s2, s3];
        s1 = s2;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parsesvgRparameter();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c72(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesvgRparamCombo2() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 44) {
        s2 = peg$c57;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }
      if (s2 === peg$FAILED) {
        s2 = peg$parsesvgRparameter();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c73(s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesvgRparamCombo12() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parse___();
    if (s1 !== peg$FAILED) {
      s2 = peg$parsesvgRparamCombo1();
      if (s2 === peg$FAILED) {
        s2 = peg$parsesvgRparamCombo2();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c74(s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsesvgRparameters() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsesvgRparameter();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parsesvgRparamCombo12();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parsesvgRparamCombo12();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c75(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseOP_SYMBOL() {
    var s0;

    if (peg$c76.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c77); }
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseLETTER();
    }

    return s0;
  }

  function peg$parsebin_op() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 37) {
      s1 = peg$c78;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c79); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseOP_SYMBOL();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseOP_SYMBOL();
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 37) {
          s3 = peg$c78;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c79); }
        }
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 3) === peg$c80) {
        s0 = peg$c80;
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c81); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c82) {
          s0 = peg$c82;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c83); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c84) {
            s0 = peg$c84;
            peg$currPos += 3;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c85); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c86) {
              s0 = peg$c86;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c87); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c88) {
                s0 = peg$c88;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c89); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c90) {
                  s0 = peg$c90;
                  peg$currPos += 2;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c91); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 2) === peg$c92) {
                    s0 = peg$c92;
                    peg$currPos += 2;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c93); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c94) {
                      s0 = peg$c94;
                      peg$currPos += 2;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c95); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 2) === peg$c96) {
                        s0 = peg$c96;
                        peg$currPos += 2;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c97); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 2) === peg$c98) {
                          s0 = peg$c98;
                          peg$currPos += 2;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c99); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 2) === peg$c100) {
                            s0 = peg$c100;
                            peg$currPos += 2;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c101); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 2) === peg$c102) {
                              s0 = peg$c102;
                              peg$currPos += 2;
                            } else {
                              s0 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c103); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 2) === peg$c104) {
                                s0 = peg$c104;
                                peg$currPos += 2;
                              } else {
                                s0 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c105); }
                              }
                              if (s0 === peg$FAILED) {
                                if (input.charCodeAt(peg$currPos) === 36) {
                                  s0 = peg$c106;
                                  peg$currPos++;
                                } else {
                                  s0 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c107); }
                                }
                                if (s0 === peg$FAILED) {
                                  if (input.charCodeAt(peg$currPos) === 64) {
                                    s0 = peg$c108;
                                    peg$currPos++;
                                  } else {
                                    s0 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c109); }
                                  }
                                  if (s0 === peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 94) {
                                      s0 = peg$c110;
                                      peg$currPos++;
                                    } else {
                                      s0 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c111); }
                                    }
                                    if (s0 === peg$FAILED) {
                                      if (input.charCodeAt(peg$currPos) === 58) {
                                        s0 = peg$c112;
                                        peg$currPos++;
                                      } else {
                                        s0 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c113); }
                                      }
                                      if (s0 === peg$FAILED) {
                                        if (input.charCodeAt(peg$currPos) === 42) {
                                          s0 = peg$c114;
                                          peg$currPos++;
                                        } else {
                                          s0 = peg$FAILED;
                                          if (peg$silentFails === 0) { peg$fail(peg$c115); }
                                        }
                                        if (s0 === peg$FAILED) {
                                          if (input.charCodeAt(peg$currPos) === 47) {
                                            s0 = peg$c116;
                                            peg$currPos++;
                                          } else {
                                            s0 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c117); }
                                          }
                                          if (s0 === peg$FAILED) {
                                            if (input.charCodeAt(peg$currPos) === 43) {
                                              s0 = peg$c47;
                                              peg$currPos++;
                                            } else {
                                              s0 = peg$FAILED;
                                              if (peg$silentFails === 0) { peg$fail(peg$c48); }
                                            }
                                            if (s0 === peg$FAILED) {
                                              if (input.charCodeAt(peg$currPos) === 45) {
                                                s0 = peg$c49;
                                                peg$currPos++;
                                              } else {
                                                s0 = peg$FAILED;
                                                if (peg$silentFails === 0) { peg$fail(peg$c50); }
                                              }
                                              if (s0 === peg$FAILED) {
                                                if (input.charCodeAt(peg$currPos) === 62) {
                                                  s0 = peg$c118;
                                                  peg$currPos++;
                                                } else {
                                                  s0 = peg$FAILED;
                                                  if (peg$silentFails === 0) { peg$fail(peg$c119); }
                                                }
                                                if (s0 === peg$FAILED) {
                                                  if (input.charCodeAt(peg$currPos) === 60) {
                                                    s0 = peg$c120;
                                                    peg$currPos++;
                                                  } else {
                                                    s0 = peg$FAILED;
                                                    if (peg$silentFails === 0) { peg$fail(peg$c121); }
                                                  }
                                                  if (s0 === peg$FAILED) {
                                                    if (input.charCodeAt(peg$currPos) === 38) {
                                                      s0 = peg$c122;
                                                      peg$currPos++;
                                                    } else {
                                                      s0 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c123); }
                                                    }
                                                    if (s0 === peg$FAILED) {
                                                      if (input.charCodeAt(peg$currPos) === 124) {
                                                        s0 = peg$c124;
                                                        peg$currPos++;
                                                      } else {
                                                        s0 = peg$FAILED;
                                                        if (peg$silentFails === 0) { peg$fail(peg$c125); }
                                                      }
                                                      if (s0 === peg$FAILED) {
                                                        if (input.charCodeAt(peg$currPos) === 126) {
                                                          s0 = peg$c51;
                                                          peg$currPos++;
                                                        } else {
                                                          s0 = peg$FAILED;
                                                          if (peg$silentFails === 0) { peg$fail(peg$c52); }
                                                        }
                                                        if (s0 === peg$FAILED) {
                                                          if (input.charCodeAt(peg$currPos) === 61) {
                                                            s0 = peg$c53;
                                                            peg$currPos++;
                                                          } else {
                                                            s0 = peg$FAILED;
                                                            if (peg$silentFails === 0) { peg$fail(peg$c54); }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parsebinary_expr() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    s1 = peg$parsecomposite_expr();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parse___();
      if (s4 !== peg$FAILED) {
        s5 = peg$parsebin_op();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          if (s6 !== peg$FAILED) {
            s7 = peg$parseexpr();
            if (s7 !== peg$FAILED) {
              s8 = peg$parse___();
              if (s8 !== peg$FAILED) {
                s4 = [s4, s5, s6, s7, s8];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$parse___();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsebin_op();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            if (s6 !== peg$FAILED) {
              s7 = peg$parseexpr();
              if (s7 !== peg$FAILED) {
                s8 = peg$parse___();
                if (s8 !== peg$FAILED) {
                  s4 = [s4, s5, s6, s7, s8];
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$FAILED;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseLineTerminator() {
    var s0;

    if (peg$c126.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c127); }
    }

    return s0;
  }

  function peg$parseWS() {
    var s0;

    if (peg$c128.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c129); }
    }

    return s0;
  }

  function peg$parse_() {
    var s0, s1;

    s0 = [];
    s1 = peg$parseWS();
    if (s1 === peg$FAILED) {
      s1 = peg$parseLineTerminator();
      if (s1 === peg$FAILED) {
        s1 = peg$parsecomment();
      }
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      s1 = peg$parseWS();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLineTerminator();
        if (s1 === peg$FAILED) {
          s1 = peg$parsecomment();
        }
      }
    }

    return s0;
  }

  function peg$parse__() {
    var s0, s1;

    s0 = [];
    s1 = peg$parseWS();
    if (s1 === peg$FAILED) {
      s1 = peg$parsecomment();
    }
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      s1 = peg$parseWS();
      if (s1 === peg$FAILED) {
        s1 = peg$parsecomment();
      }
    }

    return s0;
  }

  function peg$parse___() {
    var s0, s1;

    s0 = [];
    s1 = peg$parseWS();
    while (s1 !== peg$FAILED) {
      s0.push(s1);
      s1 = peg$parseWS();
    }

    return s0;
  }

  function peg$parseLETTER() {
    var s0;

    if (peg$c130.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c131); }
    }

    return s0;
  }

  function peg$parsekeyWord() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.substr(peg$currPos, 8) === peg$c45) {
      s1 = peg$c45;
      peg$currPos += 8;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c46); }
    }
    if (s1 === peg$FAILED) {
      if (input.substr(peg$currPos, 2) === peg$c29) {
        s1 = peg$c29;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 3) === peg$c37) {
          s1 = peg$c37;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c38); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c41) {
            s1 = peg$c41;
            peg$currPos += 5;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c42); }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 6) === peg$c43) {
              s1 = peg$c43;
              peg$currPos += 6;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c44); }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c21) {
                s1 = peg$c21;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c22); }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c39) {
                  s1 = peg$c39;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c40); }
                }
              }
            }
          }
        }
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parseDIGIT();
      if (s3 === peg$FAILED) {
        s3 = peg$parseLETTER();
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseidword() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parseLETTER();
    if (s1 === peg$FAILED) {
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s2 = peg$c132;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c133); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseLETTER();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 95) {
            s3 = peg$c134;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c135); }
          }
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 46) {
              s3 = peg$c132;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c133); }
            }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c132;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c133); }
        }
      }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseLETTER();
      if (s3 === peg$FAILED) {
        s3 = peg$parseDIGIT();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 95) {
            s3 = peg$c134;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c135); }
          }
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 46) {
              s3 = peg$c132;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c133); }
            }
          }
        }
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseLETTER();
        if (s3 === peg$FAILED) {
          s3 = peg$parseDIGIT();
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 95) {
              s3 = peg$c134;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c135); }
            }
            if (s3 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 46) {
                s3 = peg$c132;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c133); }
              }
            }
          }
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c136(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsekeySVGR() {
    var s0;

    if (input.substr(peg$currPos, 19) === peg$c137) {
      s0 = peg$c137;
      peg$currPos += 19;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c138); }
    }
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 18) === peg$c139) {
        s0 = peg$c139;
        peg$currPos += 18;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c140); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 17) === peg$c141) {
          s0 = peg$c141;
          peg$currPos += 17;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c142); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 17) === peg$c143) {
            s0 = peg$c143;
            peg$currPos += 17;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c144); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 16) === peg$c145) {
              s0 = peg$c145;
              peg$currPos += 16;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c146); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 16) === peg$c147) {
                s0 = peg$c147;
                peg$currPos += 16;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c148); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 16) === peg$c149) {
                  s0 = peg$c149;
                  peg$currPos += 16;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c150); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 14) === peg$c151) {
                    s0 = peg$c151;
                    peg$currPos += 14;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c152); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 14) === peg$c153) {
                      s0 = peg$c153;
                      peg$currPos += 14;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c154); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 14) === peg$c155) {
                        s0 = peg$c155;
                        peg$currPos += 14;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c156); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 14) === peg$c157) {
                          s0 = peg$c157;
                          peg$currPos += 14;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c158); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 14) === peg$c159) {
                            s0 = peg$c159;
                            peg$currPos += 14;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c160); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 13) === peg$c161) {
                              s0 = peg$c161;
                              peg$currPos += 13;
                            } else {
                              s0 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c162); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 13) === peg$c163) {
                                s0 = peg$c163;
                                peg$currPos += 13;
                              } else {
                                s0 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c164); }
                              }
                              if (s0 === peg$FAILED) {
                                if (input.substr(peg$currPos, 13) === peg$c165) {
                                  s0 = peg$c165;
                                  peg$currPos += 13;
                                } else {
                                  s0 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c166); }
                                }
                                if (s0 === peg$FAILED) {
                                  if (input.substr(peg$currPos, 13) === peg$c167) {
                                    s0 = peg$c167;
                                    peg$currPos += 13;
                                  } else {
                                    s0 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c168); }
                                  }
                                  if (s0 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 13) === peg$c169) {
                                      s0 = peg$c169;
                                      peg$currPos += 13;
                                    } else {
                                      s0 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c170); }
                                    }
                                    if (s0 === peg$FAILED) {
                                      if (input.substr(peg$currPos, 13) === peg$c171) {
                                        s0 = peg$c171;
                                        peg$currPos += 13;
                                      } else {
                                        s0 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c172); }
                                      }
                                      if (s0 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 13) === peg$c173) {
                                          s0 = peg$c173;
                                          peg$currPos += 13;
                                        } else {
                                          s0 = peg$FAILED;
                                          if (peg$silentFails === 0) { peg$fail(peg$c174); }
                                        }
                                        if (s0 === peg$FAILED) {
                                          if (input.substr(peg$currPos, 12) === peg$c175) {
                                            s0 = peg$c175;
                                            peg$currPos += 12;
                                          } else {
                                            s0 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c176); }
                                          }
                                          if (s0 === peg$FAILED) {
                                            if (input.substr(peg$currPos, 12) === peg$c177) {
                                              s0 = peg$c177;
                                              peg$currPos += 12;
                                            } else {
                                              s0 = peg$FAILED;
                                              if (peg$silentFails === 0) { peg$fail(peg$c178); }
                                            }
                                            if (s0 === peg$FAILED) {
                                              if (input.substr(peg$currPos, 12) === peg$c179) {
                                                s0 = peg$c179;
                                                peg$currPos += 12;
                                              } else {
                                                s0 = peg$FAILED;
                                                if (peg$silentFails === 0) { peg$fail(peg$c180); }
                                              }
                                              if (s0 === peg$FAILED) {
                                                if (input.substr(peg$currPos, 12) === peg$c181) {
                                                  s0 = peg$c181;
                                                  peg$currPos += 12;
                                                } else {
                                                  s0 = peg$FAILED;
                                                  if (peg$silentFails === 0) { peg$fail(peg$c182); }
                                                }
                                                if (s0 === peg$FAILED) {
                                                  if (input.substr(peg$currPos, 12) === peg$c183) {
                                                    s0 = peg$c183;
                                                    peg$currPos += 12;
                                                  } else {
                                                    s0 = peg$FAILED;
                                                    if (peg$silentFails === 0) { peg$fail(peg$c184); }
                                                  }
                                                  if (s0 === peg$FAILED) {
                                                    if (input.substr(peg$currPos, 11) === peg$c185) {
                                                      s0 = peg$c185;
                                                      peg$currPos += 11;
                                                    } else {
                                                      s0 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c186); }
                                                    }
                                                    if (s0 === peg$FAILED) {
                                                      if (input.substr(peg$currPos, 11) === peg$c187) {
                                                        s0 = peg$c187;
                                                        peg$currPos += 11;
                                                      } else {
                                                        s0 = peg$FAILED;
                                                        if (peg$silentFails === 0) { peg$fail(peg$c188); }
                                                      }
                                                      if (s0 === peg$FAILED) {
                                                        if (input.substr(peg$currPos, 11) === peg$c189) {
                                                          s0 = peg$c189;
                                                          peg$currPos += 11;
                                                        } else {
                                                          s0 = peg$FAILED;
                                                          if (peg$silentFails === 0) { peg$fail(peg$c190); }
                                                        }
                                                        if (s0 === peg$FAILED) {
                                                          if (input.substr(peg$currPos, 11) === peg$c191) {
                                                            s0 = peg$c191;
                                                            peg$currPos += 11;
                                                          } else {
                                                            s0 = peg$FAILED;
                                                            if (peg$silentFails === 0) { peg$fail(peg$c192); }
                                                          }
                                                          if (s0 === peg$FAILED) {
                                                            if (input.substr(peg$currPos, 9) === peg$c193) {
                                                              s0 = peg$c193;
                                                              peg$currPos += 9;
                                                            } else {
                                                              s0 = peg$FAILED;
                                                              if (peg$silentFails === 0) { peg$fail(peg$c194); }
                                                            }
                                                            if (s0 === peg$FAILED) {
                                                              if (input.substr(peg$currPos, 8) === peg$c195) {
                                                                s0 = peg$c195;
                                                                peg$currPos += 8;
                                                              } else {
                                                                s0 = peg$FAILED;
                                                                if (peg$silentFails === 0) { peg$fail(peg$c196); }
                                                              }
                                                              if (s0 === peg$FAILED) {
                                                                if (input.substr(peg$currPos, 8) === peg$c197) {
                                                                  s0 = peg$c197;
                                                                  peg$currPos += 8;
                                                                } else {
                                                                  s0 = peg$FAILED;
                                                                  if (peg$silentFails === 0) { peg$fail(peg$c198); }
                                                                }
                                                                if (s0 === peg$FAILED) {
                                                                  if (input.substr(peg$currPos, 8) === peg$c199) {
                                                                    s0 = peg$c199;
                                                                    peg$currPos += 8;
                                                                  } else {
                                                                    s0 = peg$FAILED;
                                                                    if (peg$silentFails === 0) { peg$fail(peg$c200); }
                                                                  }
                                                                  if (s0 === peg$FAILED) {
                                                                    if (input.substr(peg$currPos, 8) === peg$c201) {
                                                                      s0 = peg$c201;
                                                                      peg$currPos += 8;
                                                                    } else {
                                                                      s0 = peg$FAILED;
                                                                      if (peg$silentFails === 0) { peg$fail(peg$c202); }
                                                                    }
                                                                    if (s0 === peg$FAILED) {
                                                                      if (input.substr(peg$currPos, 8) === peg$c203) {
                                                                        s0 = peg$c203;
                                                                        peg$currPos += 8;
                                                                      } else {
                                                                        s0 = peg$FAILED;
                                                                        if (peg$silentFails === 0) { peg$fail(peg$c204); }
                                                                      }
                                                                      if (s0 === peg$FAILED) {
                                                                        if (input.substr(peg$currPos, 8) === peg$c205) {
                                                                          s0 = peg$c205;
                                                                          peg$currPos += 8;
                                                                        } else {
                                                                          s0 = peg$FAILED;
                                                                          if (peg$silentFails === 0) { peg$fail(peg$c206); }
                                                                        }
                                                                        if (s0 === peg$FAILED) {
                                                                          if (input.substr(peg$currPos, 8) === peg$c207) {
                                                                            s0 = peg$c207;
                                                                            peg$currPos += 8;
                                                                          } else {
                                                                            s0 = peg$FAILED;
                                                                            if (peg$silentFails === 0) { peg$fail(peg$c208); }
                                                                          }
                                                                          if (s0 === peg$FAILED) {
                                                                            if (input.substr(peg$currPos, 7) === peg$c209) {
                                                                              s0 = peg$c209;
                                                                              peg$currPos += 7;
                                                                            } else {
                                                                              s0 = peg$FAILED;
                                                                              if (peg$silentFails === 0) { peg$fail(peg$c210); }
                                                                            }
                                                                            if (s0 === peg$FAILED) {
                                                                              if (input.substr(peg$currPos, 7) === peg$c211) {
                                                                                s0 = peg$c211;
                                                                                peg$currPos += 7;
                                                                              } else {
                                                                                s0 = peg$FAILED;
                                                                                if (peg$silentFails === 0) { peg$fail(peg$c212); }
                                                                              }
                                                                              if (s0 === peg$FAILED) {
                                                                                if (input.substr(peg$currPos, 7) === peg$c213) {
                                                                                  s0 = peg$c213;
                                                                                  peg$currPos += 7;
                                                                                } else {
                                                                                  s0 = peg$FAILED;
                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c214); }
                                                                                }
                                                                                if (s0 === peg$FAILED) {
                                                                                  if (input.substr(peg$currPos, 7) === peg$c215) {
                                                                                    s0 = peg$c215;
                                                                                    peg$currPos += 7;
                                                                                  } else {
                                                                                    s0 = peg$FAILED;
                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c216); }
                                                                                  }
                                                                                  if (s0 === peg$FAILED) {
                                                                                    if (input.substr(peg$currPos, 7) === peg$c217) {
                                                                                      s0 = peg$c217;
                                                                                      peg$currPos += 7;
                                                                                    } else {
                                                                                      s0 = peg$FAILED;
                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c218); }
                                                                                    }
                                                                                    if (s0 === peg$FAILED) {
                                                                                      if (input.substr(peg$currPos, 7) === peg$c219) {
                                                                                        s0 = peg$c219;
                                                                                        peg$currPos += 7;
                                                                                      } else {
                                                                                        s0 = peg$FAILED;
                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c220); }
                                                                                      }
                                                                                      if (s0 === peg$FAILED) {
                                                                                        if (input.substr(peg$currPos, 7) === peg$c221) {
                                                                                          s0 = peg$c221;
                                                                                          peg$currPos += 7;
                                                                                        } else {
                                                                                          s0 = peg$FAILED;
                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c222); }
                                                                                        }
                                                                                        if (s0 === peg$FAILED) {
                                                                                          if (input.substr(peg$currPos, 7) === peg$c223) {
                                                                                            s0 = peg$c223;
                                                                                            peg$currPos += 7;
                                                                                          } else {
                                                                                            s0 = peg$FAILED;
                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c224); }
                                                                                          }
                                                                                          if (s0 === peg$FAILED) {
                                                                                            if (input.substr(peg$currPos, 7) === peg$c225) {
                                                                                              s0 = peg$c225;
                                                                                              peg$currPos += 7;
                                                                                            } else {
                                                                                              s0 = peg$FAILED;
                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c226); }
                                                                                            }
                                                                                            if (s0 === peg$FAILED) {
                                                                                              if (input.substr(peg$currPos, 7) === peg$c227) {
                                                                                                s0 = peg$c227;
                                                                                                peg$currPos += 7;
                                                                                              } else {
                                                                                                s0 = peg$FAILED;
                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c228); }
                                                                                              }
                                                                                              if (s0 === peg$FAILED) {
                                                                                                if (input.substr(peg$currPos, 7) === peg$c229) {
                                                                                                  s0 = peg$c229;
                                                                                                  peg$currPos += 7;
                                                                                                } else {
                                                                                                  s0 = peg$FAILED;
                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c230); }
                                                                                                }
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  if (input.substr(peg$currPos, 7) === peg$c231) {
                                                                                                    s0 = peg$c231;
                                                                                                    peg$currPos += 7;
                                                                                                  } else {
                                                                                                    s0 = peg$FAILED;
                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c232); }
                                                                                                  }
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    if (input.substr(peg$currPos, 6) === peg$c233) {
                                                                                                      s0 = peg$c233;
                                                                                                      peg$currPos += 6;
                                                                                                    } else {
                                                                                                      s0 = peg$FAILED;
                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c234); }
                                                                                                    }
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      if (input.substr(peg$currPos, 6) === peg$c235) {
                                                                                                        s0 = peg$c235;
                                                                                                        peg$currPos += 6;
                                                                                                      } else {
                                                                                                        s0 = peg$FAILED;
                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c236); }
                                                                                                      }
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        if (input.substr(peg$currPos, 6) === peg$c237) {
                                                                                                          s0 = peg$c237;
                                                                                                          peg$currPos += 6;
                                                                                                        } else {
                                                                                                          s0 = peg$FAILED;
                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c238); }
                                                                                                        }
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          if (input.substr(peg$currPos, 6) === peg$c239) {
                                                                                                            s0 = peg$c239;
                                                                                                            peg$currPos += 6;
                                                                                                          } else {
                                                                                                            s0 = peg$FAILED;
                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c240); }
                                                                                                          }
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            if (input.substr(peg$currPos, 6) === peg$c241) {
                                                                                                              s0 = peg$c241;
                                                                                                              peg$currPos += 6;
                                                                                                            } else {
                                                                                                              s0 = peg$FAILED;
                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c242); }
                                                                                                            }
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              if (input.substr(peg$currPos, 6) === peg$c243) {
                                                                                                                s0 = peg$c243;
                                                                                                                peg$currPos += 6;
                                                                                                              } else {
                                                                                                                s0 = peg$FAILED;
                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c244); }
                                                                                                              }
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                if (input.substr(peg$currPos, 6) === peg$c245) {
                                                                                                                  s0 = peg$c245;
                                                                                                                  peg$currPos += 6;
                                                                                                                } else {
                                                                                                                  s0 = peg$FAILED;
                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c246); }
                                                                                                                }
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  if (input.substr(peg$currPos, 6) === peg$c247) {
                                                                                                                    s0 = peg$c247;
                                                                                                                    peg$currPos += 6;
                                                                                                                  } else {
                                                                                                                    s0 = peg$FAILED;
                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c248); }
                                                                                                                  }
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    if (input.substr(peg$currPos, 5) === peg$c249) {
                                                                                                                      s0 = peg$c249;
                                                                                                                      peg$currPos += 5;
                                                                                                                    } else {
                                                                                                                      s0 = peg$FAILED;
                                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c250); }
                                                                                                                    }
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      if (input.substr(peg$currPos, 5) === peg$c251) {
                                                                                                                        s0 = peg$c251;
                                                                                                                        peg$currPos += 5;
                                                                                                                      } else {
                                                                                                                        s0 = peg$FAILED;
                                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c252); }
                                                                                                                      }
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        if (input.substr(peg$currPos, 5) === peg$c253) {
                                                                                                                          s0 = peg$c253;
                                                                                                                          peg$currPos += 5;
                                                                                                                        } else {
                                                                                                                          s0 = peg$FAILED;
                                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c254); }
                                                                                                                        }
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          if (input.substr(peg$currPos, 5) === peg$c255) {
                                                                                                                            s0 = peg$c255;
                                                                                                                            peg$currPos += 5;
                                                                                                                          } else {
                                                                                                                            s0 = peg$FAILED;
                                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c256); }
                                                                                                                          }
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            if (input.substr(peg$currPos, 5) === peg$c257) {
                                                                                                                              s0 = peg$c257;
                                                                                                                              peg$currPos += 5;
                                                                                                                            } else {
                                                                                                                              s0 = peg$FAILED;
                                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c258); }
                                                                                                                            }
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              if (input.substr(peg$currPos, 5) === peg$c259) {
                                                                                                                                s0 = peg$c259;
                                                                                                                                peg$currPos += 5;
                                                                                                                              } else {
                                                                                                                                s0 = peg$FAILED;
                                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c260); }
                                                                                                                              }
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                if (input.substr(peg$currPos, 5) === peg$c261) {
                                                                                                                                  s0 = peg$c261;
                                                                                                                                  peg$currPos += 5;
                                                                                                                                } else {
                                                                                                                                  s0 = peg$FAILED;
                                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c262); }
                                                                                                                                }
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  if (input.substr(peg$currPos, 5) === peg$c263) {
                                                                                                                                    s0 = peg$c263;
                                                                                                                                    peg$currPos += 5;
                                                                                                                                  } else {
                                                                                                                                    s0 = peg$FAILED;
                                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c264); }
                                                                                                                                  }
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    if (input.substr(peg$currPos, 4) === peg$c265) {
                                                                                                                                      s0 = peg$c265;
                                                                                                                                      peg$currPos += 4;
                                                                                                                                    } else {
                                                                                                                                      s0 = peg$FAILED;
                                                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c266); }
                                                                                                                                    }
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      if (input.substr(peg$currPos, 4) === peg$c267) {
                                                                                                                                        s0 = peg$c267;
                                                                                                                                        peg$currPos += 4;
                                                                                                                                      } else {
                                                                                                                                        s0 = peg$FAILED;
                                                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c268); }
                                                                                                                                      }
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        if (input.substr(peg$currPos, 4) === peg$c269) {
                                                                                                                                          s0 = peg$c269;
                                                                                                                                          peg$currPos += 4;
                                                                                                                                        } else {
                                                                                                                                          s0 = peg$FAILED;
                                                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c270); }
                                                                                                                                        }
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          if (input.substr(peg$currPos, 4) === peg$c271) {
                                                                                                                                            s0 = peg$c271;
                                                                                                                                            peg$currPos += 4;
                                                                                                                                          } else {
                                                                                                                                            s0 = peg$FAILED;
                                                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c272); }
                                                                                                                                          }
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            if (input.substr(peg$currPos, 4) === peg$c273) {
                                                                                                                                              s0 = peg$c273;
                                                                                                                                              peg$currPos += 4;
                                                                                                                                            } else {
                                                                                                                                              s0 = peg$FAILED;
                                                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c274); }
                                                                                                                                            }
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              if (input.substr(peg$currPos, 4) === peg$c275) {
                                                                                                                                                s0 = peg$c275;
                                                                                                                                                peg$currPos += 4;
                                                                                                                                              } else {
                                                                                                                                                s0 = peg$FAILED;
                                                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c276); }
                                                                                                                                              }
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                if (input.substr(peg$currPos, 4) === peg$c277) {
                                                                                                                                                  s0 = peg$c277;
                                                                                                                                                  peg$currPos += 4;
                                                                                                                                                } else {
                                                                                                                                                  s0 = peg$FAILED;
                                                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c278); }
                                                                                                                                                }
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  if (input.substr(peg$currPos, 4) === peg$c279) {
                                                                                                                                                    s0 = peg$c279;
                                                                                                                                                    peg$currPos += 4;
                                                                                                                                                  } else {
                                                                                                                                                    s0 = peg$FAILED;
                                                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c280); }
                                                                                                                                                  }
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    if (input.substr(peg$currPos, 4) === peg$c281) {
                                                                                                                                                      s0 = peg$c281;
                                                                                                                                                      peg$currPos += 4;
                                                                                                                                                    } else {
                                                                                                                                                      s0 = peg$FAILED;
                                                                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c282); }
                                                                                                                                                    }
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      if (input.substr(peg$currPos, 4) === peg$c283) {
                                                                                                                                                        s0 = peg$c283;
                                                                                                                                                        peg$currPos += 4;
                                                                                                                                                      } else {
                                                                                                                                                        s0 = peg$FAILED;
                                                                                                                                                        if (peg$silentFails === 0) { peg$fail(peg$c284); }
                                                                                                                                                      }
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        if (input.substr(peg$currPos, 4) === peg$c285) {
                                                                                                                                                          s0 = peg$c285;
                                                                                                                                                          peg$currPos += 4;
                                                                                                                                                        } else {
                                                                                                                                                          s0 = peg$FAILED;
                                                                                                                                                          if (peg$silentFails === 0) { peg$fail(peg$c286); }
                                                                                                                                                        }
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          if (input.substr(peg$currPos, 4) === peg$c287) {
                                                                                                                                                            s0 = peg$c287;
                                                                                                                                                            peg$currPos += 4;
                                                                                                                                                          } else {
                                                                                                                                                            s0 = peg$FAILED;
                                                                                                                                                            if (peg$silentFails === 0) { peg$fail(peg$c288); }
                                                                                                                                                          }
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            if (input.substr(peg$currPos, 3) === peg$c289) {
                                                                                                                                                              s0 = peg$c289;
                                                                                                                                                              peg$currPos += 3;
                                                                                                                                                            } else {
                                                                                                                                                              s0 = peg$FAILED;
                                                                                                                                                              if (peg$silentFails === 0) { peg$fail(peg$c290); }
                                                                                                                                                            }
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              if (input.substr(peg$currPos, 3) === peg$c291) {
                                                                                                                                                                s0 = peg$c291;
                                                                                                                                                                peg$currPos += 3;
                                                                                                                                                              } else {
                                                                                                                                                                s0 = peg$FAILED;
                                                                                                                                                                if (peg$silentFails === 0) { peg$fail(peg$c292); }
                                                                                                                                                              }
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                if (input.substr(peg$currPos, 3) === peg$c293) {
                                                                                                                                                                  s0 = peg$c293;
                                                                                                                                                                  peg$currPos += 3;
                                                                                                                                                                } else {
                                                                                                                                                                  s0 = peg$FAILED;
                                                                                                                                                                  if (peg$silentFails === 0) { peg$fail(peg$c294); }
                                                                                                                                                                }
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  if (input.charCodeAt(peg$currPos) === 97) {
                                                                                                                                                                    s0 = peg$c295;
                                                                                                                                                                    peg$currPos++;
                                                                                                                                                                  } else {
                                                                                                                                                                    s0 = peg$FAILED;
                                                                                                                                                                    if (peg$silentFails === 0) { peg$fail(peg$c296); }
                                                                                                                                                                  }
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    if (input.charCodeAt(peg$currPos) === 103) {
                                                                                                                                                                      s0 = peg$c297;
                                                                                                                                                                      peg$currPos++;
                                                                                                                                                                    } else {
                                                                                                                                                                      s0 = peg$FAILED;
                                                                                                                                                                      if (peg$silentFails === 0) { peg$fail(peg$c298); }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return s0;
  }

  function peg$parseID() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    s2 = peg$parsekeyWord();
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseidword();
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c299(s1, s2);
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseDIGIT() {
    var s0;

    if (peg$c300.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c301); }
    }

    return s0;
  }

  function peg$parseINT() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseDIGIT();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseDIGIT();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      if (peg$c302.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c303); }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseEXP() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 69) {
      s1 = peg$c304;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c305); }
    }
    if (s1 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 101) {
        s1 = peg$c306;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c307); }
      }
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 43) {
        s2 = peg$c47;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 45) {
          s2 = peg$c49;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c50); }
        }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseINT();
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseFLOAT() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = [];
    s2 = peg$parseDIGIT();
    if (s2 !== peg$FAILED) {
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseDIGIT();
      }
    } else {
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 46) {
        s2 = peg$c132;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c133); }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parseDIGIT();
        while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parseDIGIT();
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseEXP();
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            if (peg$c302.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c303); }
            }
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4, s5];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseDIGIT();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseDIGIT();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEXP();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (peg$c302.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c303); }
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s1 = peg$c132;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c133); }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseDIGIT();
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              s3 = peg$parseDIGIT();
            }
          } else {
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseEXP();
            if (s3 === peg$FAILED) {
              s3 = null;
            }
            if (s3 !== peg$FAILED) {
              if (peg$c302.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c303); }
              }
              if (s4 === peg$FAILED) {
                s4 = null;
              }
              if (s4 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }

    return s0;
  }

  function peg$parseCOMPLEX() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$parseINT();
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 105) {
        s2 = peg$c308;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c309); }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      s1 = peg$parseFLOAT();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 105) {
          s2 = peg$c308;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c309); }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parseHEX() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 48) {
      s1 = peg$c310;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c311); }
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 120) {
        s2 = peg$c312;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c313); }
      }
      if (s2 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 88) {
          s2 = peg$c314;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c315); }
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parseHEXDIGIT();
        if (s4 !== peg$FAILED) {
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseHEXDIGIT();
          }
        } else {
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          if (peg$c302.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c303); }
          }
          if (s4 === peg$FAILED) {
            s4 = null;
          }
          if (s4 !== peg$FAILED) {
            s1 = [s1, s2, s3, s4];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseHEXDIGIT() {
    var s0;

    if (peg$c300.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c301); }
    }
    if (s0 === peg$FAILED) {
      if (peg$c316.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c317); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c318.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c319); }
        }
      }
    }

    return s0;
  }

  function peg$parseHEX_ESCAPE() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 92) {
      s1 = peg$c320;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c321); }
    }
    if (s1 !== peg$FAILED) {
      s2 = peg$parseHEXDIGIT();
      if (s2 !== peg$FAILED) {
        s3 = peg$parseHEXDIGIT();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseOCTAL_ESCAPE() {
    var s0, s1, s2, s3, s4;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 92) {
      s1 = peg$c320;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c321); }
    }
    if (s1 !== peg$FAILED) {
      if (peg$c322.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c323); }
      }
      if (s2 !== peg$FAILED) {
        if (peg$c324.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c325); }
        }
        if (s3 !== peg$FAILED) {
          if (peg$c324.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c325); }
          }
          if (s4 !== peg$FAILED) {
            s1 = [s1, s2, s3, s4];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c320;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c321); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c324.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c325); }
        }
        if (s2 !== peg$FAILED) {
          if (peg$c324.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c325); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 92) {
          s1 = peg$c320;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c321); }
        }
        if (s1 !== peg$FAILED) {
          if (peg$c324.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c325); }
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
    }

    return s0;
  }

  function peg$parseUNICODE_ESCAPE() {
    var s0, s1, s2, s3, s4, s5, s6, s7, s8;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 92) {
      s1 = peg$c320;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c321); }
    }
    if (s1 !== peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 117) {
        s2 = peg$c326;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c327); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseHEXDIGIT();
        if (s3 !== peg$FAILED) {
          s4 = peg$parseHEXDIGIT();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseHEXDIGIT();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseHEXDIGIT();
              if (s6 !== peg$FAILED) {
                s1 = [s1, s2, s3, s4, s5, s6];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c320;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c321); }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 117) {
          s2 = peg$c326;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c327); }
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 123) {
            s3 = peg$c25;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c26); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseHEXDIGIT();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseHEXDIGIT();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseHEXDIGIT();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseHEXDIGIT();
                  if (s7 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 125) {
                      s8 = peg$c27;
                      peg$currPos++;
                    } else {
                      s8 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c28); }
                    }
                    if (s8 !== peg$FAILED) {
                      s1 = [s1, s2, s3, s4, s5, s6, s7, s8];
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parseESC() {
    var s0, s1, s2;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 92) {
      s1 = peg$c320;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c321); }
    }
    if (s1 !== peg$FAILED) {
      if (peg$c328.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c329); }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$parseUNICODE_ESCAPE();
      if (s0 === peg$FAILED) {
        s0 = peg$parseHEX_ESCAPE();
        if (s0 === peg$FAILED) {
          s0 = peg$parseOCTAL_ESCAPE();
        }
      }
    }

    return s0;
  }

  function peg$parsesub() {
    var s0;

    s0 = peg$parseexpr();
    if (s0 === peg$FAILED) {
      if (input.substr(peg$currPos, 3) === peg$c55) {
        s0 = peg$c55;
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }
    }

    return s0;
  }

  function peg$parsesubg() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    s1 = peg$parsesub();
    if (s1 !== peg$FAILED) {
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parsesub();
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 44) {
        s0 = peg$c57;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }
    }

    return s0;
  }

  function peg$parsesublist() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    s1 = peg$parse_();
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$parsesubg();
      if (s4 !== peg$FAILED) {
        s5 = peg$parse_();
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      if (s3 !== peg$FAILED) {
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsesubg();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
      } else {
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseSTRINGLITERAL() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 34) {
      s1 = peg$c330;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c331); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$parseDOUBLESTRINGCHARACTER();
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseDOUBLESTRINGCHARACTER();
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
          s3 = peg$c330;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c331); }
        }
        if (s3 !== peg$FAILED) {
          s1 = [s1, s2, s3];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }
    if (s0 === peg$FAILED) {
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c332;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c333); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseSINGLESTRINGCHARACTER();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseSINGLESTRINGCHARACTER();
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c332;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c333); }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    }

    return s0;
  }

  function peg$parseDOUBLESTRINGCHARACTER() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    if (peg$c334.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c335); }
    }
    if (s2 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 92) {
        s2 = peg$c320;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c321); }
      }
    }
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      if (input.length > peg$currPos) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c4); }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parseSINGLESTRINGCHARACTER() {
    var s0, s1, s2;

    s0 = peg$currPos;
    s1 = peg$currPos;
    peg$silentFails++;
    if (peg$c336.test(input.charAt(peg$currPos))) {
      s2 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c337); }
    }
    if (s2 === peg$FAILED) {
      if (input.charCodeAt(peg$currPos) === 92) {
        s2 = peg$c320;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c321); }
      }
    }
    peg$silentFails--;
    if (s2 === peg$FAILED) {
      s1 = void 0;
    } else {
      peg$currPos = s1;
      s1 = peg$FAILED;
    }
    if (s1 !== peg$FAILED) {
      if (input.length > peg$currPos) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c4); }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }

  function peg$parsecomment() {
    var s0, s1, s2, s3, s4, s5;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 35) {
      s1 = peg$c338;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c339); }
    }
    if (s1 !== peg$FAILED) {
      s2 = [];
      s3 = peg$currPos;
      s4 = peg$currPos;
      peg$silentFails++;
      s5 = peg$parseNL();
      if (s5 === peg$FAILED) {
        s5 = peg$parseEOF();
      }
      peg$silentFails--;
      if (s5 === peg$FAILED) {
        s4 = void 0;
      } else {
        peg$currPos = s4;
        s4 = peg$FAILED;
      }
      if (s4 !== peg$FAILED) {
        if (input.length > peg$currPos) {
          s5 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c4); }
        }
        if (s5 !== peg$FAILED) {
          s4 = [s4, s5];
          s3 = s4;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      } else {
        peg$currPos = s3;
        s3 = peg$FAILED;
      }
      while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parseNL();
        if (s5 === peg$FAILED) {
          s5 = peg$parseEOF();
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c4); }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
      }
      if (s2 !== peg$FAILED) {
        s1 = [s1, s2];
        s0 = s1;
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
    } else {
      peg$currPos = s0;
      s0 = peg$FAILED;
    }

    return s0;
  }


  peg$result = peg$startRuleFunction();

  if (peg$result !== peg$FAILED && peg$currPos === input.length) {
    return peg$result;
  } else {
    if (peg$result !== peg$FAILED && peg$currPos < input.length) {
      peg$fail(peg$endExpectation());
    }

    throw peg$buildStructuredError(
      peg$maxFailExpected,
      peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
      peg$maxFailPos < input.length
        ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
        : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
    );
  }
}


function ptr$parse(_input) {
mssgStack.length=0;
if ( 'object' === typeof _input) {
  _input = undefined;
}

_input = _input || '';
var options={};
  
var okResult={message: "ok"};
var results=[];

try{
    if(_input  && typeof _input=="string" && _input.length >0){    
        result = peg$parse(_input, options );
    peg$parse(_input, options );
    }
} catch(e){
   if( e instanceof peg$SyntaxError){
       var mssg= "error";
        if(e.message && e.location.start.line){
            addError(
            "Unexpected Symbol: " + e.found, e.location, "error")
        }

   }
   
}

mssgStack.forEach( function( warning ){
    var message =warning.message;
    var location=warning.location;
    var type=warning.type; 
   
    
    results.push({
        row: location.start.line-1,
        column: location.start.column-1,
        text: message,
        type: type
    })
})


return results;
}; //end of ptr$parse

function ptr$context( _input, _cursorPos ){
    mssgStack.length=0;
    contextStack.length=0;
    if ( 'object' === typeof _input) {
      _input = undefined;
    }
    _input = _input || '';
    var options={};
    if( _cursorPos){
	    options={
		    cursorPos: {
			    row:  _cursorPos.row+1,
			    column: _cursorPos.column+1
			}
	};
    }
    var contextCandidate = {
            tok: "",
            pos: {line: -1, col: -1}
    };
    try{
        if( _input  && 
            "string"=== typeof _input && 
            _input.length >0
        ){    
            result = peg$parse(_input, options );
           
           
            for( var i=0, len=contextStack.length; i<len; i++)
           {
               contx=contextStack[i];
               
                if(
                    comparePos(
                        contextCandidate.pos.line,
                        contextCandidate.pos.col,
                        contx.location.start.line,
                        contx.location.start.column
                    )==1
                ){
                    contextCandidate.pos.line=contx.location.start.line ;
                    contextCandidate.pos.col=contx.location.start.column;
                    contextCandidate.tok=contx.token;
		    contextCandidate.attrs=contx.attrs;
                }
            }
        }
    } catch(e){
       if( e instanceof peg$SyntaxError){
           var mssg= "error";
        if(e.message && e.location.start.line){
            addError(
            "Unexpected Symbol: " + e.found, e.location, "error")
           }
       }
    }
    
    return contextCandidate;
};


function ptr$availableCompletions( _input, _cursorPos ){
    mssgStack.length=0;
    var cntx = ptr$context( _input, _cursorPos );
    available=[];
    if(cntx.length>0){
        var tok = cntx[0];
        var availAttr= acceptedAttributes[tok];
        var availCntnt= acceptContentEle[tok];
        available= availAttr.concat(availCntnt);
    }
    return available;
}

function ptr$scope(  _input, _cursorPos){
    return ptr$context( _input, _cursorPos ).tok;
}


return {
  version: '0.2.0',
  parse: ptr$parse,
  context: ptr$context,
  candidates: scopeCompletionCandidates,
  completionCodeMap: scopeCompletions
};

})();

module.exports.PTRPARSER = PTRPARSER;




});

ace.define("ace/mode/ptr_completions",["require","exports","module","ace/mode/ptr/ptrparse"], function(require, exports, module) {
"use strict";

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
		return attrsTaken.indexOf(e[2]) == -1;
	   } else {
	        return true;
	   }
      });
    }
    
    if(!!prefix){
          stcodes=stcodes.filter(function(stc){
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

ace.define("ace/mode/behaviour/ptrstyle",["require","exports","module","ace/lib/oop","ace/mode/behaviour","ace/token_iterator","ace/lib/lang"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Behaviour = require("../behaviour").Behaviour;
var TokenIterator = require("../../token_iterator").TokenIterator;
var lang = require("../../lib/lang");

var SAFE_INSERT_IN_TOKENS =
    ["text", "paren.rparen", "punctuation.operator"];
var SAFE_INSERT_BEFORE_TOKENS =
    ["text", "paren.rparen", "punctuation.operator", "comment"];

var context;
var contextCache = {};
var initContext = function(editor) {
    var id = -1;
    if (editor.multiSelect) {
        id = editor.selection.index;
        if (contextCache.rangeCount != editor.multiSelect.rangeCount)
            contextCache = {rangeCount: editor.multiSelect.rangeCount};
    }
    if (contextCache[id])
        return context = contextCache[id];
    context = contextCache[id] = {
        autoInsertedBrackets: 0,
        autoInsertedRow: -1,
        autoInsertedLineEnd: "",
        maybeInsertedBrackets: 0,
        maybeInsertedRow: -1,
        maybeInsertedLineStart: "",
        maybeInsertedLineEnd: ""
    };
};

var getWrapped = function(selection, selected, opening, closing) {
    var rowDiff = selection.end.row - selection.start.row;
    return {
        text: opening + selected + closing,
        selection: [
                0,
                selection.start.column + 1,
                rowDiff,
                selection.end.column + (rowDiff ? 0 : 1)
            ]
    };
};

var PtrStyleBehaviour = function() {
    this.add("braces", "insertion", function(state, action, editor, session, text) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (text == '{') {
            initContext(editor);
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && selected !== "{" && editor.getWrapBehavioursEnabled()) {
                return getWrapped(selection, selected, '{', '}');
            } else if (PtrStyleBehaviour.isSaneInsertion(editor, session)) {
                if (/[\]\}\)]/.test(line[cursor.column]) || editor.inMultiSelectMode) {
                    PtrStyleBehaviour.recordAutoInsert(editor, session, "}");
                    return {
                        text: '{}',
                        selection: [1, 1]
                    };
                } else {
                    PtrStyleBehaviour.recordMaybeInsert(editor, session, "{");
                    return {
                        text: '{',
                        selection: [1, 1]
                    };
                }
            }
        } else if (text == '}') {
            initContext(editor);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == '}') {
                var matching = session.$findOpeningBracket('}', {column: cursor.column + 1, row: cursor.row});
                if (matching !== null && PtrStyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                    PtrStyleBehaviour.popAutoInsertedClosing();
                    return {
                        text: '',
                        selection: [1, 1]
                    };
                }
            }
        } else if (text == "\n" || text == "\r\n") {
            initContext(editor);
            var closing = "";
            if (PtrStyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
                closing = lang.stringRepeat("}", context.maybeInsertedBrackets);
                PtrStyleBehaviour.clearMaybeInsertedClosing();
            }
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar === '}') {
                var openBracePos = session.findMatchingBracket({row: cursor.row, column: cursor.column+1}, '}');
                if (!openBracePos)
                     return null;
                var next_indent = this.$getIndent(session.getLine(openBracePos.row));
            } else if (closing) {
                var next_indent = this.$getIndent(line);
            } else {
                PtrStyleBehaviour.clearMaybeInsertedClosing();
                return;
            }
            var indent = next_indent + session.getTabString();

            return {
                text: '\n' + indent + '\n' + next_indent + closing,
                selection: [1, indent.length, 1, indent.length]
            };
        } else {
            PtrStyleBehaviour.clearMaybeInsertedClosing();
        }
    });

    this.add("braces", "deletion", function(state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '{') {
            initContext(editor);
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.end.column, range.end.column + 1);
            if (rightChar == '}') {
                range.end.column++;
                return range;
            } else {
                context.maybeInsertedBrackets--;
            }
        }
    });
    
    this.add("parens", "insertion", function(state, action, editor, session, text) {
        var cursor = editor.getCursorPosition();
        var line = session.doc.getLine(cursor.row);
        if (text == '(') {
            initContext(editor);
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && selected !== "(" && editor.getWrapBehavioursEnabled()) {
                return getWrapped(selection, selected, '(', ')');
            } else if (PtrStyleBehaviour.isSaneInsertion(editor, session)) {
                    PtrStyleBehaviour.recordAutoInsert(editor, session, ")");
                    return {
                        text: '()',
                        selection: [1, 1]
                    };
            }
        } else if (text == ')') {
            initContext(editor);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == ')') {
                var matching = session.$findOpeningBracket(')', {column: cursor.column + 1, row: cursor.row});
                if (matching !== null && PtrStyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                    PtrStyleBehaviour.popAutoInsertedClosing();
                    return {
                        text: '',
                        selection: [1, 1]
                    };
                }
            }
        } else if (text == "\n" || text == "\r\n") {
            initContext(editor);
            var closing = "";
            if (PtrStyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
                closing = lang.stringRepeat(")", context.maybeInsertedBrackets);
                PtrStyleBehaviour.clearMaybeInsertedClosing();
            }
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar === ')') {
                var openBracePos = session.findMatchingBracket({row: cursor.row, column: cursor.column+1}, ')');
                if (!openBracePos)
                     return null;
                var next_indent = this.$getIndent(session.getLine(openBracePos.row));
            } else if (closing) {
                var next_indent = this.$getIndent(line);
            } else {
                PtrStyleBehaviour.clearMaybeInsertedClosing();
                return;
            }
            var indent = next_indent + session.getTabString();

            return {
                text: '\n' + indent + '\n' + next_indent + closing,
                selection: [1, indent.length, 1, indent.length]
            };
        } else {
            PtrStyleBehaviour.clearMaybeInsertedClosing();
        }
    });

    this.add("parens", "deletion", function(state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '(') {
            initContext(editor);
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.end.column, range.end.column + 1);
            if (rightChar == ')') {
                range.end.column++;
                return range;
            } else {
                context.maybeInsertedBrackets--;
            }
        }
    });

    this.add("brackets", "insertion", function(state, action, editor, session, text) {
        if (text == '[') {
            initContext(editor);
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                return getWrapped(selection, selected, '[', ']');
            } else if (PtrStyleBehaviour.isSaneInsertion(editor, session)) {
                PtrStyleBehaviour.recordAutoInsert(editor, session, "]");
                return {
                    text: '[]',
                    selection: [1, 1]
                };
            }
        } else if (text == ']') {
            initContext(editor);
            var cursor = editor.getCursorPosition();
            var line = session.doc.getLine(cursor.row);
            var rightChar = line.substring(cursor.column, cursor.column + 1);
            if (rightChar == ']') {
                var matching = session.$findOpeningBracket(']', {column: cursor.column + 1, row: cursor.row});
                if (matching !== null && PtrStyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                    PtrStyleBehaviour.popAutoInsertedClosing();
                    return {
                        text: '',
                        selection: [1, 1]
                    };
                }
            }
        }
    });

    this.add("brackets", "deletion", function(state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && selected == '[') {
            initContext(editor);
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
            if (rightChar == ']') {
                range.end.column++;
                return range;
            }
        }
    });

    this.add("string_dquotes", "insertion", function(state, action, editor, session, text) {
        if (text == '"' || text == "'") {
            if (this.lineCommentStart && this.lineCommentStart.indexOf(text) != -1) 
                return;
            initContext(editor);
            var quote = text;
            var selection = editor.getSelectionRange();
            var selected = session.doc.getTextRange(selection);
            if (selected !== "" && selected !== "'" && selected != '"' && editor.getWrapBehavioursEnabled()) {
                return getWrapped(selection, selected, quote, quote);
            } else if (!selected) {
                var cursor = editor.getCursorPosition();
                var line = session.doc.getLine(cursor.row);
                var leftChar = line.substring(cursor.column-1, cursor.column);
                var rightChar = line.substring(cursor.column, cursor.column + 1);
                
                var token = session.getTokenAt(cursor.row, cursor.column);
                var rightToken = session.getTokenAt(cursor.row, cursor.column + 1);
                if (leftChar == "\\" && token && /escape/.test(token.type))
                    return null;
                
                var stringBefore = token && /string|escape/.test(token.type);
                var stringAfter = !rightToken || /string|escape/.test(rightToken.type);
                
                var pair;
                if (rightChar == quote) {
                    pair = stringBefore !== stringAfter;
                    if (pair && /string\.end/.test(rightToken.type))
                        pair = false;
                } else {
                    if (stringBefore && !stringAfter)
                        return null; // wrap string with different quote
                    if (stringBefore && stringAfter)
                        return null; // do not pair quotes inside strings
                    var wordRe = session.$mode.tokenRe;
                    wordRe.lastIndex = 0;
                    var isWordBefore = wordRe.test(leftChar);
                    wordRe.lastIndex = 0;
                    var isWordAfter = wordRe.test(leftChar);
                    if (isWordBefore || isWordAfter)
                        return null; // before or after alphanumeric
                    if (rightChar && !/[\s;,.})\]\\]/.test(rightChar))
                        return null; // there is rightChar and it isn't closing
                    pair = true;
                }
                return {
                    text: pair ? quote + quote : "",
                    selection: [1,1]
                };
            }
        }
    });

    this.add("string_dquotes", "deletion", function(state, action, editor, session, range) {
        var selected = session.doc.getTextRange(range);
        if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
            initContext(editor);
            var line = session.doc.getLine(range.start.row);
            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
            if (rightChar == selected) {
                range.end.column++;
                return range;
            }
        }
    });

};

    
PtrStyleBehaviour.isSaneInsertion = function(editor, session) {
    var cursor = editor.getCursorPosition();
    var iterator = new TokenIterator(session, cursor.row, cursor.column);
    if (!this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) {
        var iterator2 = new TokenIterator(session, cursor.row, cursor.column + 1);
        if (!this.$matchTokenType(iterator2.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS))
            return false;
    }
    iterator.stepForward();
    return iterator.getCurrentTokenRow() !== cursor.row ||
        this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_BEFORE_TOKENS);
};

PtrStyleBehaviour.$matchTokenType = function(token, types) {
    return types.indexOf(token.type || token) > -1;
};

PtrStyleBehaviour.recordAutoInsert = function(editor, session, bracket) {
    var cursor = editor.getCursorPosition();
    var line = session.doc.getLine(cursor.row);
    if (!this.isAutoInsertedClosing(cursor, line, context.autoInsertedLineEnd[0]))
        context.autoInsertedBrackets = 0;
    context.autoInsertedRow = cursor.row;
    context.autoInsertedLineEnd = bracket + line.substr(cursor.column);
    context.autoInsertedBrackets++;
};

PtrStyleBehaviour.recordMaybeInsert = function(editor, session, bracket) {
    var cursor = editor.getCursorPosition();
    var line = session.doc.getLine(cursor.row);
    if (!this.isMaybeInsertedClosing(cursor, line))
        context.maybeInsertedBrackets = 0;
    context.maybeInsertedRow = cursor.row;
    context.maybeInsertedLineStart = line.substr(0, cursor.column) + bracket;
    context.maybeInsertedLineEnd = line.substr(cursor.column);
    context.maybeInsertedBrackets++;
};

PtrStyleBehaviour.isAutoInsertedClosing = function(cursor, line, bracket) {
    return context.autoInsertedBrackets > 0 &&
        cursor.row === context.autoInsertedRow &&
        bracket === context.autoInsertedLineEnd[0] &&
        line.substr(cursor.column) === context.autoInsertedLineEnd;
};

PtrStyleBehaviour.isMaybeInsertedClosing = function(cursor, line) {
    return context.maybeInsertedBrackets > 0 &&
        cursor.row === context.maybeInsertedRow &&
        line.substr(cursor.column) === context.maybeInsertedLineEnd &&
        line.substr(0, cursor.column) == context.maybeInsertedLineStart;
};

PtrStyleBehaviour.popAutoInsertedClosing = function() {
    context.autoInsertedLineEnd = context.autoInsertedLineEnd.substr(1);
    context.autoInsertedBrackets--;
};

PtrStyleBehaviour.clearMaybeInsertedClosing = function() {
    if (context) {
        context.maybeInsertedBrackets = 0;
        context.maybeInsertedRow = -1;
    }
};



oop.inherits(PtrStyleBehaviour, Behaviour);

exports.PtrStyleBehaviour = PtrStyleBehaviour;
});

ace.define("ace/mode/folding/ptrstyle",["require","exports","module","ace/lib/oop","ace/range","ace/mode/folding/fold_mode"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var Range = require("../../range").Range;
var BaseFoldMode = require("./fold_mode").FoldMode;

var FoldMode = exports.FoldMode = function(commentRegex) {
    if (commentRegex) {
        this.foldingStartMarker = new RegExp(
            this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
        );
        this.foldingStopMarker = new RegExp(
            this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
        );
    }
};
oop.inherits(FoldMode, BaseFoldMode);

(function() {
    
    this.foldingStartMarker = /(\{|\[|\()[^\}\]\)]*$/; // (  { [ 
    this.foldingStopMarker = /^[^\[\{\(]*(\}|\]|\))/;
    this.singleLineBlockCommentRe= /^\s*(\/\*).*\*\/\s*$/;
    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;

    this.getFoldWidgetRange = function(session, foldStyle, row, forceMultiline) {
        var line = session.getLine(row);
        
        if (this.startRegionRe.test(line))
            return this.getCommentRegionBlock(session, line, row);
        
        var match = line.match(this.foldingStartMarker);
        if (match) {
            var i = match.index;

            if (match[1])
                return this.openingBracketBlock(session, match[1], row, i);
                
            var range = session.getCommentFoldRange(row, i + match[0].length, 1);
            
            if (range && !range.isMultiLine()) {
                if (forceMultiline) {
                    range = this.getSectionRange(session, row);
                } else if (foldStyle != "all")
                    range = null;
            }
            
            return range;
        }

        if (foldStyle === "markbegin")
            return;

        var match = line.match(this.foldingStopMarker);
        if (match) {
            var i = match.index + match[0].length;

            if (match[1])
                return this.closingBracketBlock(session, match[1], row, i);

            return session.getCommentFoldRange(row, i, -1);
        }
    };
    
    this.getSectionRange = function(session, row) {
        var line = session.getLine(row);
        var startIndent = line.search(/\S/);
        var startRow = row;
        var startColumn = line.length;
        row = row + 1;
        var endRow = row;
        var maxRow = session.getLength();
        while (++row < maxRow) {
            line = session.getLine(row);
            var indent = line.search(/\S/);
            if (indent === -1)
                continue;
            if  (startIndent > indent)
                break;
            var subRange = this.getFoldWidgetRange(session, "all", row);
            
            if (subRange) {
                if (subRange.start.row <= startRow) {
                    break;
                } else if (subRange.isMultiLine()) {
                    row = subRange.end.row;
                } else if (startIndent == indent) {
                    break;
                }
            }
            endRow = row;
        }
        
        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
    };
    this.getCommentRegionBlock = function(session, line, row) {
        var startColumn = line.search(/\s*$/);
        var maxRow = session.getLength();
        var startRow = row;
        
        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
        var depth = 1;
        while (++row < maxRow) {
            line = session.getLine(row);
            var m = re.exec(line);
            if (!m) continue;
            if (m[1]) depth--;
            else depth++;

            if (!depth) break;
        }

        var endRow = row;
        if (endRow > startRow) {
            return new Range(startRow, startColumn, endRow, line.length);
        }
    };

 

}).call(FoldMode.prototype);

});

ace.define("ace/mode/ptr",["require","exports","module","ace/range","ace/lib/oop","ace/mode/text","ace/mode/text_highlight_rules","ace/mode/ptr_highlight_rules","ace/mode/matching_brace_outdent","ace/mode/ptr_completions","ace/worker/worker_client","ace/mode/behaviour/ptrstyle","ace/mode/folding/ptrstyle"], function(require, exports, module) {
   "use strict";

   var Range = require("../range").Range;
   var oop = require("../lib/oop");
   var TextMode = require("./text").Mode;
   var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
   var PtrHighlightRules = require("./ptr_highlight_rules").PtrHighlightRules;
   var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
   var  PtrCompletions = require('./ptr_completions').PtrCompletions;
   var WorkerClient = require("../worker/worker_client").WorkerClient;
   var PtrStyleBehaviour = require("./behaviour/ptrstyle").PtrStyleBehaviour;
   var PtrStyleFoldMode = require("./folding/ptrstyle").FoldMode;

   var Mode = function(){
      this.HighlightRules = PtrHighlightRules;
      this.$outdent = new MatchingBraceOutdent();
      this.$behaviour = new PtrStyleBehaviour();
      this.foldingRules = new PtrStyleFoldMode();
      this.$completer = new PtrCompletions();
   };
   oop.inherits(Mode, TextMode);

   (function()
   {
      this.lineCommentStart = "#";
      
    this.$id = "ace/mode/ptr";
    
     this.getCompletions = function(state, session, pos, prefix) {
        return this.$completer.getCompletions(state, session, pos, prefix);
    };
      
    this.createWorker = function(session) {
        var worker = new WorkerClient(["ace"], "ace/mode/ptr_worker", "Worker");
        worker.attachToDocument(session.getDocument());

        worker.on("annotate", function(results) {
            session.setAnnotations(results.data);
        });
        
        worker.on("errors", function(e) {
            session.setAnnotations(e.data);
        });

        worker.on("terminate", function() {
            session.clearAnnotations();
        });

        return worker;
    };
    
      
    
   }).call(Mode.prototype);
   exports.Mode = Mode;
});

ace.define("ace/mode/folding/coffee",["require","exports","module","ace/lib/oop","ace/mode/folding/fold_mode","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var BaseFoldMode = require("./fold_mode").FoldMode;
var Range = require("../../range").Range;

var FoldMode = exports.FoldMode = function() {};
oop.inherits(FoldMode, BaseFoldMode);

(function() {

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var range = this.indentationBlock(session, row);
        if (range)
            return range;

        var re = /\S/;
        var line = session.getLine(row);
        var startLevel = line.search(re);
        if (startLevel == -1 || line[startLevel] != "#")
            return;

        var startColumn = line.length;
        var maxRow = session.getLength();
        var startRow = row;
        var endRow = row;

        while (++row < maxRow) {
            line = session.getLine(row);
            var level = line.search(re);

            if (level == -1)
                continue;

            if (line[level] != "#")
                break;

            endRow = row;
        }

        if (endRow > startRow) {
            var endColumn = session.getLine(endRow).length;
            return new Range(startRow, startColumn, endRow, endColumn);
        }
    };
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
        var indent = line.search(/\S/);
        var next = session.getLine(row + 1);
        var prev = session.getLine(row - 1);
        var prevIndent = prev.search(/\S/);
        var nextIndent = next.search(/\S/);

        if (indent == -1) {
            session.foldWidgets[row - 1] = prevIndent!= -1 && prevIndent < nextIndent ? "start" : "";
            return "";
        }
        if (prevIndent == -1) {
            if (indent == nextIndent && line[indent] == "#" && next[indent] == "#") {
                session.foldWidgets[row - 1] = "";
                session.foldWidgets[row + 1] = "";
                return "start";
            }
        } else if (prevIndent == indent && line[indent] == "#" && prev[indent] == "#") {
            if (session.getLine(row - 2).search(/\S/) == -1) {
                session.foldWidgets[row - 1] = "start";
                session.foldWidgets[row + 1] = "";
                return "";
            }
        }

        if (prevIndent!= -1 && prevIndent < indent)
            session.foldWidgets[row - 1] = "start";
        else
            session.foldWidgets[row - 1] = "";

        if (indent < nextIndent)
            return "start";
        else
            return "";
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/snippets",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/text_highlight_rules","ace/mode/folding/coffee"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var SnippetHighlightRules = function() {

    var builtins = "SELECTION|CURRENT_WORD|SELECTED_TEXT|CURRENT_LINE|LINE_INDEX|" +
        "LINE_NUMBER|SOFT_TABS|TAB_SIZE|FILENAME|FILEPATH|FULLNAME";

    this.$rules = {
        "start" : [
            {token:"constant.language.escape", regex: /\\[\$}`\\]/},
            {token:"keyword", regex: "\\$(?:TM_)?(?:" + builtins + ")\\b"},
            {token:"variable", regex: "\\$\\w+"},
            {onMatch: function(value, state, stack) {
                if (stack[1])
                    stack[1]++;
                else
                    stack.unshift(state, 1);
                return this.tokenName;
            }, tokenName: "markup.list", regex: "\\${", next: "varDecl"},
            {onMatch: function(value, state, stack) {
                if (!stack[1])
                    return "text";
                stack[1]--;
                if (!stack[1])
                    stack.splice(0,2);
                return this.tokenName;
            }, tokenName: "markup.list", regex: "}"},
            {token: "doc.comment", regex:/^\${2}-{5,}$/}
        ],
        "varDecl" : [
            {regex: /\d+\b/, token: "constant.numeric"},
            {token:"keyword", regex: "(?:TM_)?(?:" + builtins + ")\\b"},
            {token:"variable", regex: "\\w+"},
            {regex: /:/, token: "punctuation.operator", next: "start"},
            {regex: /\//, token: "string.regex", next: "regexp"},
            {regex: "", next: "start"}
        ],
        "regexp" : [
            {regex: /\\./, token: "escape"},
            {regex: /\[/, token: "regex.start", next: "charClass"},
            {regex: "/", token: "string.regex", next: "format"},
            {"token": "string.regex", regex:"."}
        ],
        charClass : [
            {regex: "\\.", token: "escape"},
            {regex: "\\]", token: "regex.end", next: "regexp"},
            {"token": "string.regex", regex:"."}
        ],
        "format" : [
            {regex: /\\[ulULE]/, token: "keyword"},
            {regex: /\$\d+/, token: "variable"},
            {regex: "/[gim]*:?", token: "string.regex", next: "start"},
            {"token": "string", regex:"."}
        ]
    };
};
oop.inherits(SnippetHighlightRules, TextHighlightRules);

exports.SnippetHighlightRules = SnippetHighlightRules;

var SnippetGroupHighlightRules = function() {
    this.$rules = {
        "start" : [
			{token: "text", regex: "^\\t", next: "sn-start"},
			{token:"invalid", regex: /^ \s*/},
            {token:"comment", regex: /^#.*/},
            {token:"constant.language.escape", regex: "^regex ", next: "regex"},
            {token:"constant.language.escape", regex: "^(trigger|endTrigger|name|snippet|guard|endGuard|tabTrigger|key)\\b"}
        ],
		"regex" : [
			{token:"text", regex: "\\."},
			{token:"keyword", regex: "/"},
			{token:"empty", regex: "$", next: "start"}
		]
    };
	this.embedRules(SnippetHighlightRules, "sn-", [
		{token: "text", regex: "^\\t", next: "sn-start"},
		{onMatch: function(value, state, stack) {
			stack.splice(stack.length);
			return this.tokenName;
		}, tokenName: "text", regex: "^(?!\t)", next: "start"}
	]);
	
};

oop.inherits(SnippetGroupHighlightRules, TextHighlightRules);

exports.SnippetGroupHighlightRules = SnippetGroupHighlightRules;

var FoldMode = require("./folding/coffee").FoldMode;

var Mode = function() {
    this.HighlightRules = SnippetGroupHighlightRules;
    this.foldingRules = new FoldMode();
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
    this.$indentWithTabs = true;
    this.lineCommentStart = "#";
    this.$id = "ace/mode/snippets";
}).call(Mode.prototype);
exports.Mode = Mode;


});

ace.define("ace/mode/ptrrmd_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules","ace/mode/javascript_highlight_rules","ace/mode/xml_highlight_rules","ace/mode/html_highlight_rules","ace/mode/css_highlight_rules","ace/mode/snippets","ace/mode/ptr_highlight_rules"], function(require, exports, module) {
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

var PtrrmdHighlightRules = function() {
    HtmlHighlightRules.call(this);

    this.$rules["start"].unshift({
        token : "empty_line",
        regex : '^$',
        next: "allowBlock"
    }, { // h1
        token: "markup.heading.1",
        regex: "^=+(?=\\s*$)"
    }, { // h2
        token: "markup.heading.2",
        regex: "^\\-+(?=\\s*$)"
    }, {
        token : function(value) {
            return "markup.heading." + value.length;
        },
        regex : /^#{1,6}(?=\s*[^ #]|\s+#.)/,
        next : "header"
    },
       github_embed("(?:javascript|js)", "jscode-"),
       github_embed("xml", "xmlcode-"),
       github_embed("html", "htmlcode-"),
       github_embed("css", "csscode-"),
       github_embed("r","ptrcode-"),
       github_embed("snippet","snippetcode-"),
       github_embed("hint","textcode-"),
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
        }, { // code span `
            token : "support.function",
            regex : "(`+)(.*?[^`])(\\1)"
        }, { // reference
            token : ["text", "constant", "text", "url", "string", "text"],
            regex : "^([ ]{0,3}\\[)([^\\]]+)(\\]:\\s*)([^ ]+)(\\s*(?:[\"][^\"]+[\"])?(\\s*))$"
        }, { // link by reference
            token : ["text", "string", "text", "constant", "text"],
            regex : "(\\[)(" + escaped("]") + ")(\\]\\s*\\[)("+ escaped("]") + ")(\\])"
        }, { // link by url
            token : ["text", "string", "text", "markup.underline", "string", "text"],
            regex : "(\\[)(" +                                        // [
                    escaped("]") +                                    // link text
                    ")(\\]\\()"+                                      // ](
                    '((?:[^\\)\\s\\\\]|\\\\.|\\s(?=[^"]))*)' +        // href
                    '(\\s*"' +  escaped('"') + '"\\s*)?' +            // "title"
                    "(\\))"                                           // )
        }, { // strong ** __
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

    this.embedRules(JavaScriptHighlightRules, "jscode-", [{
       token : "support.function",
       regex : "^\\s*```",
       next  : "pop"
    }]);

    this.embedRules(HtmlHighlightRules, "htmlcode-", [{
       token : "support.function",
       regex : "^\\s*```",
       next  : "pop"
    }]);

    this.embedRules(CssHighlightRules, "csscode-", [{
       token : "support.function",
       regex : "^\\s*```",
       next  : "pop"
    }]);

    this.embedRules(XmlHighlightRules, "xmlcode-", [{
       token : "support.function",
       regex : "^\\s*```",
       next  : "pop"
    }]);
    
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
oop.inherits(PtrrmdHighlightRules, TextHighlightRules);

exports.PtrrmdHighlightRules = PtrrmdHighlightRules;
});

ace.define("ace/mode/folding/markdown",["require","exports","module","ace/lib/oop","ace/mode/folding/fold_mode","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../../lib/oop");
var BaseFoldMode = require("./fold_mode").FoldMode;
var Range = require("../../range").Range;

var FoldMode = exports.FoldMode = function() {};
oop.inherits(FoldMode, BaseFoldMode);

(function() {
    this.foldingStartMarker = /^(?:[=-]+\s*$|#{1,6} |`{3})/;

    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
        if (!this.foldingStartMarker.test(line))
            return "";

        if (line[0] == "`") {
            if (session.bgTokenizer.getState(row) == "start")
                return "end";
            return "start";
        }

        return "start";
    };

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        var line = session.getLine(row);
        var startColumn = line.length;
        var maxRow = session.getLength();
        var startRow = row;
        var endRow = row;
        if (!line.match(this.foldingStartMarker))
            return;

        if (line[0] == "`") {
            if (session.bgTokenizer.getState(row) !== "start") {
                while (++row < maxRow) {
                    line = session.getLine(row);
                    if (line[0] == "`" & line.substring(0, 3) == "```")
                        break;
                }
                return new Range(startRow, startColumn, row, 0);
            } else {
                while (row -- > 0) {
                    line = session.getLine(row);
                    if (line[0] == "`" & line.substring(0, 3) == "```")
                        break;
                }
                return new Range(row, line.length, startRow, 0);
            }
        }

        var token;
        function isHeading(row) {
            token = session.getTokens(row)[0];
            return token && token.type.lastIndexOf(heading, 0) === 0;
        }

        var heading = "markup.heading";
        function getLevel() {
            var ch = token.value[0];
            if (ch == "=") return 6;
            if (ch == "-") return 5;
            return 7 - token.value.search(/[^#]/);
        }

        if (isHeading(row)) {
            var startHeadingLevel = getLevel();
            while (++row < maxRow) {
                if (!isHeading(row))
                    continue;
                var level = getLevel();
                if (level >= startHeadingLevel)
                    break;
            }

            endRow = row - (!token || ["=", "-"].indexOf(token.value[0]) == -1 ? 1 : 2);

            if (endRow > startRow) {
                while (endRow > startRow && /^\s*$/.test(session.getLine(endRow)))
                    endRow--;
            }

            if (endRow > startRow) {
                var endColumn = session.getLine(endRow).length;
                return new Range(startRow, startColumn, endRow, endColumn);
            }
        }
    };

}).call(FoldMode.prototype);

});

ace.define("ace/mode/ptrrmd",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/javascript","ace/mode/xml","ace/mode/html","ace/mode/ptr","ace/mode/snippets","ace/mode/ptrrmd_highlight_rules","ace/mode/folding/markdown"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var JavaScriptMode = require("./javascript").Mode;
var XmlMode = require("./xml").Mode;
var HtmlMode = require("./html").Mode;
var PtrMode = require("./ptr").Mode;
var SnippetMode = require("./snippets").Mode;
var PtrrmdHighlightRules = require("./ptrrmd_highlight_rules").PtrrmdHighlightRules;
var MarkdownFoldMode = require("./folding/markdown").FoldMode;

var Mode = function() {
    this.HighlightRules = PtrrmdHighlightRules;

    this.createModeDelegates({
        "js-": JavaScriptMode,
        "xml-": XmlMode,
        "html-": HtmlMode,
	"ptr-":PtrMode//,
	"snippet-":SnippetMode
    });

    this.foldingRules = new MarkdownFoldMode();
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
    this.type = "text";
    this.blockComment = {start: "<!--", end: "-->"};

    this.getNextLineIndent = function(state, line, tab) {
        if (state == "listblock") {
            var match = /^(\s*)(?:([-+*])|(\d+)\.)(\s+)/.exec(line);
            if (!match)
                return "";
            var marker = match[2];
            if (!marker)
                marker = parseInt(match[3], 10) + 1 + ".";
            return match[1] + marker + match[4];
        } else {
            return this.$getIndent(line);
        }
    };
    this.$id = "ace/mode/ptrrmd";
}).call(Mode.prototype);

exports.Mode = Mode;
});
