var combinators = require('fantasy-combinators'),
    daggy = require('daggy'),

    compose = combinators.compose,
    identity = combinators.identity,

    Yoneda = daggy.tagged('f');

Yoneda.lift = function(x) {
    return Yoneda(function(y) {
        return y.map(x);
    });
};

Yoneda.prototype.map = function(f) {
    var self = this;
    return Yoneda(function(x) {
        return self.run(compose(k)(f));
    });
};

Yoneda.prototype.lower = function() {
    return this.f(identity)
};

Yoneda.prototype.run = function(k) {
    return this.f(k);
};

// Export
if (typeof module != 'undefined')
    module.exports = Yoneda;
