var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasy-frees'),
    tuples      = require('fantasy-tuples'),

    Lens = require('fantasy-lenses').Lens,

    compose  = combinators.compose,
    constant = combinators.constant,
    identity = combinators.identity,

    Free   = fantasia.Free,
    Unit   = fantasia.Unit,

    KVS = daggy.taggedSum({
        Put: ['key', 'val', 'next'],
        Del: ['key', 'next'],
        Get: ['key', 'val']
    }),

    interpreters;

KVS.prototype.map = function(f) {
    return this.cata({
        Put: function(k, v, n) {
            return KVS.Put(k, v, f(n));
        },
        Del: function(k, n) {
            return KVS.Del(k, f(n));
        },
        Get: function(k, v) {
            return KVS.Get(k, compose(f)(v));
        } 
    });
};

function put(key, val) {
    return Free.liftF(KVS.Put(key, val, Unit()));
}

function del(key) {
    return Free.liftF(KVS.Del(key, Unit()));
}

function get(key) {
    return Free.liftF(KVS.Get(key, identity));
}

function modify(key, f) {
    return get(key).chain(function(v) {
        return put(key, f(v));
    });
}

function assoc(k, v, o) {
    return Lens.objectLens(k).run(o).set(v);
}

function dissoc(k, o) {
    var result = {};
    for (var p in o) {
        if (p !== k) {
            result[p] = o[p];
        }
    }
    return result;
}

function add(x) {
    return function(y) {
        return x + y;
    };
}

interpreters = {
    string: function(free, store) {
        function go(store, free, strs) {
            return free.resume().fold(
                function(x) {
                    return x.cata({
                        Put: function(k, v, n) {
                            return go(assoc(k, v, store), n, strs.concat('Putting ' + k + ' with ' + v));
                        },
                        Del: function(k, n) {
                            return go(dissoc(k, store), n, strs.concat('Deleting ' + k));
                        },
                        Get: function(k, f) {
                            return go(store, f(store[k]), strs.concat('Getting ' + k));
                        }
                    })
                },
                constant(strs.join('\n'))
            )
        }

        return go(store, free, []);
    },
    pure: function(free, store) {
        return free.resume().fold(
            function(x) {
                return x.cata({
                    Put: function(k, v, n) {
                        return interpreters.pure(n, assoc(k, v, store));
                    },
                    Del: function(k, n) {
                        return interpreters.pure(n, dissoc(k, store));
                    },
                    Get: function(k, f) {
                        return interpreters.pure(f(store[k]), store);
                    }
                });
            },
            constant(store)
        );
    }
};


(function(){

    var script = get('swiss bank account id').chain(function(id) {        
            return modify(id, add(1000))
                .andThen(put('bermuda airport', 'getaway car'))
                .andThen(del('tax records'));
        }),

        store = {
            'swiss bank account id': 'xxxx1',
            'xxxx1': 5032.12,
            'tax records': [
                {'date': '2/20/15', 'subject': 'aaaaa', 'amount': 2322.90 },
                {'date': '2/20/15', 'subject': 'bbbbb', 'amount': 3412.90 },
                {'date': '2/20/15', 'subject': 'ccccc', 'amount': 4502.90 },
                {'date': '2/20/15', 'subject': 'ddddd', 'amount': 5692.90 }
            ]
        };

    console.log('--------------------------------');
    console.log(interpreters.string(script, store));
    console.log('--------------------------------');
    console.log(interpreters.pure(script, store));
    console.log('--------------------------------');

})();
