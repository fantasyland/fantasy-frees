'use strict';

const λ = require('fantasy-check/src/adapters/nodeunit');
const functor = require('fantasy-check/src/laws/functor');

const {Coyoneda} = require('../fantasy-frees');
const Identity = require('fantasy-identities');
 
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
