"no use strict";
;(function(window) {
if (typeof window.window != "undefined" && window.document) {
    return;
}

window.console = function() {
    var msgs = Array.prototype.slice.call(arguments, 0);
    postMessage({type: "log", data: msgs});
};
window.console.error =
window.console.warn = 
window.console.log =
window.console.trace = window.console;

window.window = window;
window.ace = window;

window.onerror = function(message, file, line, col, err) {
    console.error("Worker " + (err ? err.stack : message));
};

window.normalizeModule = function(parentId, moduleName) {
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return window.normalizeModule(parentId, chunks[0]) + "!" + window.normalizeModule(parentId, chunks[1]);
    }
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = (base ? base + "/" : "") + moduleName;
        
        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            moduleName = moduleName.replace(/^\.\//, "").replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }
    
    return moduleName;
};

window.require = function(parentId, id) {
    if (!id) {
        id = parentId
        parentId = null;
    }
    if (!id.charAt)
        throw new Error("worker.js require() accepts only (parentId, id) as arguments");

    id = window.normalizeModule(parentId, id);

    var module = window.require.modules[id];
    if (module) {
        if (!module.initialized) {
            module.initialized = true;
            module.exports = module.factory().exports;
        }
        return module.exports;
    }
    
    var chunks = id.split("/");
    if (!window.require.tlns)
        return console.log("unable to load " + id);
    chunks[0] = window.require.tlns[chunks[0]] || chunks[0];
    var path = chunks.join("/") + ".js";
    
    window.require.id = id;
    importScripts(path);
    return window.require(parentId, id);
};
window.require.modules = {};
window.require.tlns = {};

window.define = function(id, deps, factory) {
    if (arguments.length == 2) {
        factory = deps;
        if (typeof id != "string") {
            deps = id;
            id = window.require.id;
        }
    } else if (arguments.length == 1) {
        factory = id;
        deps = []
        id = window.require.id;
    }

    if (!deps.length)
        deps = ['require', 'exports', 'module']

    if (id.indexOf("text!") === 0) 
        return;
    
    var req = function(childId) {
        return window.require(id, childId);
    };

    window.require.modules[id] = {
        exports: {},
        factory: function() {
            var module = this;
            var returnExports = factory.apply(this, deps.map(function(dep) {
              switch(dep) {
                  case 'require': return req
                  case 'exports': return module.exports
                  case 'module':  return module
                  default:        return req(dep)
              }
            }));
            if (returnExports)
                module.exports = returnExports;
            return module;
        }
    };
};
window.define.amd = {}

window.initBaseUrls  = function initBaseUrls(topLevelNamespaces) {
    require.tlns = topLevelNamespaces;
}

window.initSender = function initSender() {

    var EventEmitter = window.require("ace/lib/event_emitter").EventEmitter;
    var oop = window.require("ace/lib/oop");
    
    var Sender = function() {};
    
    (function() {
        
        oop.implement(this, EventEmitter);
                
        this.callback = function(data, callbackId) {
            postMessage({
                type: "call",
                id: callbackId,
                data: data
            });
        };
    
        this.emit = function(name, data) {
            postMessage({
                type: "event",
                name: name,
                data: data
            });
        };
        
    }).call(Sender.prototype);
    
    return new Sender();
}

window.main = null;
window.sender = null;

window.onmessage = function(e) {
    var msg = e.data;
    if (msg.command) {
        if (main[msg.command])
            main[msg.command].apply(main, msg.args);
        else
            throw new Error("Unknown command:" + msg.command);
    }
    else if (msg.init) {        
        initBaseUrls(msg.tlns);
        require("ace/lib/es5-shim");
        sender = initSender();
        var clazz = require(msg.module)[msg.classname];
        main = new clazz(sender);
    } 
    else if (msg.event && sender) {
        sender._signal(msg.event, msg.data);
    }
};
})(this);// https://github.com/kriskowal/es5-shim

define('ace/lib/es5-shim', ['require', 'exports', 'module' ], function(require, exports, module) {

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        var target = this;
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = slice.call(arguments, 1); // for normal call
        var bound = function () {

            if (this instanceof bound) {

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }
        return bound;
    };
}
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}
if ([1,2].splice(0).length != 2) {
    if(function() { // test IE < 9 to splice bug - see issue #138
        function makeArray(l) {
            var a = new Array(l+2);
            a[0] = a[1] = 0;
            return a;
        }
        var array = [], lengthBefore;
        
        array.splice.apply(array, makeArray(20));
        array.splice.apply(array, makeArray(26));

        lengthBefore = array.length; //46
        array.splice(5, 0, "XXX"); // add one element

        lengthBefore + 1 == array.length

        if (lengthBefore + 1 == array.length) {
            return true;// has right splice implementation without bugs
        }
    }()) {//IE 6/7
        var array_splice = Array.prototype.splice;
        Array.prototype.splice = function(start, deleteCount) {
            if (!arguments.length) {
                return [];
            } else {
                return array_splice.apply(this, [
                    start === void 0 ? 0 : start,
                    deleteCount === void 0 ? (this.length - start) : deleteCount
                ].concat(slice.call(arguments, 2)))
            }
        };
    } else {//IE8
        Array.prototype.splice = function(pos, removeCount){
            var length = this.length;
            if (pos > 0) {
                if (pos > length)
                    pos = length;
            } else if (pos == void 0) {
                pos = 0;
            } else if (pos < 0) {
                pos = Math.max(length + pos, 0);
            }

            if (!(pos+removeCount < length))
                removeCount = length - pos;

            var removed = this.slice(pos, pos+removeCount);
            var insert = slice.call(arguments, 2);
            var add = insert.length;            
            if (pos === length) {
                if (add) {
                    this.push.apply(this, insert);
                }
            } else {
                var remove = Math.min(removeCount, length - pos);
                var tailOldPos = pos + remove;
                var tailNewPos = tailOldPos + add - remove;
                var tailCount = length - tailOldPos;
                var lengthAfterRemove = length - remove;

                if (tailNewPos < tailOldPos) { // case A
                    for (var i = 0; i < tailCount; ++i) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } else if (tailNewPos > tailOldPos) { // case B
                    for (i = tailCount; i--; ) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } // else, add == remove (nothing to do)

                if (add && pos === lengthAfterRemove) {
                    this.length = lengthAfterRemove; // truncate array
                    this.push.apply(this, insert);
                } else {
                    this.length = lengthAfterRemove + add; // reserves space
                    for (i = 0; i < add; ++i) {
                        this[pos+i] = insert[i];
                    }
                }
            }
            return removed;
        };
    }
}
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;
        descriptor =  { enumerable: true, configurable: true };
        if (supportsAccessors) {
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;
                return descriptor;
            }
        }
        descriptor.value = object[property];
        return descriptor;
    };
}
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}
if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        createEmpty = function () {
            var empty = {};
            for (var i in empty)
                empty[i] = null;
            empty.constructor =
            empty.hasOwnProperty =
            empty.propertyIsEnumerable =
            empty.isPrototypeOf =
            empty.toLocaleString =
            empty.toString =
            empty.valueOf =
            empty.__proto__ = null;
            return empty;
        }
    }

    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
    }
}
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
            }
        }
        if (owns(descriptor, "value")) {

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                delete object[property];
                object[property] = descriptor.value;
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}
if (!Object.seal) {
    Object.seal = function seal(object) {
        return object;
    };
}
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        return object;
    };
}
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        return object;
    };
}
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}
if (!Object.keys) {
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

});

