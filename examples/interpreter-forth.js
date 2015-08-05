var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
    tuples      = require('fantasy-tuples'),

    Lens  = require('fantasy-lenses').Lens,
    State = require('fantasy-states'),

    compose  = combinators.compose,
    constant = combinators.constant,
    identity = combinators.identity,

    Free   = fantasia.Free,
    Unit   = fantasia.Unit,

    Tuple2 = tuples.Tuple2,

    Forth = daggy.taggedSum({
        Push: ['a', 'next'],
        Add:  ['next'],
        Mul:  ['next'],
        Dup:  ['next'],
        End:  ['next']
    }),

    interpreters;

Forth.prototype.toString = function() {
    var named = function(name) {
        return function(x) {
            return 'Forth.' + name + '(' + x + ')';
        };
    };
    return this.cata({
        Push: function(x, y) {
            return 'Forth.Push(' + x + ', ' + y.toString() + ')';
        },
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

interpreters = {
    pure : function(program) {
        return program.cata({
            Push: function(value, next) {
                return State(function(stack) {
                    return Tuple2(next, [value].concat(stack));
                });
            },
            Add: function(next) {
                return State(function(stack) {
                    var x = stack[0],
                        y = stack[1];
                    return Tuple2(next, [x + y].concat(stack.slice(2)));
                });
            },
            Mul: function(next) {
                return State(function(stack) {
                    var x = stack[0],
                        y = stack[1];
                    return Tuple2(next, [x * y].concat(stack.slice(2)));
                });
            },
            Dup: function(next) {
                return State(function(stack) {
                    var x = stack[0];
                    return Tuple2(next, [x].concat(stack));
                });
            },
            End: function(next) {
                return State(function(stack) {
                    return Tuple2(next, stack);
                });
            }
        });
    }
};


(function() {

    var script = push(3)
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
})()