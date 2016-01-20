'use strict';

const λ = require('./lib/test');
const {functor, Identity} = λ;

const {Coyoneda} = λ.Frees;
 
function of(x) {
    return Coyoneda.lift(Identity.of(x));
}

function run(x) {
    return x.lower();
}

exports.coyoneda = {

    // Functor tests
    'All (Functor)': functor.laws(λ)(of, run),
    'Identity (Functor)': functor.identity(λ)(of, run),
    'Composition (Functor)': functor.composition(λ)(of, run)
};
