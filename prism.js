




const path = require("path");
const readDir = require('readdir');

var filesArray = readDir.readSync(path.join(__dirname, "prism"), ["**.js"]);

filesArray.forEach(filename => {

    Object.assign(module.exports, require(path.join(__dirname, "prism", filename)));
});




