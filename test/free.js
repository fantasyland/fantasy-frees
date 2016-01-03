'use strict';

const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');

const {isInstanceOf} = require('fantasy-helpers');
const {constant, identity} = require('fantasy-combinators');
const {Free} = require('../fantasy-frees');

const Identity = require('fantasy-identities');

const isIdentityOf = isInstanceOf(identityOf);

function identityOf(type) {
    var self = this.getInstance(this, identityOf);
    self.type = type;
    return self;
}

function run(x) {
    return x.resume();
}

const λʹ = λ
    .property('identityOf', identityOf)
    .method('arb', isIdentityOf, function(a, b) {
        return Identity.of(this.arb(a.type, b - 1));
    });

exports.free = {

    // Applicative Functor tests
    'All (Applicative)': applicative.laws(λʹ)(Free, run),
    'Identity (Applicative)': applicative.identity(λʹ)(Free, run),
    'Composition (Applicative)': applicative.composition(λʹ)(Free, run),
    'Homomorphism (Applicative)': applicative.homomorphism(λʹ)(Free, run),
    'Interchange (Applicative)': applicative.interchange(λʹ)(Free, run),

    // Functor tests
    'All (Functor)': functor.laws(λʹ)(Free.of, run),
    'Identity (Functor)': functor.identity(λʹ)(Free.of, run),
    'Composition (Functor)': functor.composition(λʹ)(Free.of, run),

    // Monad tests
    'All (Monad)': monad.laws(λʹ)(Free, run),
    'Left Identity (Monad)': monad.leftIdentity(λʹ)(Free, run),
    'Right Identity (Monad)': monad.rightIdentity(λʹ)(Free, run),
    'Associativity (Monad)': monad.associativity(λʹ)(Free, run)
};
