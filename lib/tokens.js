/*
 * LazyK-JS /lib/tokens.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function endModule() {
    module.exports = Object.freeze({
        "Token"      : Token,
        "S"          : S,
        "K"          : K,
        "I"          : I,
        "Iota"       : Iota,
        "Application": Application
    });
}

var lambda = require("./lambda.js");

function Token(srcPos) {
    if (!(this instanceof Token)) {
        return new Token(srcPos);
    }
    this.srcPos = srcPos;
}

Token.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Token
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return "?";
        }
    },
    "toExpression": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            throw new Error("invalid token");
        }
    }
});

function S(srcPos) {
    if (!(this instanceof S)) {
        return new S(srcPos);
    }
    Token.call(this, srcPos);
}

S.prototype = Object.create(Token.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": S
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return "S";
        }
    },
    "toExpression": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new lambda.Variable(this.srcPos, "S");
        }
    }
});

function K(srcPos) {
    if (!(this instanceof K)) {
        return new K(srcPos);
    }
    Token.call(this, srcPos);
}

K.prototype = Object.create(Token.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": K
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return "K";
        }
    },
    "toExpression": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new lambda.Variable(this.srcPos, "K");
        }
    }
});

function I(srcPos) {
    if (!(this instanceof I)) {
        return new I(srcPos);
    }
    Token.call(this, srcPos);
}

I.prototype = Object.create(Token.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": I
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return "I";
        }
    },
    "toExpression": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new lambda.Variable(this.srcPos, "I");
        }
    }
});

function Iota(srcPos) {
    if (!(this instanceof Iota)) {
        return new Iota(srcPos);
    }
    Token.call(this, srcPos);
}

Iota.prototype = Object.create(Token.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Iota
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return "i";
        }
    },
    "toExpression": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new lambda.Variable(this.srcPos, "iota");
        }
    }
});

function Application(srcPos, func, arg) {
    if (!(this instanceof Application)) {
        return new Application(srcPos, func, arg);
    }
    Token.call(this, srcPos);
    this.func = func;
    this.arg  = arg;
}

Application.prototype = Object.create(Token.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Application
    },
    "toString": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return "`" + this.func.toString() + this.arg.toString();
        }
    },
    "toExpression": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new lambda.Application(
                this.srcPos,
                this.func.toExpression(),
                this.arg.toExpression()
            );
        }
    }
});

endModule();
