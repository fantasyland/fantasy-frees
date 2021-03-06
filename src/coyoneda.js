'use strict';

const {compose, identity} = require('fantasy-combinators');
const {tagged} = require('daggy');
const {map} = require('fantasy-land');

const Coyoneda = tagged('f', 'x');

Coyoneda.lift = function(x) {
    return Coyoneda(identity, x);
};

Coyoneda.prototype[map] = function(f) {
    return Coyoneda(compose(f)(this.f), this.x);
};

Coyoneda.prototype.lower = function() {
    return this.x[map](this.f);
};

module.exports = Coyoneda;