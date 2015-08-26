var combinators = require('fantasy-combinators'),
    identity = combinators.identity,

    Free = require('./free');

function done(x) {
    return Free.of(x);
}

function suspend(x) {
    return Free.Suspend(x);
}

function delay(x) {
    return suspend(done(x));
}

function run(x) {
    var done = false,
        left = function(f) {
            return f();
        },
        right = function(x) {
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

// Export
if (typeof module != 'undefined')
    module.exports = {
        delay  : delay,
        done   : done,
        run    : run,
        suspend: suspend
    };