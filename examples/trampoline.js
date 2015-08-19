var fantasia    = require('./../fantasy-frees'),
    combinators = require('fantasy-combinators'),

    identity    = combinators.identity,
    
    Trampoline = fantasia.Trampoline;

(function(){

    function loop(n) {
        function inner(i) {
            return i == n ? 
                Trampoline.done(n) :
                Trampoline.suspend(function() {
                    return inner(i + 1);
                });
         }
         return Trampoline.run(inner(0));
    }

    console.log(loop(1000000));

})();