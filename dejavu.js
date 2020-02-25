
// UI ********************************************************************************



const fs = require("fs");

const vorpal = require('vorpal')();
const {Signale} = require('signale');
const colors = require('colors');

console.log("[Dejavu]\n".brightGreen);


const sys = {};

sys.brain =  {};
sys.action = {};



tryF = function(fun) {

    return function(args, callback) {
        try {
            fun.call(this, args, callback);
            vorpal.log('');
        } catch(e) {
            systemLog.error(e);
            callback();
        }
    }
}



vorpal
.catch('[words...]', 'Catches incorrect commands')
.action(function (args, callback) {
    this.log(args.words.join(' ') + ' is not a valid command.');
    callback();
});



vorpal.command('echo [command]')
.action(function(args, callback) {
    this.log(args.command);
    callback();
});



vorpal.command('save as <filepath>', "Saves piped content in a file.")
.action(function(args, callback) {
    sys.filepath = args.filepath;
    fs.writeFileSync(args.filepath, args.stdin, "utf8");
    callback();
});



vorpal.command('save', "Saves piped content in the previous file.")
.action(function(args, callback) {
    fs.writeFileSync(sys.filepath, args.stdin, "utf8");
    callback();
});



vorpal
.command('list <what>', 'Outputs the content of: '+Object.keys(sys).join(' / ')+'.')
.autocomplete(Object.keys(sys))
.action(tryF(function(args, callback) {

    var list = Object.keys(sys[args.what]).map(item => '- '+item).join('\n');

    systemLog.success("Items found in "+args.what);
    this.log(list);

    callback();
}));



vorpal
.command('json [path...]', "Shows a JSON found at <path> in sys.")
.option('-s, --stringify', 'Shows the stringified version.')
.action(tryF(function(args, callback) {

    args.path = args.path || [];
    var here = sys;
    for (var p=0; p<args.path.length; p++) here = here[args.path[p]];
    
    var json = JSON.stringify(here, null, 4);

    systemLog.success("Path found: sys"+args.path.map(p => '.'+p).join(''));
    this.log(args.options.stringify ? json : here);

    callback();
}));



vorpal
.mode('document', "Prepares a documentation.")
.delimiter('doc>')
.init(function(args, callback){
    this.log("Documentation mode on. Type a description, end with 'exit'.");
    sys.document = '';
    callback();
})
.action(function(docline, callback) {
    sys.document += docline+'\n';
    callback();
});



vorpal
.command('set-doc <type> <name> [doc]', "Assigns a description to an object.")
.action(tryF(function(args, callback) {

    var objType = sys[args.type];
    var target = objType[args.name];

    if (args.doc)
        target.description = args.doc;

    else if (args.stdin)
        target.description = args.stdin;

    else
        target.description = sys.document.trim();

    systemLog.success("Documentation of "+target.name+" has been set.");
    this.log(target.description);

    callback();
}));



vorpal
.command('get-doc <type> <name>', "Shows the description assigned to an object.")
.action(tryF(function(args, callback) {

    var objType = sys[args.type];
    var target = objType[args.name];

    systemLog.success("Documentation of "+target.name+" found.");
    this.log(target.description);

    callback();
}));



vorpal
.command('serialize lobe <name>', "Outputs a complete lobe.")
.action(tryF(function(args, callback) {

    var body = sys.brain[args.name].serialize();

    systemLog.success("Body of "+args.name+" found.");
    this.log(body);

    callback();
}));



vorpal
.command('plug', "Plug a lobe's input into another lobe's output or metaOutput.")
.option('-i, --input <ilobe...>', "Specifies the observing lobes.")
.option('-o, --output <olobe...>', "Specifies the observed lobes.")
.option('-m, --meta', "Plug to metaOutput.")
.action(tryF(function(args, callback) {

    if (!args.options.input) throw new Error("Observing lobe missing")
    if (!args.options.output) throw new Error("Observed lobe missing")

    sys.brain[args.options.input].plug([args.options.output], args.options.meta);

    systemLog.success(args.options.input+" is now observing "+args.options.output+'.');

    callback();
}));



vorpal
.command('unplug', "Unplug a lobe's input from another lobe's output or metaOutput.")
.option('-i, --input <ilobe...>', "Specifies the observing lobes.")
.option('-o, --output <olobe...>', "Specifies the observed lobes.")
.option('-m, --meta', "Unplug from metaOutput.")
.action(tryF(function(args, callback) {

    if (!args.options.input) throw new Error("Observing lobe missing")
    if (!args.options.output) throw new Error("Observed lobe missing")

    sys.brain[args.options.input].unplug([args.options.output], args.options.meta);

    systemLog.success(args.options.input+" isn't observing "+args.options.output+' anymore.');

    callback();
}));



