var fantasia = require('./../fantasy-frees'),
    Coyoneda = fantasia.Coyoneda;

function add(x) {
    return x + 1;
}

function toString(x) {
    return '' + x;
}

(function(){

    var arr = [1, 2, 3, 4, 6, 7, 8, 9],
        coyo = Coyoneda.lift(arr),
        res = coyo
            .map(add)
            .map(toString);

    console.log(res.lower());

})();