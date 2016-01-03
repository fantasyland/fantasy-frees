'use strict';

const daggy = require('daggy');

const {identity} = require('fantasy-combinators');    
const {Free}    = require('./../fantasy-frees');
const {singleton}     = require('fantasy-helpers');
    
const Cofree   = require('fantasy-cofrees');
const Identity = require('fantasy-identities');
const Option   = require('fantasy-options');

const Tweet   = daggy.tagged('id', 'str');
const User    = daggy.tagged('id', 'name', 'photo');

const Service = daggy.taggedSum({
    GetTweets    : ['id'],
    GetUserName  : ['id'],
    GetUserPhoto : ['id']
});
    
const Request = daggy.taggedSum({
    Fetch : ['x'],
    Pure  : ['x']
});

function pure(x) {
    return Free.liftFC(Request.Pure(x));
}

function fetch(s) {
    return Free.liftFC(Request.Fetch(s));
}

function arrayNel(x) {
    function go(y, z) {
        return y.length < 1 ? z.x : go(y.slice(0, -1), Option.Some(Cofree(y.slice(-1)[0], z)));
    }
    return go(x, Option.None);
}

function nelArray(xs) {
    return [xs.a].concat(xs.f.cata({
        Some: (x) => nelArray(x),
        None: () => []
    }));
}

Cofree.prototype.sequence = function(p) {
    return this.traverse(identity, p);
};

const interpreters = {
    pure : (req) => {
        const res = req.cata({
            Pure: identity,
            Fetch: (s) => {
                return s.cata({
                    GetTweets: (id) => {
                        return arrayNel([Tweet(1, 'Hello'), Tweet(2, 'World'), Tweet(3, '!')]);
                    },
                    GetUserName: (id) => {
                        return id === 1 ? 'Tim'
                             : id === 2 ? 'Bob'
                             : 'Anonymous';
                    },
                    GetUserPhoto: (id) => {
                        return id === 1 ? ':-)'
                             : id === 2 ? ':-D'
                             : ':-|';
                    }
                });
            }
        });
        return Identity.of(res);
    }
};

function getUser(id) {
    return fetch(Service.GetUserName(id)).chain((name) => {
        return fetch(Service.GetUserPhoto(id)).map((photo) => {
            return User(id, name, photo);
        });
    });
}

const id = 1;
const script = fetch(Service.GetTweets(id)).chain((tweets) => {
    return tweets.map((tweet) => {
        return getUser(tweet.id).map((user) => {
            return singleton(tweet.str, user);
        });
    }).sequence(Free);
});

console.log('---------------------------------------------------------');
console.log(nelArray(Free.runFC(script, interpreters.pure, Identity).x));
console.log('---------------------------------------------------------');
