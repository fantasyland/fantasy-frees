var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasia'),
    tuples      = require('fantasy-tuples'),

    Lens   = require('fantasy-lenses').Lens,
    Writer = require('fantasy-writers'),

    compose  = combinators.compose,
    constant = combinators.constant,
    identity = combinators.identity,

    Free   = fantasia.Free,
    Unit   = fantasia.Unit,

    Turtle = daggy.taggedSum({
        Forward  : ['x', 'next'],
        Backward : ['x', 'next'],
        Left     : ['x', 'next'],
        Right    : ['x', 'next'],
        LineColor: ['x', 'next'],
        Clear    : ['next']
    }),

    interpreters;

Turtle.prototype.map = function(f) {
    function go(c) {
        return function(x, n) {
            return c(x, f(n));
        };
    }
    return this.cata({
        Forward  : go(Turtle.Forward),
        Backward : go(Turtle.Backward),
        Left     : go(Turtle.Left),
        Right    : go(Turtle.Right),
        LineColor: go(Turtle.LineColor),
        Clear: function(n) {
            return Turtle.Clear(f(n));
        }
    });
};

function forward(x) {
    return Free.liftF(Turtle.Forward(x, Unit()));
}

function backward(x) {
    return Free.liftF(Turtle.Backward(x, Unit()));
}

function left(x) {
    return Free.liftF(Turtle.Left(x, Unit()));
}

function right(x) {
    return Free.liftF(Turtle.Right(x, Unit()));
}

function lineColor(x) {
    return Free.liftF(Turtle.LineColor(x, Unit()));
}

function clear() {
    return Free.liftF(Turtle.Clear(Unit()));
}

interpreters = {
    string: function(free) {
        function go(free, writer) {
            return free.resume().fold(
                function(x) {
                    return x.cata({
                        Forward: function(x, n) {
                            return go(n, writer.tell(['Forward: ' + x]));
                        },
                        Backward: function(x, n) {
                            return go(n, writer.tell(['Backward: ' + x]));
                        },
                        Left: function(x, n) {
                            return go(n, writer.tell(['Left: ' + x]));
                        },
                        Right: function(x, n) {
                            return go(n, writer.tell(['Right: ' + x]));
                        },
                        LineColor: function(x, n) {
                            return go(n, writer.tell(['LineColor: ' + x]));
                        },
                        Clear: function(n) {
                            return go(n, writer.tell(['Clear']));
                        }
                    })
                },
                constant(writer)
            )
        }

        return go(free, Writer.of([]));
    },
    svg: function(free) {
        function copy(x) {
            var y = {};
            for(var i in x) {
                y[i] = x[i];
            }
            return y;
        }
        function extend(a, b) {
            var x = copy(a);
            for(var i in b) {
                x[i] = b[i];
            }
            return x;
        }
        function open(name, attr, close) {
            var m = Object.keys(attr).map(function(x) {
                return x + '="' + attr[x] + '"';
            });
            return '<' + name + ' ' + m.join(' ') + (close ? '/>' : '>');
        }
        function close(name) {
            return '</' + name + '>';
        }
        function go(free, store, writer) {
            return free.resume().fold(
                function(x) {
                    return x.cata({
                        Forward: function(x, n) {
                            var s = extend(store, 
                                    { x1: store.x1 
                                    , y1: store.y1
                                    , x2: store.x1
                                    , y2: store.y2 + x
                                    });
                            return go(n, s, writer.tell([open('line', s, true)]));
                        },
                        Backward: function(x, n) {
                            var s = extend(store, 
                                    { x1: store.x1 
                                    , y1: store.y1
                                    , x2: store.x1
                                    , y2: store.y2 - x
                                    });
                            return go(n, extend(store, s), writer.tell([open('line', s, true)]));
                        },
                        Left: function(x, n) {
                            return go(n, store, writer);
                        },
                        Right: function(x, n) {
                            return go(n, store, writer);
                        },
                        LineColor: function(x, n) {
                            var s = extend(store, {
                                style: 'stroke:' + x + ';stroke-width:1'
                            });
                            return go(n, s, writer);
                        },
                        Clear: function(n) {
                            return go(n, store, writer);
                        }
                    })
                },
                constant(writer.tell([close('svg')]))
            )
        }

        var out = Writer.of([]).tell([open('svg', {width:400, height:400}, false)]);
        return go(free, {x1:0,y1:0,x2:0,y2:0}, out);
    }
};

function repeat(x, y) {
    function go(a, b) {
        return b == 0 ? a : go(a.andThen(x), b - 1);
    }
    return go(x, y);
}


(function(){
    var script = clear().
                 andThen(lineColor("rgb(255,0,255)")).
                 andThen(repeat(forward(50).andThen(right(90)), 3));


    console.log('---------------------------------------------');
    console.log(interpreters.string(script).run()._2.join('\n'));
    console.log('---------------------------------------------');
    console.log(interpreters.svg(script).run()._2.join('\n'));
    console.log('---------------------------------------------');

})();
