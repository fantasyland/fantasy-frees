var λ           = require('fantasy-check/src/adapters/nodeunit'),
    functor     = require('fantasy-check/src/laws/functor'),

    fantasia    = require('../fantasy-frees'),

    Identity = require('fantasy-identities'),

    Coyoneda = fantasia.Coyoneda;
 
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
