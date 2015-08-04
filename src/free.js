var combinators = require('fantasy-combinators'),
    daggy = require('daggy'),

    Either = requre('fantasy-eithers'),
    Coyoneda = require('./coyoneda'),


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
    // TODO
};

Free.prototype.fold = function(f, g) {
    // TODO
};

Free.prototype.step = function() {
    // TODO
};

Free.prototype.foldMap = function(m, f) {
    // TODO
};

Free.prototype.resume = function() {
    var self = this;
    return this.cata({
        Of: function() {
            return Either.Right(self.x);
        },
        Join: function() {
            return Either.Left(self.x.map(Free.Of));
        },
        Chain: function() {
            return self.x.cata({
                Of: function(x) {
                    return f(x).resume();
                },
                Join: function(x) {
                    return Either.Left(x.map(self.f));
                },
                Chain: function(x, f) {
                    return x.chain(function(y) {
                        return f(y).chain(self.f);
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
