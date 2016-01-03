'use strict';

const {Coyoneda} = require('./../fantasy-frees');

function add(x) {
    return x + 1;
}

function toString(x) {
    return '' + x;
}

const arr = [1, 2, 3, 4, 6, 7, 8, 9];
const coyo = Coyoneda.lift(arr);
const res = coyo.map(add).map(toString);

console.log(res.lower());
