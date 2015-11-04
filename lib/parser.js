/*
 * LazyK-JS /lib/parser.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function endModule() {
    module.exports = Object.freeze({
        "parse": parse
    });
}

var lq = require("loquat");

var tokens = require("./tokens.js");

var langDef = new lq.LanguageDef(
    "",
    "",
    "#",
    false,
    undefined,
    undefined,
    undefined,
    undefined,
    [],
    [],
    true
);
var tp = lq.makeTokenParser(langDef);
var lexeme = tp.lexeme;
var symbol = tp.symbol;

function token(p) {
    return lq.getPosition.bind(pos => lexeme(p).then(lq.pure(pos)));
}

var ccExpr = new lq.LazyParser(function () {
    return lq.choice([
        expr.many1().bind(es =>
        lq.pure(es.reduce((p, e) => new tokens.Application(e.srcPos, p, e)))
        ),
        lq.getPosition.bind(pos =>
        lq.eof.then(
        lq.pure(new tokens.I(pos))
        ))
    ]);
});

var zero =
    token(lq.char("0")).bind(pos =>
    lq.pure({ "pos": pos, "value": 0 })
    );
var one =
    token(lq.char("1")).bind(pos =>
    lq.pure({ "pos": pos, "value": 1 })
    );
var nonEmptyJotExpr =
    lq.getPosition.bind(pos =>
    zero.or(one).many1().bind(seq =>
    lq.pure(seq.reduce(
        (p, e) => {
            switch (e.value) {
                case 0:
                    return new tokens.Application(
                        pos,
                        new tokens.Application(
                            pos,
                            p,
                            new tokens.S(pos)
                        ),
                        new tokens.K(pos)
                    );
                case 1:
                    return new tokens.Application(
                        pos,
                        new tokens.S(pos),
                        new tokens.Application(
                            pos,
                            new tokens.K(pos),
                            p
                        )
                    );
            }
        },
        new tokens.I(pos)
    ))
    ));

var I =
    token(lq.char("I")).bind(pos =>
    lq.pure(new tokens.I(pos))
    );
var K =
    token(lq.char("K").or(lq.char("k"))).bind(pos =>
    lq.pure(new tokens.K(pos))
    );
var S =
    token(lq.char("S").or(lq.char("s"))).bind(pos =>
    lq.pure(new tokens.S(pos))
    );
var app =
    lq.getPosition.bind(pos =>
    symbol("`").then(
    expr.bind(e1 =>
    expr.bind(e2 =>
    lq.pure(new tokens.Application(pos, e1, e2))
    ))));
var iotaApp = 
    lq.getPosition.bind(pos =>
    symbol("*").then(
    iotaExpr.bind(e1 =>
    iotaExpr.bind(e2 =>
    lq.pure(new tokens.Application(pos, e1, e2))
    ))));
var expr_ = lq.choice([
    I,
    K,
    S,
    nonEmptyJotExpr,
    app,
    iotaApp,
    tp.parens(ccExpr)
]);

var i =
    token(lq.char("i")).bind(pos =>
    lq.pure(new tokens.I(pos))
    );
var expr = i.or(expr_);

var iota =
    token(lq.char("i")).bind(pos =>
    lq.pure(new tokens.Iota(pos))
    );
var iotaExpr = iota.or(expr_);

var program = tp.whiteSpace.then(ccExpr);

function parse(name, src) {
    var res = lq.parse(program, name, src, 1);
    if (res.succeeded) {
        return res.value;
    }
    else {
        throw res.error;
    }
}

endModule();
