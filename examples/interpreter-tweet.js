var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
    tuples      = require('fantasy-tuples'),
    
    Identity      = require('fantasy-identities'),

    identity = combinators.identity,

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

Service.prototype.toString = function() {
    return this.cata({
        GetTweets: function(x) {
            return 'Service.GetTweets(' + x + ')';
        },
        GetUserName: function(x) {
            return 'Service.GetUserName(' + x + ')';
        },
        GetUserPhoto: function(x) {
            return 'Service.GetUserPhoto(' + x + ')';
        }
    });
};

Request.prototype.map = function(f) {
    return this.cata({
        Fetch: function(x) {
            return Request.Fetch(x.map(f));
        },
        Pure: function(x) {
            return Request.Pure(f(x));
        }
    });
};

Request.prototype.toString = function() {
    return this.cata({
        Fetch: function(x) {
            return 'Request.Fetch(' + x + ')';
        },
        Pure: function(x) {
            return 'Request.Pure(' + x + ')';
        }
    });
};

function pure(x) {
    return Free.liftFC(Request.Pure(x));
}

function fetch(s) {
    return Free.liftFC(Request.Fetch(s));
}

function singleton(k, v) {
    var x = {};
    x[k] = v;
    return x;
}

interpreters = {
    pure : function(req) {
        return req.cata({
            Pure: identity,
            Fetch: function(s) {
                return s.cata({
                    GetTweets: function(id) {
                        console.log('Getting tweets for user ', id);
                        return [Tweet(1, 'Hello'), Tweet(2, 'World'), Tweet(3, '!')];
                    },
                    GetUserName: function(id) {
                        console.log('Getting name for user ', id);
                        return id === 1 ? 'Tim'
                             : id === 2 ? 'Bob'
                             : 'Anonymous';
                    },
                    GetUserPhoto: function(id) {
                        console.log('Getting photo for user ', id);
                        return id === 1 ? ':-)'
                             : id === 2 ? ':-D'
                             : ':-|';
                    }
                });
            }
        });
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
            console.log('>', tweets);
            var x = tweets.map(function(tweet) {
                console.log('>>', tweet);
                return getUser(tweet.id).chain(function(user) {
                    console.log('>>>', user);
                    return singleton(tweet.str, user);
                });
            });
            console.log(x);
            return x;
        });

    console.log('-----------------------------------');
    console.log(Free.runFC(script, interpreters.pure, Identity));
    console.log('-----------------------------------');
})()