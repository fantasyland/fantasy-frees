'use strict';

const daggy = require('daggy');

const {compose, constant, identity} = require('fantasy-combinators');
const {Free} = require('./../fantasy-frees');
const {Lens} = require('fantasy-lenses');

const KVS = daggy.taggedSum({
    Put: ['key', 'val', 'next'],
    Del: ['key', 'next'],
    Get: ['key', 'val']
});

const unit = daggy.tagged('x');
const Unit = () => unit('');

KVS.prototype.map = function(f) {
    return this.cata({
        Put: (k, v, n) => KVS.Put(k, v, f(n)),
        Del: (k, n) => KVS.Del(k, f(n)),
        Get: (k, v) => KVS.Get(k, compose(f)(v))
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
    return get(key).chain((v) => put(key, f(v)));
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
    return (y) => x + y;
}

const interpreters = {
    string: (free, store) => {
        function go(store, free, strs) {
            return free.resume().fold(
                (x) => {
                    return x.cata({
                        Put: (k, v, n) => {
                            return go(assoc(k, v, store), n, strs.concat('Putting ' + k + ' with ' + v));
                        },
                        Del: (k, n) => {
                            return go(dissoc(k, store), n, strs.concat('Deleting ' + k));
                        },
                        Get: (k, f) => {
                            return go(store, f(store[k]), strs.concat('Getting ' + k));
                        }
                    })
                },
                constant(strs.join('\n'))
            )
        }

        return go(store, free, []);
    },
    pure: (free, store) => {
        return free.resume().fold(
            (x) => {
                return x.cata({
                    Put: (k, v, n) => interpreters.pure(n, assoc(k, v, store)),
                    Del: (k, n) => interpreters.pure(n, dissoc(k, store)),
                    Get: (k, f) => interpreters.pure(f(store[k]), store)
                });
            },
            constant(store)
        );
    }
};


const script = get('swiss bank account id').chain((id) => {
    return modify(id, add(1000))
        .andThen(put('bermuda airport', 'getaway car'))
        .andThen(del('tax records'));
});

const store = {
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
