'use strict';

const {compose, identity} = require('fantasy-combinators');
const daggy = require('daggy');

const Yoneda = daggy.tagged('f');

Yoneda.lift = function(x) {
    return Yoneda((y) => x.map(y));
};

Yoneda.prototype.map = function(f) {
    return Yoneda((x) => this.run(compose(x)(f)));
};

Yoneda.prototype.lower = function() {
    return this.f(identity);
};

Yoneda.prototype.run = function(k) {
    return this.f(k);
};

// Export
if (typeof module != 'undefined')
    module.exports = Yoneda;