define('ace/mode/ptr_worker', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/worker/mirror', 'ace/mode/ptr/ptrparse'], function(require, exports, module) {


var oop = require("../lib/oop");
var Mirror = require("../worker/mirror").Mirror;
var ptrparse = require("../mode/ptr/ptrparse").PTRPARSER;

var Worker = exports.Worker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(500);
};

oop.inherits(Worker, Mirror);

(function() {

    this.onUpdate = function() {
        var value = this.doc.getValue();
        var errors = [];
        
        if (!value)
            return this.sender.emit("annotate", []);
        try {
            errors = ptrparse.parse(value);
           
            
        } catch(e) {
        }
        this.sender.emit("annotate", errors);
    };

}).call(Worker.prototype);

});

define('ace/lib/oop', ['require', 'exports', 'module' ], function(require, exports, module) {


exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj;
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});
define('ace/worker/mirror', ['require', 'exports', 'module' , 'ace/document', 'ace/lib/lang'], function(require, exports, module) {


var Document = require("../document").Document;
var lang = require("../lib/lang");
    
var Mirror = exports.Mirror = function(sender) {
    this.sender = sender;
    var doc = this.doc = new Document("");
    
    var deferredUpdate = this.deferredUpdate = lang.delayedCall(this.onUpdate.bind(this));
    
    var _self = this;
    sender.on("change", function(e) {
        doc.applyDeltas(e.data);
        if (_self.$timeout)
            return deferredUpdate.schedule(_self.$timeout);
        _self.onUpdate();
    });
};

(function() {
    
    this.$timeout = 500;
    
    this.setTimeout = function(timeout) {
        this.$timeout = timeout;
    };
    
    this.setValue = function(value) {
        this.doc.setValue(value);
        this.deferredUpdate.schedule(this.$timeout);
    };
    
    this.getValue = function(callbackId) {
        this.sender.callback(this.doc.getValue(), callbackId);
    };
    
    this.onUpdate = function() {
    };
    
    this.isPending = function() {
        return this.deferredUpdate.isPending();
    };
    
}).call(Mirror.prototype);

});

define('ace/document', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/range', 'ace/anchor'], function(require, exports, module) {


var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Anchor = require("./anchor").Anchor;

var Document = function(text) {
    this.$lines = [];
    if (text.length == 0) {
        this.$lines = [""];
    } else if (Array.isArray(text)) {
        this._insertLines(0, text);
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);
    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length == 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        }
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        this.$autoNewLine = match ? match[1] : "\n";
    };
    this.getNewLineCharacter = function() {
        switch (this.$newLineMode) {
          case "windows":
            return "\r\n";
          case "unix":
            return "\n";
          default:
            return this.$autoNewLine;
        }
    };

    this.$autoNewLine = "\n";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
    };
    this.getNewLineMode = function() {
        return this.$newLineMode;
    };
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };
    this.getLength = function() {
        return this.$lines.length;
    };
    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.getLine(range.start.row)
                .substring(range.start.column, range.end.column);
        }
        var lines = this.getLines(range.start.row, range.end.row);
        lines[0] = (lines[0] || "").substring(range.start.column);
        var l = lines.length - 1;
        if (range.end.row - range.start.row == l)
            lines[l] = lines[l].substring(0, range.end.column);
        return lines.join(this.getNewLineCharacter());
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        } else if (position.row < 0)
            position.row = 0;
        return position;
    };
    this.insert = function(position, text) {
        if (!text || text.length === 0)
            return position;

        position = this.$clipPosition(position);
        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var lines = this.$split(text);
        var firstLine = lines.splice(0, 1)[0];
        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

        position = this.insertInLine(position, firstLine);
        if (lastLine !== null) {
            position = this.insertNewLine(position); // terminate first line
            position = this._insertLines(position.row, lines);
            position = this.insertInLine(position, lastLine || "");
        }
        return position;
    };
    this.insertLines = function(row, lines) {
        if (row >= this.getLength())
            return this.insert({row: row, column: 0}, "\n" + lines.join("\n"));
        return this._insertLines(Math.max(row, 0), lines);
    };
    this._insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};
        if (lines.length > 0xFFFF) {
            var end = this._insertLines(row, lines.slice(0xFFFF));
            lines = lines.slice(0, 0xFFFF);
        }

        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);

        var range = new Range(row, 0, row + lines.length, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._signal("change", { data: delta });
        return end || range.end;
    };
    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

        var end = {
            row : position.row + 1,
            column : 0
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._signal("change", { data: delta });

        return end;
    };
    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;

        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._signal("change", { data: delta });

        return end;
    };
    this.remove = function(range) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;

        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
            var lastFullRow = lastRow - 1;

            if (range.end.column > 0)
                this.removeInLine(lastRow, 0, range.end.column);

            if (lastFullRow >= firstFullRow)
                this._removeLines(firstFullRow, lastFullRow);

            if (firstFullRow != firstRow) {
                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                this.removeNewLine(range.start.row);
            }
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };
    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;

        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);

        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._signal("change", { data: delta });
        return range.start;
    };
    this.removeLines = function(firstRow, lastRow) {
        if (firstRow < 0 || lastRow >= this.getLength())
            return this.remove(new Range(firstRow, 0, lastRow + 1, 0));
        return this._removeLines(firstRow, lastRow);
    };

    this._removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow + 1, 0);
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._signal("change", { data: delta });
        return removed;
    };
    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);

        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;

        this.$lines.splice(row, 2, line);

        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._signal("change", { data: delta });
    };
    this.replace = function(range, text) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        if (text.length == 0 && range.isEmpty())
            return range.start;
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }

        return end;
    };
    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text);
            else if (delta.action == "removeLines")
                this._removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "removeText")
                this.remove(range);
        }
    };
    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];

            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this._removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "insertText")
                this.remove(range);
            else if (delta.action == "removeLines")
                this._insertLines(range.start.row, delta.lines);
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text);
        }
    };
    this.indexToPosition = function(index, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        for (var i = startRow || 0, l = lines.length; i < l; i++) {
            index -= lines[i].length + newlineLength;
            if (index < 0)
                return {row: i, column: index + lines[i].length + newlineLength};
        }
        return {row: l-1, column: lines[l-1].length};
    };
    this.positionToIndex = function(pos, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        var index = 0;
        var row = Math.min(pos.row, lines.length);
        for (var i = startRow || 0; i < row; ++i)
            index += lines[i].length + newlineLength;

        return index + pos.column;
    };

}).call(Document.prototype);

exports.Document = Document;
});

