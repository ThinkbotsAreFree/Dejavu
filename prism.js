module.exports = {





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