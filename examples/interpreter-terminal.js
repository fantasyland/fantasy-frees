var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
    tuples      = require('fantasy-tuples'),
    readin      = require('readline-sync'),

    Lens  = require('fantasy-lenses').Lens,
    State = require('fantasy-states'),

    compose  = combinators.compose,
    constant = combinators.constant,
    identity = combinators.identity,

    Free   = fantasia.Free,
    Unit   = fantasia.Unit,

    Tuple2 = tuples.Tuple2,

    Mock = daggy.tagged('in', 'out'),
    Real = daggy.tagged('out'),
    TerminalOp = daggy.taggedSum({
        ReadLine:  [],
        WriteLine: ['a']
    }),

    interpreters;

Mock.prototype.read = function() {
    return Tuple2(
        this.in.length < 1 ? "" : this.in.concat().shift(),
        Mock(this.in.slice(1), this.out)
    );
};

Mock.prototype.write = function(x) {
    return Mock(this.in, x);
};

Real.prototype.read = function() {
    var result = readin.question('');
    return Tuple2(
        result,
        Real(this.out)
    );
};

Real.prototype.write = function(x) {
    return Real(x);
};

TerminalOp.prototype.toString = function() {
    return this.cata({
        ReadLine: function() {
            return 'ReadLine()';
        },
        WriteLine: function(x) {
            return 'WriteLine(' + x + ')';
        }
    });
};

function readLine() {
    return Free.liftFC(TerminalOp.ReadLine);
}

function writeLine(x) {
    return Free.liftFC(TerminalOp.WriteLine(x));
}

interpreters = {
    pure : function(program) {
        return program.cata({
            ReadLine: function() {
                return State(function(env) {
                    return env.read();
                });
            },
            WriteLine: function(value) {
                return State(function(env) {
                    return Tuple2(null, env.write(value));
                });
            }
        });
    }
};


(function() {

    var script = readLine().chain(function(x) {
            return readLine().chain(function(y) {
                // FIXME : This should just be `x + " " + y`
                return writeLine(x.x + " " + y.x);
            });
        }),
        mock = Mock(["Hello", "World"], []),
        real = Real([]);

    console.log('--------------------------------------------');
    console.log(Free.runFC(script, interpreters.pure, State).exec(mock).out);
    console.log(Free.runFC(script, interpreters.pure, State).exec(real).out);
    console.log('--------------------------------------------');
})()