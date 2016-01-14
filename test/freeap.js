'use strict';

const λ = require('./lib/test');
const {applicative, functor, curry, identity} = λ;

const {FreeAp} = λ.Frees;
const {Tuple2} = λ.Tuples;

exports.free = {

    // Applicative Functor tests
    'All (Applicative)': applicative.laws(λ)(FreeAp, identity),
    'Identity (Applicative)': applicative.identity(λ)(FreeAp, identity),
    'Composition (Applicative)': applicative.composition(λ)(FreeAp, identity),
    'Homomorphism (Applicative)': applicative.homomorphism(λ)(FreeAp, identity),
    'Interchange (Applicative)': applicative.interchange(λ)(FreeAp, identity),

    // Functor tests
    'All (Functor)': functor.laws(λ)(FreeAp.of, identity),
    'Identity (Functor)': functor.identity(λ)(FreeAp.of, identity),
    'Composition (Functor)': functor.composition(λ)(FreeAp.of, identity),

    // Manual Tests
    'Test that curried version of Tuple is constructed.': λ.check(
        (a, b) => {
            const x = FreeAp.of(curry(Tuple2)).ap(FreeAp.of(a)).ap(FreeAp.of(b));
            return λ.equals(x)(FreeAp.of(Tuple2(a, b)));
        },
        [λ.AnyVal, λ.AnyVal]
    )
};
