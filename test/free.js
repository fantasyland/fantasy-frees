'use strict';

const λ = require('./lib/test');
const {applicative, functor, monad} = λ;

const {Free} = λ.Frees;

function run(x) {
    return x.resume();
}

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