define('ace/lib/event_emitter', ['require', 'exports', 'module' ], function(require, exports, module) {


var EventEmitter = {};
var stopPropagation = function() { this.propagationStopped = true; };
var preventDefault = function() { this.defaultPrevented = true; };

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    if (typeof e != "object" || !e)
        e = {};

    if (!e.type)
        e.type = eventName;
    if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
    if (!e.preventDefault)
        e.preventDefault = preventDefault;

    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
};


EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
        return;
    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++)
        listeners[i](e, this);
};

EventEmitter.once = function(eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
        _self.removeEventListener(eventName, newCallback);
        callback.apply(null, arguments);
    });
};


EventEmitter.setDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        handlers = this._defaultHandlers = {_disabled_: {}};
    
    if (handlers[eventName]) {
        var old = handlers[eventName];
        var disabled = handlers._disabled_[eventName];
        if (!disabled)
            handlers._disabled_[eventName] = disabled = [];
        disabled.push(old);
        var i = disabled.indexOf(callback);
        if (i != -1) 
            disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
};
EventEmitter.removeDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        return;
    var disabled = handlers._disabled_[eventName];
    
    if (handlers[eventName] == callback) {
        var old = handlers[eventName];
        if (disabled)
            this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
        var i = disabled.indexOf(callback);
        if (i != -1)
            disabled.splice(i, 1);
    }
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
    return callback;
};

EventEmitter.off =
EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
};

exports.EventEmitter = EventEmitter;

});

define('ace/range', ['require', 'exports', 'module' ], function(require, exports, module) {

var comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};
var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {
    this.isEqual = function(range) {
        return this.start.row === range.start.row &&
            this.end.row === range.end.row &&
            this.start.column === range.start.column &&
            this.end.column === range.end.column;
    };
    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };
    this.compareRange = function(range) {
        var cmp,
            end = range.end,
            start = range.start;

        cmp = this.compare(end.row, end.column);
        if (cmp == 1) {
            cmp = this.compare(start.row, start.column);
            if (cmp == 1) {
                return 2;
            } else if (cmp == 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (cmp == -1) {
            return -2;
        } else {
            cmp = this.compare(start.row, start.column);
            if (cmp == -1) {
                return -1;
            } else if (cmp == 1) {
                return 42;
            } else {
                return 0;
            }
        }
    };
    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    };
    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function(range) {
        var cmp = this.compareRange(range);
        return (cmp == -1 || cmp == 0 || cmp == 1);
    };
    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    };
    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    };
    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    };
    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    };
    this.inside = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column) || this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideStart = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideEnd = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow)
            var end = {row: lastRow + 1, column: 0};
        else if (this.end.row < firstRow)
            var end = {row: firstRow, column: 0};

        if (this.start.row > lastRow)
            var start = {row: lastRow + 1, column: 0};
        else if (this.start.row < firstRow)
            var start = {row: firstRow, column: 0};

        return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row === this.end.row && this.start.column === this.end.column);
    };
    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };
    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };
    this.toScreenRange = function(session) {
        var screenPosStart = session.documentToScreenPosition(this.start);
        var screenPosEnd = session.documentToScreenPosition(this.end);

        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };
    this.moveBy = function(row, column) {
        this.start.row += row;
        this.start.column += column;
        this.end.row += row;
        this.end.column += column;
    };

}).call(Range.prototype);
Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};
Range.comparePoints = comparePoints;

Range.comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};


exports.Range = Range;
});

define('ace/anchor', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter'], function(require, exports, module) {


var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

var Anchor = exports.Anchor = function(doc, row, column) {
    this.$onChange = this.onChange.bind(this);
    this.attach(doc);
    
    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);
};

(function() {

    oop.implement(this, EventEmitter);
    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
    this.getDocument = function() {
        return this.document;
    };
    this.$insertRight = false;
    this.onChange = function(e) {
        var delta = e.data;
        var range = delta.range;

        if (range.start.row == range.end.row && range.start.row != this.row)
            return;

        if (range.start.row > this.row)
            return;

        if (range.start.row == this.row && range.start.column > this.column)
            return;

        var row = this.row;
        var column = this.column;
        var start = range.start;
        var end = range.end;

        if (delta.action === "insertText") {
            if (start.row === row && start.column <= column) {
                if (start.column === column && this.$insertRight) {
                } else if (start.row === end.row) {
                    column += end.column - start.column;
                } else {
                    column -= start.column;
                    row += end.row - start.row;
                }
            } else if (start.row !== end.row && start.row < row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "insertLines") {
            if (start.row <= row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "removeText") {
            if (start.row === row && start.column < column) {
                if (end.column >= column)
                    column = start.column;
                else
                    column = Math.max(0, column - (end.column - start.column));

            } else if (start.row !== end.row && start.row < row) {
                if (end.row === row)
                    column = Math.max(0, column - end.column) + start.column;
                row -= (end.row - start.row);
            } else if (end.row === row) {
                row -= end.row - start.row;
                column = Math.max(0, column - end.column) + start.column;
            }
        } else if (delta.action == "removeLines") {
            if (start.row <= row) {
                if (end.row <= row)
                    row -= end.row - start.row;
                else {
                    row = start.row;
                    column = 0;
                }
            }
        }

        this.setPosition(row, column, true);
    };
    this.setPosition = function(row, column, noClip) {
        var pos;
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        } else {
            pos = this.$clipPositionToDocument(row, column);
        }

        if (this.row == pos.row && this.column == pos.column)
            return;

        var old = {
            row: this.row,
            column: this.column
        };

        this.row = pos.row;
        this.column = pos.column;
        this._signal("change", {
            old: old,
            value: pos
        });
    };
    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    this.attach = function(doc) {
        this.document = doc || this.document;
        this.document.on("change", this.$onChange);
    };
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};

        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }

        if (column < 0)
            pos.column = 0;

        return pos;
    };

}).call(Anchor.prototype);

});

