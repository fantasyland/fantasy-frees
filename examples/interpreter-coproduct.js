'use strict';

const daggy = require('daggy');

const {compose, identity} = require('fantasy-combinators');
const {Free} = require('./../fantasy-frees');
const Coproduct = require('fantasy-coproducts');
const IO = require('fantasy-io');


const FPrint = daggy.tagged('s', 'a');
const FRead = daggy.tagged('f');
const unit = daggy.tagged('x');
const Unit = () => unit('');

const Logger = daggy.taggedSum({
    Error: ['x', 'a'],
    Debug: ['x', 'a']
});

FPrint.prototype.map = function(f) {
    return FPrint(this.s, f(this.a));
};

FRead.prototype.map = function(f) {
    return FRead(compose(f)(this.f));
};

Logger.prototype.map = function(f) {
    return this.cata({
        Error: (a, b) => Logger.Error(a, f(b)),
        Debug: (a, b) => Logger.Debug(a, f(b))
    });
};

function fprint(s) {
    return FPrint(s, Unit());
}

function fread() {
    return FRead(identity);
}

function debug(x) {
    return Logger.Debug(x, Unit());
}

function error(x) {
    return Logger.Error(x, Unit());
}

function left(x) {
    return Coproduct.left(x);
}

function right(x) {
    return Coproduct.right(x);
}

function liftLeft(x) {
    return Free.liftF(left(x));
}

function liftRight(x) {
    return Free.liftF(right(x));
}

const readPrint = liftLeft(fprint("Hello, name?")).chain((_) => {
    return liftRight(left(fread())).chain((name) => {
        return liftRight(right(debug(name))).chain((_) => {
            return liftLeft(fprint("Hi " + name + "!"));
        });
    });
});

function runIO(free) {
    return free.resume().fold(
        (x) => {
            return x.coproduct(
                (print) => {
                    console.log(print.s);
                    return runIO(print.a);
                },
                (y) => {
                    return y.coproduct(
                        (read) => {
                            return runIO(read.f("Timmy"))
                        },
                        (log) => {
                            log.cata({
                                Error: (x) => console.log('Error', x),
                                Debug: (x) => console.log('Debug', x)
                            });
                            return runIO(log.a);
                        }
                    );
                }
            );
        },
        IO.of
    );
};

runIO(readPrint).unsafePerform();
