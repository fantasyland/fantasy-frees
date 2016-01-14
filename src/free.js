'use strict';

const {compose, constant} = require('fantasy-combinators');
const {point} = require('fantasy-sorcery');
const {taggedSum} = require('daggy');
const {of, map, ap, chain} = require('fantasy-land');

const Either = require('fantasy-eithers');
const Coyoneda = require('./coyoneda');

const Free = taggedSum({
    Return:  ['x'],
    Suspend: ['x'],
    Chain:   ['x', 'f']
});

Free[of] = Free.Return;

Free.liftF = (c) => Free.Suspend(c[map](Free.Return));

Free.liftFC = (c) => Free.liftF(Coyoneda.lift(c));

Free.runFC = (m, f, p) => {
    return m.foldMap((coyo) => f(coyo.x)[map](coyo.f), p);
};

Free.prototype[chain] = function(f) {
    const val = () => Free.Chain(this, f);
    return this.cata({
        Return: val,
        Suspend: val,
        Chain: (y, g) => {
            return Free.Chain(y, (x) => Free.Chain(g(x), f));
        },
    });
};

Free.prototype[ap] = function(x) {
    return this[chain]((f) => x[map](f));
};

Free.prototype[map] = function(f) {
    return this[chain](compose(Free[of])(f));
};

Free.prototype.andThen = function(x) {
    return this[chain](constant(x));
};

Free.prototype.fold = function(f, g) {
    return this.resume().fold(f, g);
};

Free.prototype.foldMap = function(f, p) {
    return this.resume().cata({
        Left: (x) => {
            return f(x)[chain]((y) => y.foldMap(f, p));
        },
        Right: (x) => point(p, x)
    });
};

Free.prototype.resume = function() {
    return this.cata({
        Return:  Either.Right,
        Suspend: Either.Left,
        Chain: (x, f) => {
            return x.cata({
                Return: (y) => f(y).resume(),
                Suspend: (y) => {
                    return Either.Left(y[map]((z) => z[chain](f)));
                },
                Chain: (y, g) => {
                    return y[chain]((z) => g(z)[chain](f)).resume();
                }
            });
        }
    });
};

module.exports = Free;