define('ace/lib/lang', ['require', 'exports', 'module' ], function(require, exports, module) {


exports.last = function(a) {
    return a[a.length - 1];
};

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function (obj) {
    if (typeof obj !== "object" || !obj)
        return obj;
    var cons = obj.constructor;
    if (cons === RegExp)
        return obj;
    
    var copy = cons();
    for (var key in obj) {
        if (typeof obj[key] === "object") {
            copy[key] = exports.deepCopy(obj[key]);
        } else {
            copy[key] = obj[key];
        }
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};
exports.deferredCall = function(fcn) {

    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };
    
    deferred.isPending = function() {
        return timer;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};
});
define('ace/mode/ptr/ptrparse', ['require', 'exports', 'module' ], function(require, exports, module) {

var PTRPARSER = (function(){

      var mssgStack=[];
      
      var contextStack=[];
      
      function pushContext( svgEleInfo){
          if(cursorPos){
              if(
                  (svgEleInfo.location.start.offset <=cursorPos) &&
                  (cursorPos <= svgEleInfo.location.offset)
                  ){
                  contextStack.push(
                      {
                          token: svgEleInfo.token,
                          location: svgEleInfo.location
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
   "a" : [ "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "display", "enable.background", "externalResourcesRequired", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "target", "transform", "visibility", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "view" : [ "externalResourcesRequired", "id", "preserveAspectRatio", "viewBox", "viewTarget", "xml.base", "xml.lang", "xml.space", "zoomAndPan" ],
  "text" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "cxy", "direction", "display", "display", "dominant.baseline", "dx", "dxy", "dy", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "font.family", "font.size", "font.size.adjust", "font.stretch", "font.style", "font.variant", "font.weight", "glyph.orientation.horizontal", "glyph.orientation.vertical", "id", "kerning", "lengthAdjust", "letter.spacing", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "requiredExtensions", "requiredFeatures", "rotate", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "text.anchor", "text.decoration", "text.rendering", "textLength", "transform", "unicode.bidi", "visibility", "visibility", "word.spacing", "writing.mode", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "tspan" : [ "alignment.baseline", "baseline.shift", "class", "color", "cxy", "direction", "display", "dominant.baseline", "dx", "dxy", "dy", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "font.family", "font.size", "font.size.adjust", "font.stretch", "font.style", "font.variant", "font.weight", "glyph.orientation.horizontal", "glyph.orientation.vertical", "id", "kerning", "lengthAdjust", "letter.spacing", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "requiredExtensions", "requiredFeatures", "rotate", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "text.anchor", "text.decoration", "textLength", "unicode.bidi", "visibility", "word.spacing", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "tref" : [ "alignment.baseline", "baseline.shift", "class", "color", "direction", "display", "dominant.baseline", "dx", "dxy", "dy", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "font.family", "font.size", "font.size.adjust", "font.stretch", "font.style", "font.variant", "font.weight", "glyph.orientation.horizontal", "glyph.orientation.vertical", "id", "kerning", "lengthAdjust", "letter.spacing", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "requiredExtensions", "requiredFeatures", "rotate", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "text.anchor", "text.decoration", "textLength", "unicode.bidi", "visibility", "word.spacing", "x", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "textPath" : [ "alignment.baseline", "baseline.shift", "class", "color", "cxy", "direction", "display", "dominant.baseline", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "font.family", "font.size", "font.size.adjust", "font.stretch", "font.style", "font.variant", "font.weight", "glyph.orientation.horizontal", "glyph.orientation.vertical", "id", "kerning", "lengthAdjust", "letter.spacing", "method", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "requiredExtensions", "requiredFeatures", "spacing", "startOffset", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "text.anchor", "text.decoration", "textLength", "unicode.bidi", "visibility", "word.spacing", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "altGlyph" : [ "alignment.baseline", "baseline.shift", "class", "color", "direction", "display", "dominant.baseline", "dx", "dxy", "dy", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "font.family", "font.size", "font.size.adjust", "font.stretch", "font.style", "font.variant", "font.weight", "format", "glyph.orientation.horizontal", "glyph.orientation.vertical", "glyphRef", "id", "kerning", "letter.spacing", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "requiredExtensions", "requiredFeatures", "rotate", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "text.anchor", "text.decoration", "unicode.bidi", "visibility", "word.spacing", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "altGlyphDef" : [ "id", "xml.base", "xml.lang", "xml.space" ],
  "altGlyphItem" : [ "id", "xml.base", "xml.lang", "xml.space" ],
  "glyphRef" : [ "class", "dx", "dxy", "dy", "format", "glyphRef", "id", "style", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "animate" : [ "accumulate", "additive", "attributeName", "attributeType", "begin", "by", "calcMode", "color.interpolation", "color.rendering", "dur", "end", "externalResourcesRequired", "fill", "from", "id", "keySplines", "keyTimes", "max", "min", "onbegin", "onend", "onload", "onrepeat", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "systemLanguage", "to", "values", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "set" : [ "attributeName", "attributeType", "begin", "dur", "end", "externalResourcesRequired", "fill", "id", "max", "min", "onbegin", "onend", "onload", "onrepeat", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "systemLanguage", "to", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "animateMotion" : [ "accumulate", "additive", "begin", "by", "calcMode", "dur", "end", "externalResourcesRequired", "fill", "from", "id", "keyPoints", "keySplines", "keyTimes", "max", "min", "onbegin", "onend", "onload", "onrepeat", "origin", "path", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "rotate", "systemLanguage", "to", "values", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "mpath" : [ "externalResourcesRequired", "id", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "animateColor" : [ "accumulate", "additive", "attributeName", "attributeType", "begin", "by", "calcMode", "color.interpolation", "color.rendering", "dur", "end", "externalResourcesRequired", "fill", "from", "id", "keySplines", "keyTimes", "max", "min", "onbegin", "onend", "onload", "onrepeat", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "systemLanguage", "to", "values", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "animateTransform" : [ "accumulate", "additive", "attributeName", "attributeType", "begin", "by", "calcMode", "dur", "end", "externalResourcesRequired", "fill", "from", "id", "keySplines", "keyTimes", "max", "min", "onbegin", "onend", "onload", "onrepeat", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "restart", "systemLanguage", "to", "type", "values", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "rect" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "cxy", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "height", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "requiredExtensions", "requiredFeatures", "rx", "rxy", "ry", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "circle" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "cx", "cxy", "cy", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "r", "requiredExtensions", "requiredFeatures", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "xml.base", "xml.lang", "xml.space" ],
  "ellipse" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "cx", "cxy", "cy", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "requiredExtensions", "requiredFeatures", "rx", "rxy", "ry", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "xml.base", "xml.lang", "xml.space" ],
  "line" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "id", "marker.end", "marker.end", "marker.mid", "marker.mid", "marker.start", "marker.start", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "requiredExtensions", "requiredFeatures", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "x1", "x12", "x2", "xml.base", "xml.lang", "xml.space", "xy1", "xy2", "y1", "y12", "y2" ],
  "polyline" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "id", "marker.end", "marker.end", "marker.mid", "marker.mid", "marker.start", "marker.start", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "points", "requiredExtensions", "requiredFeatures", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "xml.base", "xml.lang", "xml.space" ],
  "polygon" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "id", "marker.end", "marker.end", "marker.mid", "marker.mid", "marker.start", "marker.start", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "points", "requiredExtensions", "requiredFeatures", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "xml.base", "xml.lang", "xml.space" ],
  "clipPath" : [ "class", "clip.path", "clipPathUnits", "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "xml.base", "xml.lang", "xml.space" ],
  "mask" : [ "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "cxy", "enable.background", "externalResourcesRequired", "height", "id", "mask", "maskContentUnits", "maskUnits", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "color.profile" : [ "id", "local", "name", "rendering.intent", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "cursor" : [ "externalResourcesRequired", "id", "requiredExtensions", "requiredFeatures", "systemLanguage", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "svg" : [ "baseProfile", "class", "clip", "clip.path", "color.interpolation", "color.rendering", "contentScriptType", "contentStyleType", "cursor", "cxy", "display", "enable.background", "externalResourcesRequired", "filter", "height", "id", "mask", "onabort", "onactivate", "onclick", "onerror", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onresize", "onscroll", "onunload", "onzoom", "opacity", "overflow", "preserveAspectRatio", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "version", "viewBox", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y", "zoomAndPan" ],
  "g" : [ "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "display", "enable.background", "externalResourcesRequired", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "xml.base", "xml.lang", "xml.space" ],
  "defs" : [ "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "enable.background", "externalResourcesRequired", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "xml.base", "xml.lang", "xml.space" ],
  "desc" : [ "class", "id", "style", "xml.base", "xml.lang", "xml.space" ],
  "title" : [ "class", "id", "style", "xml.base", "xml.lang", "xml.space" ],
  "symbol" : [ "class", "clip", "clip.path", "color.interpolation", "color.rendering", "cursor", "enable.background", "externalResourcesRequired", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "overflow", "preserveAspectRatio", "style", "viewBox", "xml.base", "xml.lang", "xml.space" ],
  "use" : [ "class", "clip.path", "clip.rule", "color.interpolation", "color.rendering", "cursor", "cxy", "display", "externalResourcesRequired", "filter", "height", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pointer.events", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "visibility", "wh", "width", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "image" : [ "class", "clip", "clip.path", "clip.rule", "color.interpolation", "color.profile", "color.rendering", "cursor", "cxy", "display", "externalResourcesRequired", "filter", "height", "id", "image.rendering", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "overflow", "pointer.events", "preserveAspectRatio", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "visibility", "wh", "width", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "switch" : [ "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "display", "enable.background", "externalResourcesRequired", "filter", "id", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "xml.base", "xml.lang", "xml.space" ],
  "filter" : [ "class", "cxy", "externalResourcesRequired", "filterRes", "filterUnits", "height", "id", "primitiveUnits", "style", "wh", "width", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feDistantLight" : [ "azimuth", "elevation", "id", "xml.base", "xml.lang", "xml.space" ],
  "fePointLight" : [ "id", "x", "xml.base", "xml.lang", "xml.space", "xyz", "y", "z" ],
  "feSpotLight" : [ "id", "limitingConeAngle", "pointsAtX", "pointsAtXYZ", "pointsAtY", "pointsAtZ", "specularExponent", "x", "xml.base", "xml.lang", "xml.space", "xyz", "y", "z" ],
  "feBlend" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "in12", "in2", "mode", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feColorMatrix" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "result", "style", "type", "values", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feComponentTransfer" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feFuncR" : [ "amplitude", "exponent", "id", "intercept", "offset", "slope", "tableValues", "type", "xml.base", "xml.lang", "xml.space" ],
  "feFuncG" : [ "amplitude", "exponent", "id", "intercept", "offset", "slope", "tableValues", "type", "xml.base", "xml.lang", "xml.space" ],
  "feFuncB" : [ "amplitude", "exponent", "id", "intercept", "offset", "slope", "tableValues", "type", "xml.base", "xml.lang", "xml.space" ],
  "feFuncA" : [ "amplitude", "exponent", "id", "intercept", "offset", "slope", "tableValues", "type", "xml.base", "xml.lang", "xml.space" ],
  "feComposite" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "in12", "in2", "k1", "k1234", "k2", "k3", "k4", "operator", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feConvolveMatrix" : [ "bias", "class", "color.interpolation.filters", "cxy", "divisor", "edgeMode", "height", "id", "in1", "kernelMatrix", "kernelUnitLength", "order", "preserveAlpha", "result", "style", "targetX", "targetXY", "targetY", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feDiffuseLighting" : [ "class", "color", "color.interpolation.filters", "cxy", "diffuseConstant", "height", "id", "in1", "kernelUnitLength", "lighting.color", "result", "style", "surfaceScale", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feDisplacementMap" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "in12", "in2", "result", "scale", "style", "wh", "width", "x", "xChannelSelector", "xml.base", "xml.lang", "xml.space", "xy", "y", "yChannelSelector" ],
  "feFlood" : [ "class", "color", "color.interpolation.filters", "cxy", "flood.color", "flood.opacity", "height", "id", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feGaussianBlur" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "result", "stdDeviation", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feImage" : [ "class", "color.interpolation.filters", "cxy", "externalResourcesRequired", "height", "id", "preserveAspectRatio", "result", "style", "wh", "width", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feMerge" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feMergeNode" : [ "id", "in1", "xml.base", "xml.lang", "xml.space" ],
  "feMorphology" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "operator", "radius", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feOffset" : [ "class", "color.interpolation.filters", "cxy", "dx", "dxy", "dy", "height", "id", "in1", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feSpecularLighting" : [ "class", "color", "color.interpolation.filters", "cxy", "height", "id", "in1", "kernelUnitLength", "lighting.color", "result", "specularConstant", "specularExponent", "style", "surfaceScale", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feTile" : [ "class", "color.interpolation.filters", "cxy", "height", "id", "in1", "result", "style", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "feTurbulence" : [ "baseFrequency", "class", "color.interpolation.filters", "cxy", "height", "id", "numOctaves", "result", "seed", "stitchTiles", "style", "type", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "font" : [ "class", "externalResourcesRequired", "horiz.adv.x", "horiz.origin.x", "horiz.origin.xy", "horiz.origin.y", "id", "style", "vert.adv.y", "vert.origin.x", "vert.origin.xy", "vert.origin.y", "xml.base", "xml.lang", "xml.space" ],
  "glyph" : [ "arabic.form", "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "d", "enable.background", "filter", "glyph.name", "horiz.adv.x", "id", "lang", "mask", "opacity", "orientation", "style", "unicode", "vert.adv.y", "vert.origin.x", "vert.origin.xy", "vert.origin.y", "xml.base", "xml.lang", "xml.space" ],
  "missing.glyph" : [ "class", "clip.path", "color.interpolation", "color.rendering", "cursor", "d", "enable.background", "filter", "horiz.adv.x", "id", "mask", "opacity", "style", "vert.adv.y", "vert.origin.x", "vert.origin.xy", "vert.origin.y", "xml.base", "xml.lang", "xml.space" ],
  "hkern" : [ "g1", "g12", "g2", "id", "k", "u1", "u12", "u2", "xml.base", "xml.lang", "xml.space" ],
  "vkern" : [ "g1", "g12", "g2", "id", "k", "u1", "u12", "u2", "xml.base", "xml.lang", "xml.space" ],
  "font.face" : [ "accent.height", "alphabetic", "ascent", "bbox", "cap.height", "descent", "font.family", "font.size", "font.stretch", "font.style", "font.variant", "font.weight", "hanging", "id", "ideographic", "mathematical", "overline.position", "overline.thickness", "panose.1", "slope", "stemh", "stemv", "strikethrough.position", "strikethrough.thickness", "underline.position", "underline.thickness", "unicode.range", "units.per.em", "v.alphabetic", "v.hanging", "v.ideographic", "v.mathematical", "widths", "x.height", "xml.base", "xml.lang", "xml.space" ],
  "font.face.src" : [ "id", "xml.base", "xml.lang", "xml.space" ],
  "font.face.uri" : [ "id", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "font.face.format" : [ "id", "string", "xml.base", "xml.lang", "xml.space" ],
  "font.face.name" : [ "id", "name", "xml.base", "xml.lang", "xml.space" ],
  "foreignObject" : [ "class", "clip", "cxy", "display", "externalResourcesRequired", "height", "id", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "overflow", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "transform", "wh", "width", "x", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "linearGradient" : [ "class", "colors", "externalResourcesRequired", "gradientTransform", "gradientUnits", "id", "offsets", "spreadMethod", "style", "x1", "x12", "x2", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy1", "xy2", "y1", "y12", "y2" ],
  "radialGradient" : [ "class", "colors", "cx", "cxy", "cy", "externalResourcesRequired", "fx", "fxy", "fy", "gradientTransform", "gradientUnits", "id", "offsets", "r", "spreadMethod", "style", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "stop" : [ "class", "color", "id", "offset", "stop.color", "stop.opacity", "style", "xml.base", "xml.lang", "xml.space" ],
  "pattern" : [ "class", "clip", "clip.path", "color.interpolation", "color.rendering", "cursor", "cxy", "enable.background", "externalResourcesRequired", "filter", "height", "id", "mask", "opacity", "overflow", "patternContentUnits", "patternTransform", "patternUnits", "preserveAspectRatio", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "viewBox", "wh", "width", "x", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space", "xy", "y" ],
  "marker" : [ "class", "clip", "clip.path", "color.interpolation", "color.rendering", "cursor", "enable.background", "externalResourcesRequired", "filter", "id", "markerHeight", "markerUnits", "markerWidth", "mask", "opacity", "orient", "overflow", "preserveAspectRatio", "refX", "refXY", "refY", "style", "viewBox", "xml.base", "xml.lang", "xml.space" ],
  "metadata" : [ "id", "xml.base", "xml.lang", "xml.space" ],
  "path" : [ "class", "clip.path", "clip.rule", "color", "color.interpolation", "color.rendering", "cursor", "d", "display", "externalResourcesRequired", "fill", "fill.opacity", "fill.rule", "filter", "id", "marker.end", "marker.end", "marker.mid", "marker.mid", "marker.start", "marker.start", "mask", "onactivate", "onclick", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "opacity", "pathLength", "pointer.events", "requiredExtensions", "requiredFeatures", "shape.rendering", "stroke", "stroke.dasharray", "stroke.dashoffset", "stroke.linecap", "stroke.linejoin", "stroke.miterlimit", "stroke.opacity", "stroke.width", "style", "systemLanguage", "transform", "visibility", "xml.base", "xml.lang", "xml.space" ],
  "script" : [ "externalResourcesRequired", "id", "type", "xlink.actuate", "xlink.arcrole", "xlink.href", "xlink.role", "xlink.show", "xlink.title", "xlink.type", "xml.base", "xml.lang", "xml.space" ],
  "style" : [ "id", "media", "title", "type", "xml.base", "xml.lang", "xml.space" ],
  "svgR" : [ "baseProfile", "class", "clip", "clip.path", "color.interpolation", "color.rendering", "contentScriptType", "contentStyleType", "cursor", "cxy", "display", "enable.background", "externalResourcesRequired", "filter", "height", "id", "mask", "onabort", "onactivate", "onclick", "onerror", "onfocusin", "onfocusout", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onresize", "onscroll", "onunload", "onzoom", "opacity", "overflow", "preserveAspectRatio", "requiredExtensions", "requiredFeatures", "style", "systemLanguage", "version", "viewBox", "wh", "width", "xml.base", "xml.lang", "xml.space", "xy", "zoomAndPan" ]
  };    


  var allElements = [
  "feComponentTransfer", "feSpecularLighting", "feDiffuseLighting", "feDisplacementMap", "animateTransform", "feConvolveMatrix", "font.face.format", "feDistantLight", "feGaussianBlur", "font.face.name", "linearGradient", "radialGradient", "animateMotion", "color.profile", "feColorMatrix", "font.face.src", "font.face.uri", "foreignObject", "missing.glyph", "altGlyphItem", "animateColor", "feMorphology", "fePointLight", "feTurbulence", "altGlyphDef", "feComposite", "feMergeNode", "feSpotLight", "font.face", "altGlyph", "clipPath", "feOffset", "glyphRef", "metadata", "polyline", "textPath", "animate", "ellipse", "feBlend", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feImage", "feMerge", "pattern", "polygon", "circle", "cursor", "feTile", "filter", "marker", "script", "switch", "symbol", "glyph", "hkern", "image", "mpath", "style", "title", "tspan", "vkern", "defs", "desc", "font", "line", "mask", "path", "rect", "stop", "svgR", "text", "tref", "view", "set", "svg", "use", "a", "g"
  ];

   var acceptContentEle = { 
  'a' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'view' : [ "desc", "title", "metadata" ],
  'text' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "tspan", "tref", "textPath", "altGlyph", "a" ],
  'tspan' : [ "desc", "title", "metadata", "a", "altGlyph", "animate", "animateColor", "set", "tref", "tspan" ],
  'tref' : [ "desc", "title", "metadata", "animate", "animateColor", "set" ],
  'textPath' : [ "desc", "title", "metadata", "a", "altGlyph", "animate", "animateColor", "set", "tref", "tspan" ],
  'altGlyphDef' : [ "glyphRef", "altGlyphItem" ],
  'altGlyphItem' : [ "glyphRef" ],
  'glyphRef' : [ "Empty." ],
  'animate' : [ "desc", "title", "metadata" ],
  'set' : [ "desc", "title", "metadata" ],
  'animateMotion' : [ "desc", "title", "metadata", "mpath" ],
  'mpath' : [ "desc", "title", "metadata" ],
  'animateColor' : [ "desc", "title", "metadata" ],
  'animateTransform' : [ "desc", "title", "metadata" ],
  'rect' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'circle' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'ellipse' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'line' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'polyline' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'polygon' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'clipPath' : [ "desc", "title", "metadata", "animate", "set", "animateMotion", "animateColor", "animateTransform", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "text", "use" ],
  'mask' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'color.profile' : [ "desc", "title", "metadata" ],
  'cursor' : [ "desc", "title", "metadata" ],
  'svg' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'g' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'defs' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'symbol' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'use' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'image' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'switch' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "a", "foreignObject", "g", "image", "svg", "switch", "text", "use" ],
  'filter' : [ "desc", "title", "metadata", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feFlood", "feGaussianBlur", "feImage", "feMerge", "feMorphology", "feOffset", "feSpecularLighting", "feTile", "feTurbulence", "animate", "set" ],
  'feDistantLight' : [ "animate", "set" ],
  'fePointLight' : [ "animate", "set" ],
  'feSpotLight' : [ "animate", "set" ],
  'feBlend' : [ "animate", "set" ],
  'feColorMatrix' : [ "animate", "set" ],
  'feComponentTransfer' : [ "feFuncA", "feFuncB", "feFuncG", "feFuncR" ],
  'feFuncR' : [ "animate", "set" ],
  'feFuncG' : [ "animate", "set" ],
  'feFuncB' : [ "animate", "set" ],
  'feFuncA' : [ "animate", "set" ],
  'feComposite' : [ "animate", "set" ],
  'feConvolveMatrix' : [ "animate", "set" ],
  'feDiffuseLighting' : [ "desc", "title", "metadata", "feDistantLight", "fePointLight", "feSpotLight" ],
  'feDisplacementMap' : [ "animate", "set" ],
  'feFlood' : [ "animate", "animateColor", "set" ],
  'feGaussianBlur' : [ "animate", "set" ],
  'feImage' : [ "animate", "animateTransform", "set" ],
  'feMerge' : [ "feMergeNode" ],
  'feMergeNode' : [ "animate", "set" ],
  'feMorphology' : [ "animate", "set" ],
  'feOffset' : [ "animate", "set" ],
  'feSpecularLighting' : [ "desc", "title", "metadata", "feDistantLight", "fePointLight", "feSpotLight" ],
  'feTile' : [ "animate", "set" ],
  'feTurbulence' : [ "animate", "set" ],
  'font' : [ "desc", "title", "metadata", "font.face", "glyph", "hkern", "missing.glyph", "vkern" ],
  'glyph' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'missing.glyph' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'hkern' : [ "Empty." ],
  'vkern' : [ "Empty." ],
  'font.face' : [ "desc", "title", "metadata", "font.face.src" ],
  'font.face.src' : [ "font.face.name", "font.face.uri" ],
  'font.face.uri' : [ "font.face.format" ],
  'font.face.format' : [ "Empty." ],
  'font.face.name' : [ "Empty." ],
  'linearGradient' : [ "desc", "title", "metadata", "animate", "animateTransform", "set", "stop" ],
  'radialGradient' : [ "desc", "title", "metadata", "animate", "animateTransform", "set", "stop" ],
  'stop' : [ "animate", "animateColor", "set" ],
  'pattern' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'marker' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  'path' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata" ],
  'svgR' : [ "animate", "set", "animateMotion", "animateColor", "animateTransform", "desc", "title", "metadata", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path", "svg", "g", "defs", "symbol", "use", "linearGradient", "radialGradient", "a", "altGlyphDef", "clipPath", "color.profile", "cursor", "filter", "font", "font.face", "foreignObject", "image", "marker", "mask", "pattern", "script", "style", "switch", "text", "view" ],
  };




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
      peg$c51 = "=",
      peg$c52 = peg$literalExpectation("=", false),
      peg$c53 = "...",
      peg$c54 = peg$literalExpectation("...", false),
      peg$c55 = ",",
      peg$c56 = peg$literalExpectation(",", false),
      peg$c57 = function() {
          addError( "comma issues", location() ); 
          return "comma";
      },
      peg$c58 = function() { 
          addError( "comma issues", location() ); 
          return "comma";
      },
      peg$c59 = "[",
      peg$c60 = peg$literalExpectation("[", false),
      peg$c61 = "]",
      peg$c62 = peg$literalExpectation("]", false),
      peg$c63 = "[[",
      peg$c64 = peg$literalExpectation("[[", false),
      peg$c65 = "]]",
      peg$c66 = peg$literalExpectation("]]", false),
      peg$c67 = function(head, tail, rightParen) {
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
           if( options.cursorPos ){
               pushContext(result);
           }
          return result;
      },
      peg$c68 = function(attr) {
         var result;
         result= new SvgAttrInfo(attr, location());
         return result;},
      peg$c69 = function() {
          var result = elem;
          return result;
      },
      peg$c70 = function(head, tail) {   
          var result=tail, loc;
          if(result){
              loc=location();
          } else {
          }
          return result;
      },
      peg$c71 = function(tail) { 
          var result=tail;
          addError( "comma issues", location() ); 
          return result;
      },
      peg$c72 = function(tail) {
          var result=tail;
          var resultType;
          if(result){
              resultType = typeof result;
          } else {
          }
          return result;
      },
      peg$c73 = function(head, tail) {
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
      peg$c74 = /^[><:+&*\-.$=\/]/,
      peg$c75 = peg$classExpectation([">", "<", ":", "+", "&", "*", "-", ".", "$", "=", "/"], false, false),
      peg$c76 = "%",
      peg$c77 = peg$literalExpectation("%", false),
      peg$c78 = "<<-",
      peg$c79 = peg$literalExpectation("<<-", false),
      peg$c80 = "->>",
      peg$c81 = peg$literalExpectation("->>", false),
      peg$c82 = ":::",
      peg$c83 = peg$literalExpectation(":::", false),
      peg$c84 = "<-",
      peg$c85 = peg$literalExpectation("<-", false),
      peg$c86 = "==",
      peg$c87 = peg$literalExpectation("==", false),
      peg$c88 = "::",
      peg$c89 = peg$literalExpectation("::", false),
      peg$c90 = ">=",
      peg$c91 = peg$literalExpectation(">=", false),
      peg$c92 = "!=",
      peg$c93 = peg$literalExpectation("!=", false),
      peg$c94 = "||",
      peg$c95 = peg$literalExpectation("||", false),
      peg$c96 = "&&",
      peg$c97 = peg$literalExpectation("&&", false),
      peg$c98 = ":=",
      peg$c99 = peg$literalExpectation(":=", false),
      peg$c100 = "<=",
      peg$c101 = peg$literalExpectation("<=", false),
      peg$c102 = "->",
      peg$c103 = peg$literalExpectation("->", false),
      peg$c104 = "$",
      peg$c105 = peg$literalExpectation("$", false),
      peg$c106 = "@",
      peg$c107 = peg$literalExpectation("@", false),
      peg$c108 = "^",
      peg$c109 = peg$literalExpectation("^", false),
      peg$c110 = ":",
      peg$c111 = peg$literalExpectation(":", false),
      peg$c112 = "*",
      peg$c113 = peg$literalExpectation("*", false),
      peg$c114 = "/",
      peg$c115 = peg$literalExpectation("/", false),
      peg$c116 = ">",
      peg$c117 = peg$literalExpectation(">", false),
      peg$c118 = "<",
      peg$c119 = peg$literalExpectation("<", false),
      peg$c120 = "&",
      peg$c121 = peg$literalExpectation("&", false),
      peg$c122 = "|",
      peg$c123 = peg$literalExpectation("|", false),
      peg$c124 = "~",
      peg$c125 = peg$literalExpectation("~", false),
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
                    }
                    if (s1 !== peg$FAILED) {
                      s2 = peg$parseexpr();
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
          s3 = peg$c51;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
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
        if (input.substr(peg$currPos, 3) === peg$c53) {
          s0 = peg$c53;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
      }
    }

    return s0;
  }

  function peg$parseformalCombo1() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s1 = peg$c55;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c56); }
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
        s3 = peg$c55;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
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
      s1 = peg$c57();
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
          s3 = peg$c51;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
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
        if (input.substr(peg$currPos, 3) === peg$c53) {
          s0 = peg$c53;
          peg$currPos += 3;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
      }
    }

    return s0;
  }

  function peg$parseparamCombo1() {
    var s0, s1, s2, s3;

    s0 = peg$currPos;
    if (input.charCodeAt(peg$currPos) === 44) {
      s1 = peg$c55;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c56); }
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
        s3 = peg$c55;
        peg$currPos++;
      } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
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
      s1 = peg$c58();
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
        s2 = peg$c59;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesublist();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 93) {
                s6 = peg$c61;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c62); }
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
      if (input.substr(peg$currPos, 2) === peg$c63) {
        s2 = peg$c63;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parse_();
        if (s3 !== peg$FAILED) {
          s4 = peg$parsesublist();
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c65) {
                s6 = peg$c65;
                peg$currPos += 2;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c66); }
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
                s1 = peg$c67(s1, s4, s6);
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
          s3 = peg$c51;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parse_();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseexpr();
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c68(s1);
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
        if (input.substr(peg$currPos, 3) === peg$c53) {
          s1 = peg$c53;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c54); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c69();
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
      s2 = peg$c55;
      peg$currPos++;
    } else {
      s2 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c56); }
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
        s1 = peg$c70(s1, s2);
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
        s2 = peg$c55;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }
      if (s2 === peg$FAILED) {
        s2 = peg$parsesvgRparameter();
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c71(s2);
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
        s1 = peg$c72(s2);
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
        s1 = peg$c73(s1, s2);
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

    if (peg$c74.test(input.charAt(peg$currPos))) {
      s0 = input.charAt(peg$currPos);
      peg$currPos++;
    } else {
      s0 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c75); }
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
      s1 = peg$c76;
      peg$currPos++;
    } else {
      s1 = peg$FAILED;
      if (peg$silentFails === 0) { peg$fail(peg$c77); }
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
          s3 = peg$c76;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c77); }
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
      if (input.substr(peg$currPos, 3) === peg$c78) {
        s0 = peg$c78;
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c79); }
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
            if (input.substr(peg$currPos, 2) === peg$c84) {
              s0 = peg$c84;
              peg$currPos += 2;
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
                                if (input.charCodeAt(peg$currPos) === 36) {
                                  s0 = peg$c104;
                                  peg$currPos++;
                                } else {
                                  s0 = peg$FAILED;
                                  if (peg$silentFails === 0) { peg$fail(peg$c105); }
                                }
                                if (s0 === peg$FAILED) {
                                  if (input.charCodeAt(peg$currPos) === 64) {
                                    s0 = peg$c106;
                                    peg$currPos++;
                                  } else {
                                    s0 = peg$FAILED;
                                    if (peg$silentFails === 0) { peg$fail(peg$c107); }
                                  }
                                  if (s0 === peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 94) {
                                      s0 = peg$c108;
                                      peg$currPos++;
                                    } else {
                                      s0 = peg$FAILED;
                                      if (peg$silentFails === 0) { peg$fail(peg$c109); }
                                    }
                                    if (s0 === peg$FAILED) {
                                      if (input.charCodeAt(peg$currPos) === 58) {
                                        s0 = peg$c110;
                                        peg$currPos++;
                                      } else {
                                        s0 = peg$FAILED;
                                        if (peg$silentFails === 0) { peg$fail(peg$c111); }
                                      }
                                      if (s0 === peg$FAILED) {
                                        if (input.charCodeAt(peg$currPos) === 42) {
                                          s0 = peg$c112;
                                          peg$currPos++;
                                        } else {
                                          s0 = peg$FAILED;
                                          if (peg$silentFails === 0) { peg$fail(peg$c113); }
                                        }
                                        if (s0 === peg$FAILED) {
                                          if (input.charCodeAt(peg$currPos) === 47) {
                                            s0 = peg$c114;
                                            peg$currPos++;
                                          } else {
                                            s0 = peg$FAILED;
                                            if (peg$silentFails === 0) { peg$fail(peg$c115); }
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
                                                  s0 = peg$c116;
                                                  peg$currPos++;
                                                } else {
                                                  s0 = peg$FAILED;
                                                  if (peg$silentFails === 0) { peg$fail(peg$c117); }
                                                }
                                                if (s0 === peg$FAILED) {
                                                  if (input.charCodeAt(peg$currPos) === 60) {
                                                    s0 = peg$c118;
                                                    peg$currPos++;
                                                  } else {
                                                    s0 = peg$FAILED;
                                                    if (peg$silentFails === 0) { peg$fail(peg$c119); }
                                                  }
                                                  if (s0 === peg$FAILED) {
                                                    if (input.charCodeAt(peg$currPos) === 38) {
                                                      s0 = peg$c120;
                                                      peg$currPos++;
                                                    } else {
                                                      s0 = peg$FAILED;
                                                      if (peg$silentFails === 0) { peg$fail(peg$c121); }
                                                    }
                                                    if (s0 === peg$FAILED) {
                                                      if (input.charCodeAt(peg$currPos) === 124) {
                                                        s0 = peg$c122;
                                                        peg$currPos++;
                                                      } else {
                                                        s0 = peg$FAILED;
                                                        if (peg$silentFails === 0) { peg$fail(peg$c123); }
                                                      }
                                                      if (s0 === peg$FAILED) {
                                                        if (input.charCodeAt(peg$currPos) === 126) {
                                                          s0 = peg$c124;
                                                          peg$currPos++;
                                                        } else {
                                                          s0 = peg$FAILED;
                                                          if (peg$silentFails === 0) { peg$fail(peg$c125); }
                                                        }
                                                        if (s0 === peg$FAILED) {
                                                          if (input.charCodeAt(peg$currPos) === 61) {
                                                            s0 = peg$c51;
                                                            peg$currPos++;
                                                          } else {
                                                            s0 = peg$FAILED;
                                                            if (peg$silentFails === 0) { peg$fail(peg$c52); }
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
      if (input.substr(peg$currPos, 3) === peg$c53) {
        s0 = peg$c53;
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
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
        s0 = peg$c55;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
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
    console.log(message);
    console.log(location.start.line);
    console.log(location.start.column);
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
    var options={cursorPos: _cursorPos};
    var context=[];
    try{
        if( _input  && 
            "string"=== typeof _input && 
            _input.length >0
        ){    
            result = peg$parse(_input, options );
            var maxStart =-2;
            contextStack.foreach( 
                function( contx ){
                    if(contx.location.start.pos > maxStart){
                        maxStart=contx.location.start.pos ;
                        context=contx.token;
                    }
                }
            );
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
    return context;
};


function ptr$availableCompletions( _input, _cursorPos ){
    mssgStack.length=0;
    var cntx = ptr$context( _input, _cursorPos );
    available=[];
    if(cntx.length()>0){
        var tok = cntx[0];
        var availAttr= acceptedAttributes[tok];
        var availCntnt= acceptContentEle[tok];
        available= availAttr.concat(availCntnt);
    }
    return available;
}


return {
  version: '0.2.0',
  parse: ptr$parse,
  context: ptr$context,
  avail:  ptr$availableCompletions
};

})();

module.exports.PTRPARSER = PTRPARSER;




});
