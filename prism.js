const path = require("path");
const readDir = require('readdir');



module.exports = function(sys) {


    var exp = {};

    var filesArray = readDir.readSync(path.join(__dirname, "prism"), ["**.js"]);

    filesArray.forEach(filename => {

        Object.assign(
            exp,
            require(path.join(__dirname, "prism", filename))(sys)
        );
    });

    return exp;



};