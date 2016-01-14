'use struct';

const {tagged, taggedSum} = require('daggy');
const {FreeAp} = require('../fantasy-frees');
const {constant, identity} = require('fantasy-combinators');

const List = taggedSum({
    Cons: ['head', 'tail'],
    Nil: []
});
List.of = (x) => List.Cons(x, List.Nil);
List.empty = () => List.Nil;
List.prototype.reverse = function() {
    const go = (x, acc) => {
        return x.cata({
            Nil: constant(acc),
            Cons: (x, xs) => go(xs, List.Cons(x, acc))
        });
    };
    return go(this, List.Nil);
};
List.prototype.foldl = function(f, a) {
    const go = (x, acc) => {
        return x.cata({
            Nil: constant(acc),
            Cons: (x, xs) => go(xs, f(acc, x))
        });
    };
    return go(this, a);
};
List.prototype.concat = function(a) {
    const go = (x, y) => {
        return x.cata({
            Nil: constant(y),
            Cons: (a, b) => go(b, List.Cons(a, y))
        });
    };
    return go(this.reverse(), a);
};

const unit = tagged('x');
const Unit = () => unit('');

// Actual program.

const AsmF = taggedSum({
    Push: ['value', 'next'],
    Pop: ['next'],
    Sum: ['value'],
    Mul: ['value']
});

const dsl = {
    push: (value) => FreeAp.lift(AsmF.Push(value, Unit())),
    pop: (field) => FreeAp.lift(AsmF.Pop(identity)),
    sum: (field) => FreeAp.lift(AsmF.Sum(identity)),
    mul: (field) => FreeAp.lift(AsmF.Mul(identity))
};

const print = (p) => {
    return p.analyze((p) => {
        return p.cata({
            Push: (v) => List.of('push ' + v),
            Pop: () => List.of('pop'),
            Sum: () => List.of('sum'),
            Mul: () => List.of('mul')
        });
    }).reverse().foldl((a, b) => a + '\n' + b, 'Print >');
};

// Something is broken here!
// As the ap composition laws don't hold true!
const program = dsl.push(1).ap(
                dsl.push(2).ap(
                dsl.mul().ap(
                dsl.sum().ap(
                dsl.push(9)
                ))));
console.log(print(program));