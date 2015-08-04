var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./fantasia'),
    
    Tweet   = daggy('id', 'str'),
    User    = daggy('id', 'name', 'photo'),

    Service = daggySum({
        GetTweets:    ['id'],
        GetUserName:  ['id'],
        GetUserPhoto: ['id']
    }),
    
    Request = daggySum({
        Fetch: ['x']
    });

// TODO