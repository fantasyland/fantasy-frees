'use strict';

const λ = require('fantasy-check/src/adapters/nodeunit');
const applicative = require('fantasy-check/src/laws/applicative');
const functor = require('fantasy-check/src/laws/functor');
const monad = require('fantasy-check/src/laws/monad');
    
const daggy = require('daggy');

const {curry, isInstanceOf} = require('fantasy-helpers');
const {constant, identity} = require('fantasy-combinators');

const Identity = require('fantasy-identities');
const Tuples = require('fantasy-tuples');

const Frees = require('../../fantasy-frees');

const isIdentity = isInstanceOf(Identity);
const isIdentityOf = isInstanceOf(identityOf);

function equals(a) {
    return (b) => {
        // Replace with fantasy-equality
        const x = a.a;
        const y = b.a;
        return x._1 === y._1 && x._2 === y._2;
    };
}

Identity.prototype.traverse = function(f, p) {
    return p.of(f(this.x));
};

function identityOf(type) {
    const self = this.getInstance(this, identityOf);
    self.type = type;
    return self;
}

const λʹ = λ
    .property('applicative', applicative)
    .property('functor', functor)
    .property('monad', monad)
    .property('equals', equals)
    .property('Frees', Frees)
    .property('Tuples', Tuples)
    .property('Identity', Identity)
    .property('isIdentity', isIdentity)
    .property('identityOf', identityOf)
    .property('curry', curry)
    .property('constant', constant)
    .property('identity', identity)
    .method('arb', isIdentityOf, function(a, b) {
        return Identity.of(this.arb(a.type, b - 1));
    });


// Export
if(typeof module != 'undefined')
    module.exports = λʹ;
