'use strict';

const daggy = require('daggy');

const {compose, identity} = require('fantasy-combinators');
const {Free} = require('./../fantasy-frees');
const {Coproduct} = require('fantasy-coproducts');
const IO = require('fantasy-io');


const FPrint = daggy.tagged('s', 'a');
const FRead = daggy.tagged('f');
const unit = daggy.tagged('x');
const Unit = () => unit('');

FPrint.prototype.map = function(f) {
    return FPrint(this.s, f(this.a));
};

FRead.prototype.map = function(f) {
    return FRead(compose(f)(this.f));
};

function fprint(s) {
    return FPrint(s, Unit());
}

function fread() {
    return FRead(identity);
}

const readPrint = Free.liftF(Coproduct.left(fprint("Hello, name?"))).chain((_) => {
    return Free.liftF(Coproduct.right(fread())).chain((name) => {
        return Free.liftF(Coproduct.left(fprint("Hi " + name + "!")));
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
                (read) => runIO(read.f("Timmy"))
            );
        },
        IO.of
    );
};

runIO(readPrint).unsafePerform();
