'use strict';

const {compose, identity} = require('fantasy-combinators');
const daggy = require('daggy');

const Coyoneda = daggy.tagged('f', 'x');

Coyoneda.lift = function(x) {
    return Coyoneda(identity, x);
};

Coyoneda.prototype.map = function(f) {
    return Coyoneda(compose(f)(this.f), this.x);
};

Coyoneda.prototype.lower = function() {
    return this.x.map(this.f);
};

// Export
if (typeof module != 'undefined')
    module.exports = Coyoneda;
