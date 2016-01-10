'use strict';

const {compose, constant} = require('fantasy-combinators');
const {point} = require('fantasy-sorcery');
const daggy = require('daggy');

const Either = require('fantasy-eithers');
const Coyoneda = require('./coyoneda');

const Free = daggy.taggedSum({
    Return:  ['x'],
    Suspend: ['x'],
    Chain:   ['x', 'f']
});

Free.of = Free.Return;

Free.liftF = (c) => {
    return Free.Suspend(c.map(Free.Return));
};

Free.liftFI = (fa) => {
    return Free.liftF(fa.inj());
};

Free.liftFC = (c) => {
    return Free.liftF(Coyoneda.lift(c));
};

Free.liftFCI = (c) => {
    return Free.liftFC(fa.inj());
};

Free.runFC = (m, f, p) => {
    return m.foldMap(p, (coyo) => f(coyo.x).map(coyo.f));
};

Free.prototype.chain = function(f) {
    const val = () => Free.Chain(this, f);
    return this.cata({
        Return: val,
        Suspend: val,
        Chain: (y, g) => {
            return Free.Chain(y, (x) => Free.Chain(g(x), f));
        },
    });
};

Free.prototype.ap = function(x) {
    return this.chain((f) => x.map(f));
};

Free.prototype.map = function(f) {
    return this.chain(compose(Free.of)(f));
};

Free.prototype.andThen = function(x) {
    return this.chain(constant(x));
};

Free.prototype.fold = function(f, g) {
    return this.resume().fold(f, g);
};

Free.prototype.foldMap = function(p, f) {
    return this.resume().cata({
        Left: (x) => {
            return f(x).chain((y) => y.foldMap(p, f));
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
                    return Either.Left(y.map((z) => z.chain(f)));
                },
                Chain: (y, g) => {
                    return y.chain((z) => g(z).chain(f)).resume();
                }
            });
        }
    });
};

// Export
if (typeof module != 'undefined')
    module.exports = Free;
