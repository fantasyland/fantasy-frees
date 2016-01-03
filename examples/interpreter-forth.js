'use strict';

const daggy = require('daggy');

const {compose, constant, identity} = require('fantasy-combinators');
const {Free} = require('./../fantasy-frees');
const {Tuple2} = require('fantasy-tuples');
const {Lens}  = require('fantasy-lenses');
const State = require('fantasy-states');

const Forth = daggy.taggedSum({
    Push: ['a', 'next'],
    Add:  ['next'],
    Mul:  ['next'],
    Dup:  ['next'],
    End:  ['next']
});
const unit = daggy.tagged('x');
const Unit = () => unit('');

Forth.prototype.toString = function() {
    const named = (name) => (x) => 'Forth.' + name + '(' + x + ')';
    return this.cata({
        Push: (x, y) =>'Forth.Push(' + x + ', ' + y.toString() + ')',
        Add: named('Add'),
        Mul: named('Mul'),
        Dup: named('Dup'),
        End: named('End'),
    });
};

function push(val) {
    return Free.liftFC(Forth.Push(val, Unit()));
}

function add() {
    return Free.liftFC(Forth.Add(Unit()));
}

function mul() {
    return Free.liftFC(Forth.Mul(Unit()));
}

function dup() {
    return Free.liftFC(Forth.Dup(Unit()));
}

function end() {
    return Free.liftFC(Forth.End(Unit()));
}

const interpreters = {
    pure : (program) => {
        return program.cata({
            Push: (value, next) => {
                return State((stack) => Tuple2(next, [value].concat(stack)));
            },
            Add: (next) => {
                return State((stack) => {
                    const x = stack[0];
                    const y = stack[1];
                    return Tuple2(next, [x + y].concat(stack.slice(2)));
                });
            },
            Mul: (next) => {
                return State((stack) => {
                    const x = stack[0];
                    const y = stack[1];
                    return Tuple2(next, [x * y].concat(stack.slice(2)));
                });
            },
            Dup: (next) => {
                return State((stack) => {
                    const x = stack[0];
                    return Tuple2(next, [x].concat(stack));
                });
            },
            End: (next) => {
                return State((stack) => Tuple2(next, stack));
            }
        });
    }
};

const script = push(3)
    .andThen(push(6))
    .andThen(add())
    .andThen(push(7))
    .andThen(push(2))
    .andThen(add())
    .andThen(mul())
    .andThen(dup())
    .andThen(add())
    .andThen(end())

console.log('--------------------------------------------');
console.log(Free.runFC(script, interpreters.pure, State).exec([]));
console.log('--------------------------------------------');