vorpal
.mode('javascript', "Enters into a Javascript REPL session.")
.delimiter('js>')
.init(function(args, callback){
    this.log("Javascript mode on. Type code to evaluate, end with 'exit'.");
    callback();
})
.action(tryF(function(command, callback) {
    this.log(eval(command));
    callback();
}));



vorpal.delimiter('|>').show();



vorpal.write = vorpal.log;

var systemLog = new Signale({
    stream: vorpal,
    scope: "system"
});



systemLog.success("Ready");



// Initializers ********************************************************************************



var initialize = {};



initialize.defaultInitializer = function() {

}



// Serializers ********************************************************************************



var serialize = {};



serialize.defaultSerializer = function(lobe) {

    var result = `

## Lobe

name: ${lobe.name}

-- description
${lobe.description}
-- description

observedOutputs: ${lobe.input.observedOutputs.map(item => "\n- "+item)}

observedMetaOutputs: ${lobe.input.observedMetaOutputs.map(item => "\n- "+item)}

output:
currentValue = ${JSON.stringify(lobe.output.currentValue)}
futureValue =  ${JSON.stringify(lobe.output.futureValue)}

metaInput: ${Object.keys(lobe.metaInput).map(key => '\n'+key+" = "+lobe.metaInput[key])}

metaOutput:
currentValue = ${JSON.stringify(lobe.metaOutput.currentValue)}
futureValue =  ${JSON.stringify(lobe.metaOutput.futureValue)}

initializer: ${lobe.initializer}
serializer:  ${lobe.serializer}

actions: ${lobe.actions.map(item => "\n- "+item)}

### stateHistory

${lobe.states.map(state => "#### state\n\n"+JSON.stringify(state, null, 4)).join('\n\n')}

    `;

    return result;

}



// System structure ********************************************************************************



sys.Lobe = function(name) {           // must be serializable

    if (sys.brain[name]) throw new Error("Lobe name already in use");

    this.name = name;           // must be unique
    this.description = name;

    this.input = {
        observedOutputs : [],   // list of lobe names
        observedMetaOutputs: []
    };
    this.output = {
        currentValue: {},       // observed
        futureValue: {},        // calculated
        observedBy: []          // backlink
    };

    this.initializer = "defaultInitializer";
    this.serializer = "defaultSerializer";

    this.actions = [];          // array of function names
    this.states = [];           // history of the state object, 0 is current

    this.metaInput = {          // control panel
        historyLength: 10
    };
    this.metaOutput = {         // indicates what's being done
        currentValue: {},       // observed
        futureValue: {},        // calculated
        observedBy: []          // backlink
    };

    sys.brain[name] = this;
}



sys.Lobe.prototype.setDescription = function(text) {

    this.description = text;
}



sys.Lobe.prototype.plug = function(names, meta) {

    names.forEach(lobe => {
        if (!sys.brain[lobe]) throw new Error("Unknown lobe name: "+lobe)
    });

    names.forEach(lobe => {
        var a;

        a = this.input[meta ? "observedMetaOutputs" : "observedOutputs"]
        if (!a.includes(lobe)) a.push(lobe);
        
        a = sys.brain[lobe][meta ? "metaOutput" : "output"].observedBy;
        if (!a.includes(this.name)) a.push(this.name);
    });
}



sys.Lobe.prototype.unplug = function(names, meta) {

    this.input[meta ? "observedMetaOutputs" : "observedOutputs"] =
        this.input[meta ? "observedMetaOutputs" : "observedOutputs"].filter(lobe => !names.includes(lobe));

    names.forEach(lobe => {
        
        sys.brain[lobe][meta ? "metaOutput" : "output"].observedBy =
            sys.brain[lobe][meta ? "metaOutput" : "output"].observedBy.filter(name => name !== this.name);
    });
}



sys.Lobe.prototype.pushAction = function(act) {

    if (!action[act]) throw new Error("Unknown action name: "+act);
    this.actions.push(act);
}



sys.Lobe.prototype.setActions = function(acts) {

    this.actions = [];
    acts.forEach(this.pushAction);
}



sys.Lobe.prototype.serialize = function() {

    return serialize[this.serializer](this);
}



// Test ********************************************************************************



new sys.Lobe("lobe1");
new sys.Lobe("lobe2");