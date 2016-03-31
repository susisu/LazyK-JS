/*
 * LazyK-JS /lib/lambda.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function endModule() {
    module.exports = Object.freeze({
        "Lazy": Lazy,

        "Exception": Exception,
        "Exit"     : Exit,

        "Expression" : Expression,
        "Literal"    : Literal,
        "Variable"   : Variable,
        "Lambda"     : Lambda,
        "Application": Application
    });
}

function Lazy(func) {
    if (!(this instanceof Lazy)) {
        return new Lazy(func);
    }
    this.func = func;
    this.promise;
}

Object.defineProperties(Lazy, {
    "val": {
        "writable"    : true,
        "configurable": true,
        "value": function (x) {
            return Lazy(() => Promise.resolve(x));
        }
    }
});

Lazy.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Lazy
    },
    "eval": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            if (!this.promise) {
                this.promise = this.func.call(this)
                    .then(_x => _x instanceof Lazy ? _x.eval() : _x);
            }
            return this.promise;
        }
    }
});

function Exception(trace, message) {
    if (!(this instanceof Exception)) {
        return new Exception(trace, message);
    }
    this.trace   = trace.slice();
    this.message = message;
}

Exception.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Exception
    },
    "addSourcePos": {
        "writable"    : true,
        "configurable": true,
        "value": function (srcPos) {
            return new Exception(this.trace.concat(srcPos), this.message);
        }
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            var traceStr =
                this.trace
                    .filter(srcPos => srcPos !== undefined)
                    .map(srcPos => srcPos.toString())
                    .reverse()
                    .join(":\n");
            if (traceStr.length > 0) {
                return traceStr + ":\n" + this.message;
            }
            else {
                return this.message;
            }
        }
    }
});

function Exit(trace, code) {
    if (!(this instanceof Exit)) {
        return new Exit(trace, code);
    }
    this.trace = trace.slice();
    this.code  = code;
}

Exit.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Exit
    },
    "addSourcePos": {
        "writable"    : true,
        "configurable": true,
        "value": function (srcPos) {
            return new Exit(this.trace.concat(srcPos), this.code);
        }
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            var traceStr =
                this.trace
                    .filter(srcPos => srcPos !== undefined)
                    .map(srcPos => srcPos.toString())
                    .reverse()
                    .join(":\n");
            if (traceStr.length > 0) {
                return traceStr + ":\nexit " + this.code.toString();
            }
            else {
                return this.code;
            }
        }
    }
});

function Expression(srcPos) {
    if (!(this instanceof Expression)) {
        return new Expression(srcPos);
    }
    this.srcPos = srcPos;
}

Expression.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Expression
    },
    "generate": {
        "writable"    : true,
        "configurable": true,
        "value": function (env) {
            return Lazy(() => Promise.reject(new Exception([this.srcPos], "undefined expression")));
        }
    }
});

function Literal(srcPos, val) {
    if (!(this instanceof Literal)) {
        return new Literal(srcPos, val);
    }
    Expression.call(this, srcPos);
    this.val = val;
}

Literal.prototype = Object.create(Expression.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Literal
    },
    "generate": {
        "writable"    : true,
        "configurable": true,
        "value": function (env) {
            return Lazy(() => Promise.resolve(this.val));
        }
    }
});

function Variable(srcPos, name) {
    if (!(this instanceof Variable)) {
        return new Variable(srcPos, name);
    }
    Expression.call(this, srcPos);
    this.name = name;
}

Variable.prototype = Object.create(Expression.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Variable
    },
    "generate": {
        "writable"    : true,
        "configurable": true,
        "value": function (env) {
            return Lazy(() => {
                if (env[this.name] === undefined) {
                    return Promise.reject(new Exception([this.srcPos], "unbound variable"));
                }
                return Promise.resolve(env[this.name]);
            });
        }
    }
});

function Lambda(srcPos, argName, body) {
    if (!(this instanceof Lambda)) {
        return new Lambda(srcPos, argName, body);
    }
    Expression.call(this, srcPos);
    this.argName = argName;
    this.body    = body;
}
Lambda.prototype = Object.create(Expression.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Lambda
    },
    "generate": {
        "writable"    : true,
        "configurable": true,
        "value": function (env) {
            return Lazy(() => Promise.resolve(_arg => {
                var local = Object.create(env);
                local[this.argName] = _arg;
                return this.body.generate(local);
            }));
        }
    }
});

function Application(srcPos, func, arg) {
    if (!(this instanceof Application)) {
        return new Application(srcPos, func, arg);
    }
    Expression.call(this, srcPos);
    this.func = func;
    this.arg  = arg;
}

Application.prototype = Object.create(Expression.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Application
    },
    "generate": {
        "writable"    : true,
        "configurable": true,
        "value": function (env) {
            var _func = this.func.generate(env);
            var _arg  = this.arg.generate(env);
            return Lazy(() => _func.eval().then(__func => {
                if (typeof __func !== "function") {
                    throw new Exception([this.srcPos], "invalid application");
                }
                return new Lazy(() =>
                    __func(_arg).eval().catch(err => {
                        throw err.addSourcePos(this.srcPos);
                    })
                );
            }));
        }
    }
});

endModule();
