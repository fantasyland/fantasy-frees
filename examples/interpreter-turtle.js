var combinators = require('fantasy-combinators'),
    daggy       = require('daggy'),
    fantasia    = require('./../fantasy-frees'),
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
        function dir(s, a) {
            var r = s.dir * (Math.PI / 180),
                x = s.x2 + a * Math.cos(r),
                y = s.y2 + a * Math.sin(r);
            return extend(s, { x1: s.x2
                             , y1: s.y2
                             , x2: x
                             , y2: y
                             });
        }
        function go(free, store, writer) {
            return free.resume().fold(
                function(x) {
                    return x.cata({
                        Forward: function(x, n) {
                            var s = extend(store, dir(store, x));
                            return go(n, s, writer.tell([open('line', s, true)]));
                        },
                        Backward: function(x, n) {
                            var s = extend(store, dir(store, -x));
                            return go(n, s, writer.tell([open('line', s, true)]));
                        },
                        Left: function(x, n) {
                            var s = extend(store, { dir: store.dir-x });
                            return go(n, s, writer);
                        },
                        Right: function(x, n) {
                            var s = extend(store, { dir: store.dir+x });
                            return go(n, s, writer);
                        },
                        LineColor: function(x, n) {
                            var s = extend(store, {
                                style: 'stroke:' + x + ';stroke-width:2'
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

        var attrs = {width:200, height:200, xmlns:"http://www.w3.org/2000/svg", version:"1.1"},
            out = Writer.of([]).tell([open('svg', attrs, false)]);
        return go(free, {x1:0,y1:0,x2:100,y2:100, dir:0}, out);
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
                 andThen(lineColor("rgb(38,38,38)")).
                 andThen(repeat(forward(100).andThen(right(144)), 4));


    console.log('---------------------------------------------');
    console.log(interpreters.string(script).run()._2.join('\n'));
    console.log('---------------------------------------------');
    console.log(interpreters.svg(script).run()._2.join('\n'));
    console.log('---------------------------------------------');

})();
