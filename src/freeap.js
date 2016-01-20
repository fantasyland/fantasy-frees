'use strict';

const {taggedSum} = require('daggy');
const {compose, identity} = require('fantasy-combinators');
const Const = require('fantasy-consts');
const {of, ap, map} = require('fantasy-land');

const FreeAp = taggedSum({
    Pure: ['a'],
    Ap: ['a', 'f']
});

FreeAp[of] = FreeAp.Pure;

FreeAp.lift = (x) => {
    return FreeAp.Ap(x, FreeAp.Pure(identity));
};

FreeAp.prototype[ap] = function(f) {
    return this.cata({
        Pure: (g) => f[map](g),
        Ap: (x, y) => FreeAp.Ap(x, f[ap](y[map]((g) => (a) => (b) => g(b, a))))
    });
};

FreeAp.prototype[map] = function(f) {
    return this.cata({
        Pure: (a) => FreeAp.Pure(f(a)),
        Ap: (x, y) => FreeAp.Ap(x, y[map](compose(f)))
    });
};

FreeAp.prototype.foldMap = function(f, p) {
    return this.cata({
        Pure: FreeAp.Pure,
        Ap: (x, y) => y.foldMap(f)[ap](f(x))
    });
};

FreeAp.prototype.analyze = function(f) {
    return this.foldMap((a) => Const(f(a))).x;
};

module.exports = FreeAp;