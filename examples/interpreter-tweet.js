var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
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

interpreters = {
    pure : function(req) {
        return Identity.of(req.cata({
            Pure: identity,
            Fetch: function(s) {
                return s.cata({
                    GetTweets: function(id) {
                        return Cofree(
                            Tweet(1, 'Hello'), 
                            Option.Some(
                                Cofree(
                                    Tweet(2, 'World'), 
                                    Option.Some(
                                        Cofree(
                                            Tweet(3, '!'),
                                            Option.None
                                        )
                                    )
                                )
                            )
                        );
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
        }));
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
            }).traverse(Free.of, Free);
        });

    console.log('-----------------------------------');
    console.log(Free.runFC(script, interpreters.pure, Identity));
    console.log('-----------------------------------');
})()