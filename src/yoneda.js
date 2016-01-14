'use strict';

const {compose, identity} = require('fantasy-combinators');
const {tagged} = require('daggy');
const {map} = require('fantasy-land');

const Yoneda = tagged('f');

Yoneda.lift = (x) => Yoneda((y) => x[map](y));

Yoneda.prototype[map] = function(f) {
    return Yoneda((x) => this.run(compose(x)(f)));
};

Yoneda.prototype.lower = function() {
    return this.f(identity);
};

Yoneda.prototype.run = function(k) {
    return this.f(k);
};

module.exports = Yoneda;