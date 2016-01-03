'use strict';

const daggy = require('daggy');
const readin = require('readline-sync');

const {compose, constant, identity} = require('fantasy-combinators');
const {Free} = require('./../fantasy-frees');
const {Tuple2} = require('fantasy-tuples');
const {Lens}  = require('fantasy-lenses');
const State = require('fantasy-states');

const Mock = daggy.tagged('in', 'out');
const Real = daggy.tagged('out');
const TerminalOp = daggy.taggedSum({
    ReadLine:  [],
    WriteLine: ['a']
});

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
    const result = readin.question('');
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
        ReadLine: () => 'ReadLine()',
        WriteLine: (x) => 'WriteLine(' + x + ')'
    });
};

function readLine() {
    return Free.liftFC(TerminalOp.ReadLine);
}

function writeLine(x) {
    return Free.liftFC(TerminalOp.WriteLine(x));
}

interpreters = {
    pure : (program) => {
        return program.cata({
            ReadLine: () => {
                return State((env) => env.read());
            },
            WriteLine: (value) => {
                return State.modify((env) => env.write(value));
            }
        });
    }
};

const script = readLine().chain((x) => {
    return readLine().chain((y) => {
        return writeLine(x + " " + y);
    });
});
const mock = Mock(["Hello", "World"], []);
const real = Real([]);

console.log('--------------------------------------------');
console.log(Free.runFC(script, interpreters.pure, State).exec(mock).out);
console.log(Free.runFC(script, interpreters.pure, State).exec(real).out);
console.log('--------------------------------------------');
