'use strict';

const {Trampoline} = require('./../fantasy-frees');

function loop(n) {
    function inner(i) {
        return i == n ? 
            Trampoline.done(n) :
            Trampoline.suspend(() => inner(i + 1));
     }
     return Trampoline.run(inner(0));
}

console.log(loop(1000000));
