var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
    tuples      = require('fantasy-tuples'),

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
    });

Service.prototype.map = function() {
    return this;
};

Service.prototype.toString = function() {
    return this.cata({
        GetTweets    : function(x) {
            return 'Service.GetTweets(' + x + ')';
        },
        GetUserName  : function(x) {
            return 'Service.GetUserName(' + x + ')';
        },
        GetUserPhoto : function(x) {
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
    return Free.liftF(Request.Pure(x));
}

function fetch(s) {
    return Free.liftF(Request.Fetch(s));
}

function singleton(k, v) {
    var x = {};
    x[k] = v;
    return x;
}

function sequence(func) {
    return function(x, f) {
        function go(x, free) {
            return free.resume().bimap(
                function(y) {
                    var z = f(x, y);
                    return go(z._1, z._2);
                },
                function(y) {
                    return Tuple2(x, y);
                }
            );
        }
        return go(x, func);
    };
}

function interpreter(req) {
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

function getUser(id) {
    return fetch(Service.GetUserName(id)).chain(function(name) {
        return fetch(Service.GetUserPhoto(id)).map(function(photo) {
            return User(id, name, photo);
        });
    });
}

(function() {

    var id = 1,
        free = fetch(Service.GetTweets(id)).chain(function(tweets) {
            return tweets.map(function(tweet) {
                return getUser(tweet.id).chain(function(user) {
                    return singleton(tweet.str, user);
                });
            });
        });

    function run() {
        return free.runFC(free, interpreter);
    }

    run();

})()