


const sys = {};

require("./new-id.js")(sys);

const fs = require("fs");

const vorpal = require("vorpal")();
const { Signale } = require("signale");
const colors = require("colors");

const enolib = require('enolib');

const { launch } = require("./file-ui.js");
const cn = require("./consnet.js")(vorpal, sys.newId);
sys.cn = cn;

sys.dce = require("./dce.js");



sys.lobe = {};
sys.mind = {};

sys.prism = require("./prism.js")(sys);

sys.consnet = new cn.Consnet({ enableLog: true });

sys.mom = require("./forum.js")(sys);
sys.graph = require("./graph.js")(sys);

require("./init-serial.js")(sys);

console.log("[Dejavu]".brightMagenta);



tryF = function (fun) {

    return function (args, callback) {
        try {
            fun.call(this, args, callback);
            vorpal.log('');
        } catch (e) {
            systemLog.error(e);
            callback();
        }
    }
}



vorpal
    .catch('[words...]', 'Incorrect command!')
    .action(function (args, callback) {
        this.log(args.words.join(' ') + ' is not a valid command.');
        callback();
    });



vorpal.command('echo [data]', "Outputs its argument.")
    .action(function (args, callback) {
        this.log(args.data);
        callback();
    });



vorpal
    .command('json [path...]', "Shows a JSON found at <path> in sys.")
    .option('-s, --stringify', 'Shows the stringified version.')
    .action(tryF(function (args, callback) {

        args.path = args.path || [];
        var here = sys;
        for (var p = 0; p < args.path.length; p++) here = here[args.path[p]];

        var json = JSON.stringify(here, null, 4);

        systemLog.success("Path found: sys" + args.path.map(p => '.' + p).join(''));
        this.log(args.options.stringify ? json : here);

        callback();
    }));



function initJS() {
}



vorpal
    .mode('javascript', "Enters into a Javascript REPL session.")
    .delimiter('js:')
    .init(function (args, callback) {
        this.log("Javascript mode on. Type code to evaluate, end with 'exit'.");
        tryF(initJS);
        callback();
    })
    .action(tryF(function (command, callback) {
        this.log(eval(command));
        callback();
    }));



vorpal
    .mode('consnet [lobe] [lobule]', "Enters into a Consnet REPL session.")
    .delimiter("cn:")
    .init(function (args, callback) {
        this.log("Consnet mode on. Type code to evaluate, end with 'exit'.");
        sys.consnet.actor = {
            lobuleName: args.lobule || "user",
            lobeName: args.lobe || "system"
        };
        callback();
    })
    .action(tryF(function (command, callback) {
        sys.consnet.enableLog = true;
        sys.consnet.execute.call(sys.consnet, command);
        delete sys.consnet.enableLog;
        callback();
    }));



vorpal
    .mode('dce', "Enters into a DCE REPL session.")
    .delimiter("nl:")
    .init(function (args, callback) {
        this.log("Controlled Natural Language mode on. Type code to evaluate, end with 'exit'.");
        callback();
    })
    .action(tryF(function (txt, callback) {

        vorpal.log(JSON.stringify(sys.dce.parse(txt), null, 4));
        callback();
    }));



vorpal.command('save mind [filepath]', "Saves the whole mind to memory.eno or to a specified file.")
    .action(tryF(function (args, callback) {
        var brainSerialized = sys.serialize();
        args.filepath = args.filepath || "memory.eno";
        fs.writeFileSync(args.filepath, brainSerialized, "utf8");

        systemLog.success("Saved as " + args.filepath);
        callback();
    }));



vorpal.command('load mind [filepath]', "Loads a whole mind from memory.eno or from a specified file.")
    .option('-s, --silent', 'Hides the success message.')
    .action(tryF(function (args, callback) {
        args.filepath = args.filepath || "memory.eno";
        var fileContent = fs.readFileSync(args.filepath, 'utf8');
        sys.initialize(enolib.parse(fileContent));
        if (!args.options.silent) systemLog.success("Loaded " + args.filepath);
        callback();
    }));



vorpal.write = vorpal.log;

var systemLog = new Signale({
    stream: vorpal,
    scope: "system"
});



vorpal.exec("load mind --silent").then(function (data) {

    systemLog.success("Ready");
});



vorpal.delimiter('i›').show();


