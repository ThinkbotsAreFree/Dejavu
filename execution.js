


module.exports = function (sys) {



    sys.step = function () {

        for (var lobeName in sys.lobe) {
            var lobe = sys.lobe[lobeName];

            sys.consnet.actor.lobeName = lobeName;

            for (var lobuleName in lobe.lobule) {
                var lobule = lobe.lobule[lobuleName];

                sys.consnet.actor.lobuleName = lobuleName;

                var effect = {};

                for (var prism of lobule.pchain) {

                    effect = sys.prism[prism](sys.consnet, effect);
                }
            }
        }
    };



};


