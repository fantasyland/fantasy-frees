var coyoneda   = require('./src/coyoneda'),
    free       = require('./src/free'),
    trampoline = require('./src/trampoline'),
    unit       = require('./src/unit'),
    yoneda     = require('./src/yoneda');

exports = module.exports = {
    Coyoneda  : coyoneda,
    Free      : free,
    Trampoline: trampoline,
    Unit      : unit,
    Yoneda    : yoneda
};
