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
    var done = false;
    while(!done) {
        x = x.resume().cata({
            Left: function(x) {
                return x();
            },
            Right: function(x) {
                done = true;
                return x;
            }
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