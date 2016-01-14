'use strict';

const {identity} = require('fantasy-combinators');
const Free = require('./free');

const done = (x) => Free.of(x);
const suspend = (x) => Free.Suspend(x);
const delay = (x) => suspend(done(x));

function run(x) {
    var done = false;

    const left = (f) => f();
    const right = (x) => {
        done = true;
        return x;
    };
    while(!done) {
        x = x.resume().cata({
            Left: left,
            Right: right
        });
    }
    return x;
}

module.exports = {delay, done, run, suspend};