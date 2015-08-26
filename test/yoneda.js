var λ           = require('fantasy-check/src/adapters/nodeunit'),
    functor     = require('fantasy-check/src/laws/functor'),

    fantasia    = require('../fantasy-frees'),

    Identity = require('fantasy-identities'),

    Yoneda = fantasia.Yoneda;
 
function of(x) {
    return Yoneda.lift(Identity.of(x));
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
