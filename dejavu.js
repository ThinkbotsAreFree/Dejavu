
// UI ********************************************************************************



const fs = require("fs");

const vorpal = require("vorpal")();
const {Signale} = require("signale");
const colors = require("colors");

console.log("[Dejavu]\n".brightMagenta);



const sys = {};

sys.brain =  {};
sys.prism = require("prism.js");



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
.catch('[words...]', 'Incorrect command!')
.action(function (args, callback) {
    this.log(args.words.join(' ') + ' is not a valid command.');
    callback();
});



vorpal.command('echo [data]', "Outputs its argument.")
.action(function(args, callback) {
    this.log(args.data);
    callback();
});



vorpal.command('save as <filepath>', "Saves piped content in a file.")
.action(function(args, callback) {
    sys.filepath = args.filepath;
    fs.writeFileSync(args.filepath, args.stdin, "utf8");
    callback();
});



vorpal.command('save', "Saves piped content in the same file.")
.action(function(args, callback) {
    fs.writeFileSync(sys.filepath, args.stdin, "utf8");
    callback();
});



vorpal
.command('list <object>', 'Outputs items found in: '+Object.keys(sys).join(', ')+'.')
.autocomplete(Object.keys(sys))
.action(tryF(function(args, callback) {

    var list = Object.keys(sys[args.object]).map(item => '- '+item).join('\n');

    systemLog.success("Items found in "+args.object);
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
.command('serialize lobule <name>', "Outputs a complete lobule.")
.action(tryF(function(args, callback) {

    var body = sys.brain[args.name].serialize();

    systemLog.success("Body of "+args.name+" found.");
    this.log(body);

    callback();
}));



vorpal
.command('plug', "Plug a lobule's input into another lobule's output or metaOutput.")
.option('-i, --input <ilobule...>', "Specifies the observing lobules.")
.option('-o, --output <olobule...>', "Specifies the observed lobules.")
.option('-m, --meta', "Plug to metaOutput.")
.action(tryF(function(args, callback) {

    if (!args.options.input) throw new Error("Observing lobule missing")
    if (!args.options.output) throw new Error("Observed lobule missing")

    sys.brain[args.options.input].plug([args.options.output], args.options.meta);

    systemLog.success(args.options.input+" is now observing "+args.options.output+'.');

    callback();
}));



vorpal
.command('unplug', "Unplug a lobule's input from another lobule's output or metaOutput.")
.option('-i, --input <ilobule...>', "Specifies the observing lobules.")
.option('-o, --output <olobule...>', "Specifies the observed lobules.")
.option('-m, --meta', "Unplug from metaOutput.")
.action(tryF(function(args, callback) {

    if (!args.options.input) throw new Error("Observing lobule missing")
    if (!args.options.output) throw new Error("Observed lobule missing")

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



vorpal.delimiter('i›').show();



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



serialize.defaultSerializer = function(lobule) {

    var result = `

## Lobule

name: ${lobule.name}

-- description
${lobule.description}
-- description

observedOutputs: ${lobule.input.observedOutputs.map(item => "\n- "+item)}

observedMetaOutputs: ${lobule.input.observedMetaOutputs.map(item => "\n- "+item)}

output:
currentValue = ${JSON.stringify(lobule.output.currentValue)}
futureValue =  ${JSON.stringify(lobule.output.futureValue)}

metaInput: ${Object.keys(lobule.metaInput).map(key => '\n'+key+" = "+lobule.metaInput[key])}

metaOutput:
currentValue = ${JSON.stringify(lobule.metaOutput.currentValue)}
futureValue =  ${JSON.stringify(lobule.metaOutput.futureValue)}

initializer: ${lobule.initializer}
serializer:  ${lobule.serializer}

prisms: ${lobule.prisms.map(item => "\n- "+item)}

### stateHistory

${lobule.states.map(state => "#### state\n\n"+JSON.stringify(state, null, 4)).join('\n\n')}

    `;

    return result;

}



// System structure ********************************************************************************



sys.Lobule = function(name) {           // must be serializable

    if (sys.brain[name]) throw new Error("Lobule name already in use");

    this.name = name;           // must be unique
    this.description = name;

    this.input = {
        observedOutputs : [],   // list of lobule names
        observedMetaOutputs: []
    };
    this.output = {
        currentValue: {},       // observed
        futureValue: {},        // calculated
        observedBy: []          // backlink
    };

    this.initializer = "defaultInitializer";
    this.serializer = "defaultSerializer";

    this.prisms = [];          // array of function names
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



sys.Lobule.prototype.setDescription = function(text) {

    this.description = text;
}



sys.Lobule.prototype.plug = function(names, meta) {

    names.forEach(lobule => {
        if (!sys.brain[lobule]) throw new Error("Unknown lobule name: "+lobule)
    });

    names.forEach(lobule => {
        var a;

        a = this.input[meta ? "observedMetaOutputs" : "observedOutputs"]
        if (!a.includes(lobule)) a.push(lobule);
        
        a = sys.brain[lobule][meta ? "metaOutput" : "output"].observedBy;
        if (!a.includes(this.name)) a.push(this.name);
    });
}



sys.Lobule.prototype.unplug = function(names, meta) {

    this.input[meta ? "observedMetaOutputs" : "observedOutputs"] =
        this.input[meta ? "observedMetaOutputs" : "observedOutputs"].filter(lobule => !names.includes(lobule));

    names.forEach(lobule => {
        
        sys.brain[lobule][meta ? "metaOutput" : "output"].observedBy =
            sys.brain[lobule][meta ? "metaOutput" : "output"].observedBy.filter(name => name !== this.name);
    });
}



sys.Lobule.prototype.pushPrism = function(act) {

    if (!prism[act]) throw new Error("Unknown prism name: "+act);
    this.prisms.push(act);
}



sys.Lobule.prototype.setPrisms = function(acts) {

    this.prisms = [];
    acts.forEach(act => { if (!prism[act]) throw new Error("Unknown prism name: "+act); });
    acts.forEach(this.pushPrism);
}



sys.Lobule.prototype.serialize = function() {

    return serialize[this.serializer](this);
}



// Test ********************************************************************************



new sys.Lobule("lobule1");
new sys.Lobule("lobule2");