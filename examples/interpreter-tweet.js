var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasy-frees'),
    tuples      = require('fantasy-tuples'),
    helpers     = require('fantasy-helpers'),
    
    Cofree   = require('fantasy-cofrees'),
    Identity = require('fantasy-identities'),
    Option   = require('fantasy-options'),
    
    identity  = combinators.identity,
    singleton = helpers.singleton,

    Free   = fantasia.Free,
    Tuple2 = tuples.Tuple2,
    
    Tweet   = daggy.tagged('id', 'str'),
    User    = daggy.tagged('id', 'name', 'photo'),

    Service = daggy.taggedSum({
        GetTweets    : ['id'],
        GetUserName  : ['id'],
        GetUserPhoto : ['id']
    }),
    
    Request = daggy.taggedSum({
        Fetch : ['x'],
        Pure  : ['x']
    }),

    interpreters;

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
        Some: function(x) {
            return nelArray(x);
        },
        None: function() {
            return [];
        }
    }));
}

Cofree.prototype.sequence = function(p) {
    return this.traverse(identity, p);
};

interpreters = {
    pure : function(req) {
        var res = req.cata({
            Pure: identity,
            Fetch: function(s) {
                return s.cata({
                    GetTweets: function(id) {
                        return arrayNel([Tweet(1, 'Hello'), Tweet(2, 'World'), Tweet(3, '!')]);
                    },
                    GetUserName: function(id) {
                        return id === 1 ? 'Tim'
                             : id === 2 ? 'Bob'
                             : 'Anonymous';
                    },
                    GetUserPhoto: function(id) {
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
    return fetch(Service.GetUserName(id)).chain(function(name) {
        return fetch(Service.GetUserPhoto(id)).map(function(photo) {
            return User(id, name, photo);
        });
    });
}

(function() {

    var id = 1,
        script = fetch(Service.GetTweets(id)).chain(function(tweets) {
            return tweets.map(function(tweet) {
                return getUser(tweet.id).map(function(user) {
                    return singleton(tweet.str, user);
                });
            }).sequence(Free);
        });

    console.log('---------------------------------------------------------');
    console.log(nelArray(Free.runFC(script, interpreters.pure, Identity).x));
    console.log('---------------------------------------------------------');
})()