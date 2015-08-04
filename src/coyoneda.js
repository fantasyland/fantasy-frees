var combinators = require('fantasy-combinators'),
    daggy = require('daggy'),

    compose = combinators.compose,
    identity = combinators.identity,

    Coyoneda = daggy.tagged('f', 'x');

Coyoneda.liftCoyoneda = function(c) {
    return Coyoneda(identity, c);
};

Coyoneda.prototype.func = function() {
    return this.f;
};

Coyoneda.prototype.value = function() {
    return this.x;
};

Coyoneda.prototype.map = function(f) {
    return Coyoneda(compose(f)(this.func()), this.value());
};

Coyoneda.prototype.toString = function() {
    return 'Coyoneda(' + this.f + ', ' + this.x + ')';
}

// Export
if (typeof module != 'undefined')
    module.exports = Coyoneda;
