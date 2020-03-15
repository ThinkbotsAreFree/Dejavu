module.exports = function(sys) {



    return {



        "setX0": function(cn, effect) {

            cn.execute('[x {"v":0}]');

            return effect;
        },



        "incrX": function(cn, effect) {

            var x = cn.getRightValue('x')[0];
            x.v += 1;

            sys.log.success(cn.actor, x);

            return effect;
        },



        "decrX": function(cn, effect) {

            var x = cn.getRightValue('x')[0];
            x.v -= 1;
            
            sys.log.success(cn.actor, x);

            return effect;
        },



        "outX": function(cn, effect) {

            return effect;
        },



    };
};