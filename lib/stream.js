/*
 * LazyK-JS /lib/stream.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function endModule() {
    module.exports = Object.freeze({
        "Stream"      : Stream,
        "InputStream" : InputStream,
        "StringStream": StringStream,

        "istream": istream,
        "ostream": ostream
    });
}

var lambda = require("./lambda.js");

function Stream() {
    if (!(this instanceof Stream)) {
        return new Stream();
    }
}

Stream.prototype = Object.create(Object.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": Stream
    },
    "head": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            throw new Error("invalid stream");
        }
    },
    "tail": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            throw new Error("invalid stream");
        }
    }
});

function InputStream(input, index) {
    if (!(this instanceof InputStream)) {
        return new InputStream(input, index);
    }
    this.input = input;
    this.index = index;
}

InputStream.prototype = Object.create(Stream.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": InputStream
    },
    "head": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return this.input(this.index);
        }
    },
    "tail": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new InputStream(this.input, this.index + 1);
        }
    }
});

function StringStream(str) {
    if (!(this instanceof StringStream)) {
        return new StringStream(str);
    }
    this.str = str;
}

StringStream.prototype = Object.create(Stream.prototype, {
    "constructor": {
        "writable"    : true,
        "configurable": true,
        "value": StringStream
    },
    "head": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            if (this.str.length === 0) {
                return Promise.resolve(256);
            }
            return Promise.resolve(this.str.charCodeAt(0));
        }
    },
    "tail": {
        "writable"    : true,
        "configurable": true,
        "value": function () {
            return new StringStream(this.str.slice(1));
        }
    }
});

function istream(stream) {
    return lambda.Lazy.val(_cons =>
        new lambda.Lazy(() =>
            _cons.eval().then(__cons => {
                if (typeof __cons !== "function") {
                    throw new lambda.Exception(["input"], "invalid application");
                }
                return __cons(new lambda.Lazy(() =>
                        stream.head().then(n => churchNumeral(n))
                    )).eval().then(__cons_ => {
                        if (typeof __cons_ !== "function") {
                            throw new lambda.Exception(["input"], "invalid application");
                        }
                        return __cons_(istream(stream.tail()));
                    });
            })
        )
    );
}

function churchNumeral(n) {
    return lambda.Lazy.val(_f =>
        lambda.Lazy.val(_x =>
            new lambda.Lazy(() =>
                _f.eval().then(__f => {
                    if (typeof __f !== "function") {
                        throw new lambda.Exception(["input"], "invalid application");
                    }
                    var _k = _x;
                    var c = n;
                    while (c > 0) {
                        _k = __f(_k);
                        c--;
                    }
                    return _k;
                })
            )
        )
    );
}

var _succ = lambda.Lazy.val(_n =>
    new lambda.Lazy(() =>
        _n.eval().then(__n => __n + 1)
    )
);
var _zero = lambda.Lazy.val(0);

function ostream(output, exit) {
    return lambda.Lazy.val(_stream =>
        new lambda.Lazy(() =>
            _stream.eval().then(__stream => {
                if (typeof __stream !== "function") {
                    throw new lambda.Exception(["output"], "invalid output");
                }
                return __stream(
                    lambda.Lazy.val(_car =>
                        lambda.Lazy.val(_cdr =>
                            new lambda.Lazy(() =>
                                _car.eval().then(__car => {
                                    if (typeof __car !== "function") {
                                        throw new lambda.Exception(["output"], "invalid output");
                                    }
                                    return __car(_succ).eval().then(__car_ => {
                                        if (typeof __car_ !== "function") {
                                            throw new lambda.Exception(["output"], "invalid output");
                                        }
                                        return __car_(_zero).eval().then(__n => {
                                            if (__n < 0x100) {
                                                output(String.fromCharCode(__n));
                                            }
                                            else {
                                                var code = __n - 0x100;
                                                exit(code);
                                                throw new lambda.Exception(["output"], "exit " + (code).toString());
                                            }
                                            return ostream(output, exit).eval().then(__ostream =>
                                                __ostream(_cdr)
                                            );
                                        });
                                    });
                                })
                            )
                        )
                    )
                );
            })
        )
    );
}

endModule();
