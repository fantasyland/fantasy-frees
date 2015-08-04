var combinators = require('fantasy-combinators'),
    daggy = require('daggy'),
    sorcery = require('fantasy-sorcery'),

    Either = require('fantasy-eithers'),
    Coyoneda = require('./coyoneda'),

    constant = combinators.constant,
    point    = sorcery.point,

    Free = daggy.taggedSum({
        Of:    ['x'],
        Join:  ['x'],
        Chain: ['x', 'f']
    });

Free.of = Free.Of;

Free.liftF = function(c) {
    return Free.Join(c.map(Free.Of));
};

Free.liftFC = function(c) {
    return Free.Join(Coyoneda.liftCoyoneda(c).map(Free.Of));
};

Free.prototype.chain = function(f) {
    return Free.Chain(this, f);
};

Free.prototype.andThen = function(x) {
    return this.chain(constant(x));
};

Free.prototype.fold = function(f, g) {
    return this.resume().fold(f, g);
};

Free.prototype.step = function() {
    return this.cata({
        Of: Free.Of,
        Join: Free.Join,
        Chain: function(x, f) {
            return x.cata({
                Of   : function(x) {
                    return f(x).step();
                },
                Join : Free.Join,
                Chain: function(y, g) {
                    return y.chain(function(z) {
                        return g(z).chain(f);
                    }).step();
                }
            });
        }
    });
};

Free.prototype.foldMap = function(m, f) {
    return this.step().cata({
        Of   : point(m),
        Join : f,
        Chain: function(x, g) {
            return x.foldMap(m, f).chain(function(y) {
                return g(y).foldMap(m, f);
            });
        }
    });
};

Free.prototype.resume = function() {
    return this.cata({
        Of: function(x) {
            return Either.Right(x);
        },
        Join: function(x) {
            return Either.Left(x.map(Free.Of));
        },
        Chain: function(x, f) {
            return x.cata({
                Of: function(x) {
                    return f(x).resume();
                },
                Join: function(x) {
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

Free.prototype.runFC = function(m, f) {
    return this.foldMap(m, function(coyo) {
        return f(coyo.value()).map(coyo.func());
    });
};

Free.prototype.toString = function(){
    return this.cata({
        Of: function(x) {
            return 'Free.Of(' + x + ')';
        },
        Join: function(x) {
            return 'Free.Join(' + x + ')';
        },
        Chain: function(x, f) {
            return 'Free.Chain(' + x + ', ' + f + ')';
        }
    });
};

// Export
if (typeof module != 'undefined')
    module.exports = Free;
