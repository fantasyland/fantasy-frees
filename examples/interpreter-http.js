'use strict';

const daggy = require('daggy');

const {compose, constant, identity} = require('fantasy-combinators');
const {Free} = require('./../fantasy-frees');
const {Lens}     = require('fantasy-lenses');
        
const Response  = daggy.tagged('headers', 'statusCode', 'body');
const Responses = daggy.taggedSum({
    AddHeader   : ['header', 'value', 'next'],
    RemoveHeader: ['header', 'next'],
    StatusCode  : ['code', 'next'],
    Body        : ['body', 'next']
});
    
const lenses = {
    headers   : Lens.objectLens('headers'),
    statusCode: Lens.objectLens('statusCode'),
    body      : Lens.objectLens('body'),
};
const httpStatus = {
    ok           : compose(statusCode)(constant(200)),
    created      : compose(statusCode)(constant(201)),
    notFound     : compose(statusCode)(constant(404)),
    internalError: compose(statusCode)(constant(500))
};

const unit = daggy.tagged('x');
const Unit = () => unit('');

Responses.prototype.map = function(f) {
    function go(p) {
        return (x, n) => p(x, f(n));
    }
    return this.cata({
        AddHeader: (k, v, n) => Responses.AddHeader(k, v, f(n)),
        RemoveHeader: go(Responses.RemoveHeader),
        StatusCode: go(Responses.StatusCode),
        Body: go(Responses.Body)
    });
};

function response() {
    return Response({}, 0, '');
}

function addHeader(header, value) {
    return Free.liftF(Responses.AddHeader(header, value, Unit()));
}

function removeHeader(header) {
    return Free.liftF(Responses.RemoveHeader(header, Unit()));
}

function statusCode(code) {
    return Free.liftF(Responses.StatusCode(code, Unit()));
}

function body(body) {
    return Free.liftF(Responses.Body(body, Unit()));
}

function replaceHeader(header, value) {
    return removeHeader(header).chain((x) => addHeader(header, value));
}

function json(value) {
    return replaceHeader('Content-Type', 'application/json').chain((x) => {                
        return body(JSON.stringify(value));
    });
}

function dissoc(l, n, o) {
    // This is wrong atm.
    const x = l.run(o).map((x) => {
        delete x.headers[n];
        return x;
    });
    return x.extract();
}

const interpreters = {
    pure: (free, res) => {
        return free.resume().fold(
            (x) => {
                return x.cata({
                    AddHeader: (header, value, n) => {
                        var h = lenses.headers.andThen(Lens.objectLens(header));
                        return interpreters.pure(n, h.run(res).set(value));
                    },
                    RemoveHeader: (header, n) => {
                        var h = lenses.headers.andThen(Lens.objectLens(header));
                        return interpreters.pure(n, dissoc(h, header, res));
                    },
                    StatusCode: (code, n) => {
                        return interpreters.pure(n, lenses.statusCode.run(res).set(code));
                    },
                    Body: (body, n) => {
                        return interpreters.pure(n, lenses.body.run(res).set(body));
                    }
                });
            },
            constant(res)
        );
    }
};

const res = response();
const script = addHeader('Content-Type', 'text/plain')
            .andThen(httpStatus.ok())
            .andThen(json({text:'Hello World!'}));

console.log('----------------------------');
console.log(interpreters.pure(script, res));
console.log('----------------------------');