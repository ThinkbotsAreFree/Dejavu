module.exports = function(sys) {



    return {



        "setX0": function(data, effect) {

            var inactive = true;

            if (!data.state.x) {
                data.state.x = 0;
                inactive = false;
            }

            return {
                data: data,
                effect: effect,
                inactive: inactive
            }
        },



        "incrX": function(data, effect) {

            data.state.x += 1;

            return {
                data: data,
                effect: effect
            }
        },



        "decrX": function(data, effect) {

            data.state.x -= 1;

            return {
                data: data,
                effect: effect
            }
        },



        "outX": function(data, effect) {

            data.output.execute(`[x {"value": ${data.state.x}}]`);

            return {
                data: data,
                effect: effect
            }
        },



    };
};