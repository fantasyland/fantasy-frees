var combinators = require('fantasy-combinators'),
    daggy = require('daggy'),
    sorcery = require('fantasy-sorcery'),

    Either = require('fantasy-eithers'),
    Coyoneda = require('./coyoneda'),

    State = require('fantasy-states'),

    compose = combinators.compose,
    constant = combinators.constant,
    point    = sorcery.point,

    Free = daggy.taggedSum({
        Of:      ['x'],
        Suspend: ['x'],
        Chain:   ['x', 'f']
    });

Free.of = Free.Of;

Free.liftF = function(c) {
    return Free.Suspend(c.map(Free.Of));
};

Free.liftFC = function(c) {
    return Free.liftF(Coyoneda.lift(c));
};

Free.runFC = function(m, f, p) {
    return m.foldMap(p, function(coyo) {
        return f(coyo.x).map(coyo.f);
    });
};

Free.prototype.chain = function(f) {
    return Free.Chain(this, f);
};

Free.prototype.ap = function(x) {
    return this.chain(x.map);
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
        Left: function(x) {
            return f(x).chain(function(y) {
                return y.foldMap(p, f);
            });
        },
        Right: compose(point)(constant(p))
    });
};

Free.prototype.resume = function() {
    return this.cata({
        Of:  Either.Right,
        Suspend: Either.Left,
        Chain: function(x, f) {
            return x.cata({
                Of: function(x) {
                    return f(x).resume();
                },
                Suspend: function(x) {
                    return Either.Left(x.map(f));
                },
                Chain: function(x, g) {
                    return x.chain(function(y) {
                        return g(y).chain(f);
                    }).resume();
                }
            });
        }
    });
};

// Export
if (typeof module != 'undefined')
    module.exports = Free;
