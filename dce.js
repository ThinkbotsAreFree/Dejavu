


const parser = require("./english-parser.js");



module.exports = {

    parse: function(txt) { return parser.parse('; '+txt.toLowerCase()); }

};


