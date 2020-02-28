module.exports = {





    "setX0": function(state, effect, stateHistory) {

        if (!state.x) state.x = 0;

        return {
            state: state,
            effect: effect
        }
    },





    "incrX": function(state, effect, stateHistory) {

        state.x += 1;

        return {
            state: state,
            effect: effect
        }
    },





    "decrX": function(state, effect, stateHistory) {

        state.x -= 1;

        return {
            state: state,
            effect: effect
        }
    },





};