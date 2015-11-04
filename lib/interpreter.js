/*
 * LazyK-JS /lib/interpreter.js
 * copyright (c) 2015 Susisu
 */

"use strict";

function endModule() {
    module.exports = Object.freeze({
        "run": run
    });
}

var lambda = require("./lambda.js");
var parser = require("./parser.js");
var stream = require("./stream.js");

var prelude = Object.create(null);
prelude["S"] =
    new lambda.Lambda(undefined, "x",
        new lambda.Lambda(undefined, "y",
            new lambda.Lambda(undefined, "z",
                new lambda.Application(
                    undefined,
                    new lambda.Application(
                        undefined,
                        new lambda.Variable(undefined, "x"),
                        new lambda.Variable(undefined, "z")
                    ),
                    new lambda.Application(
                        undefined,
                        new lambda.Variable(undefined, "y"),
                        new lambda.Variable(undefined, "z")
                    )
                )
            )
        )
    ).generate(prelude);
prelude["K"] =
    new lambda.Lambda(undefined, "x",
        new lambda.Lambda(undefined, "y",
            new lambda.Variable(undefined, "x")
        )
    ).generate(prelude);
prelude["I"] =
    new lambda.Lambda(undefined, "x",
        new lambda.Variable(undefined, "x")
    ).generate(prelude);
prelude["iota"] =
    new lambda.Lambda(undefined, "x",
        new lambda.Application(
            undefined,
            new lambda.Application(
                undefined,
                new lambda.Variable(undefined, "x"),
                new lambda.Variable(undefined, "S")
            ),
            new lambda.Variable(undefined, "K")
        )
    ).generate(prelude);
Object.freeze(prelude);

function run(name, src, input, output, exit) {
    var token = parser.parse(name, src);
    var expr  = token.toExpression();
    var istream = new lambda.Literal(
        "input",
        stream.istream(input)
    );
    var ostream = new lambda.Literal(
        "output",
        stream.ostream(output, exit)
    );
    expr = new lambda.Application(
        "output",
        ostream,
        new lambda.Application(
            "input",
            expr,
            istream
        )
    );
    var _expr = expr.generate(prelude);
    return _expr.eval();
}

endModule();
