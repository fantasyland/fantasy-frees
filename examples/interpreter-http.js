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

function replaceHeader(header, value) {
    return removeHeader(header).chain(function(x) {
        return addHeader(header, value);
    });
}

function json(value) {
    return replaceHeader('Content-Type', 'application/json').chain(function(x) {                
        return body(JSON.stringify(value));
    });
}

function dissoc(l, n, o) {
    // This is wrong atm.
    var x = l.run(o).map(function(x) {
        delete x.headers[n];
        return x;
    });
    return x.extract();
}

interpreters = {
    pure: function(free, res){
        return free.resume().fold(
            function(x){
                return x.cata({
                    AddHeader: function(header, value, n) {
                        var h = lenses.headers.andThen(Lens.objectLens(header));
                        return interpreters.pure(n, h.run(res).set(value));
                    },
                    RemoveHeader: function(header, n) {
                        var h = lenses.headers.andThen(Lens.objectLens(header));
                        return interpreters.pure(n, dissoc(h, header, res));
                    },
                    StatusCode: function(code, n) {
                        return interpreters.pure(n, lenses.statusCode.run(res).set(code));
                    },
                    Body: function(body, n) {
                        return interpreters.pure(n, lenses.body.run(res).set(body));
                    }
                });
            },
            constant(res)
        );
    }
};

(function(){

    var res = response(),
        script = addHeader('Content-Type', 'text/plain')
                .andThen(httpStatus.ok())
                .andThen(json({text:'Hello World!'}));

    console.log('----------------------------');
    console.log(interpreters.pure(script, res));
    console.log('----------------------------');

})();