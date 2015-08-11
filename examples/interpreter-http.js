var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
    
    Lens     = require('fantasy-lenses').Lens,
    
    identity  = combinators.identity,
    compose   = combinators.compose,
    constant  = combinators.constant,
    
    Free   = fantasia.Free,
    Unit   = fantasia.Unit,
        
    Response  = daggy.tagged('headers', 'statusCode', 'body'),
    Responses = daggy.taggedSum({
        AddHeader   : ['header', 'value', 'next'],
        RemoveHeader: ['header', 'next'],
        StatusCode  : ['code', 'next'],
        Body        : ['body', 'next']
    }),
    
    lenses = {
        headers   : Lens.objectLens('headers'),
        statusCode: Lens.objectLens('statusCode'),
        body      : Lens.objectLens('body'),
    },
    httpStatus = {
        ok           : compose(statusCode)(constant(200)),
        created      : compose(statusCode)(constant(201)),
        notFound     : compose(statusCode)(constant(404)),
        internalError: compose(statusCode)(constant(500))
    },

    interpreters;

Responses.prototype.map = function(f) {
    function go(p) {
        return function(x, n) {
            return p(x, f(n));
        };
    }

    return this.cata({
        AddHeader: function(k, v, n) {
            return Responses.AddHeader(k, v, f(n));
        },
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

function assoc(l, v, o) {
    return l.run(o).set(v);
}

interpreters = {
    pure: function(free, res){
        return free.resume().fold(
            function(x){
                return x.cata({
                    AddHeader: function(header, value, n) {
                        var h = lenses.headers.andThen(Lens.objectLens(header));
                        return interpreters.pure(n, assoc(h, value, res));
                    },
                    RemoveHeader: function(header, n) {
                        return interpreters.pure(n, res);
                    },
                    StatusCode: function(code, n) {
                        return interpreters.pure(n, assoc(lenses.statusCode, code, res));
                    },
                    Body: function(body, n) {
                        return interpreters.pure(n, assoc(lenses.body, body, res));
                    }
                });
            },
            constant(res)
        );
    }
};

(function(){

    var res = response(),
        script = addHeader('Content-Type', 'text/plain').chain(function(x) {
            return httpStatus.ok().chain(function(x) {
                return body('Hello World!');
            });
        });

    console.log('--------------------------------');
    console.log(interpreters.pure(script, res));
    console.log('--------------------------------');

})();