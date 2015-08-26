var λ           = require('fantasy-check/src/adapters/nodeunit'),
    applicative = require('fantasy-check/src/laws/applicative'),
    functor     = require('fantasy-check/src/laws/functor'),
    monad       = require('fantasy-check/src/laws/monad'),

    helpers     = require('fantasy-helpers'),
    combinators = require('fantasy-combinators'),
    fantasia    = require('../fantasy-frees'),

    Identity = require('fantasy-identities'),

    Free = fantasia.Free,
    
    constant = combinators.constant,
    identity = combinators.identity,

    isIdentityOf = helpers.isInstanceOf(identityOf);

function identityOf(type) {
    var self = this.getInstance(this, identityOf);
    self.type = type;
    return self;
}

function run(x) {
    return x.resume();
}

λ = λ
    .property('identityOf', identityOf)
    .method('arb', isIdentityOf, function(a, b) {
        return Identity.of(this.arb(a.type, b - 1));
    });

exports.free = {

    // Applicative Functor tests
    'All (Applicative)': applicative.laws(λ)(Free, run),
    'Identity (Applicative)': applicative.identity(λ)(Free, run),
    'Composition (Applicative)': applicative.composition(λ)(Free, run),
    'Homomorphism (Applicative)': applicative.homomorphism(λ)(Free, run),
    'Interchange (Applicative)': applicative.interchange(λ)(Free, run),

    // Functor tests
    'All (Functor)': functor.laws(λ)(Free.of, run),
    'Identity (Functor)': functor.identity(λ)(Free.of, run),
    'Composition (Functor)': functor.composition(λ)(Free.of, run),

    // Monad tests
    'All (Monad)': monad.laws(λ)(Free, run),
    'Left Identity (Monad)': monad.leftIdentity(λ)(Free, run),
    'Right Identity (Monad)': monad.rightIdentity(λ)(Free, run),
    'Associativity (Monad)': monad.associativity(λ)(Free, run)
};
