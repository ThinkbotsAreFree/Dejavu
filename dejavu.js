
// UI ********************************************************************************



const fs = require("fs");

const vorpal = require("vorpal")();
const {Signale} = require("signale");
const colors = require("colors");
const enolib = require('enolib');

const { launch } = require("./file-ui.js");
const cn = require("./consnet.js")(vorpal);

console.log("[Dejavu]".brightMagenta);



const sys = {};

sys.brain = {};
sys.lobe =  {};
sys.prism = require("./prism.js");

sys.consnet = new cn.Consnet({ enableLog: true });



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



vorpal.command('save as <filepath>', "Saves piped content to a file.")
.action(tryF(function(args, callback) {
    sys.filepath = args.filepath;
    fs.writeFileSync(args.filepath, args.stdin, "utf8");
    
    systemLog.success("Saved in "+args.filepath);
    callback();
}));



vorpal.command('save', "Saves piped content in the same file.")
.action(tryF(function(args, callback) {
    fs.writeFileSync(sys.filepath, args.stdin, "utf8");
    
    systemLog.success("Saved in "+sys.filepath);
    callback();
}));



vorpal.command('save brain [filepath]', "Saves the whole brain to memory.eno or to a specified file.")
.action(tryF(function(args, callback) {
    var brainSerialized = sys.serializeBrain();
    args.filepath = args.filepath || "memory.eno";
    fs.writeFileSync(args.filepath, brainSerialized, "utf8");
    
    systemLog.success("Saved as "+args.filepath);
    callback();
}));



vorpal.command('load brain [filepath]', "Loads a whole brain from memory.eno or from a specified file.")
.option('-s, --silent', 'Hides the success message.')
.action(tryF(function(args, callback) {
    args.filepath = args.filepath || "memory.eno";
    var fileContent = fs.readFileSync(args.filepath, 'utf8');
    sys.brain = {};
    sys.initializeBrain(enolib.parse(fileContent));
    if (!args.options.silent) systemLog.success("Loaded "+args.filepath);
    callback();
}));



vorpal.command('quit', "Saves brain and quit.")
.action(tryF(function(args, callback) {
    vorpal.hide();
    vorpal.exec("save brain").then(function(data){
        return vorpal.exec('exit');
    });
    callback();
}));



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
.command('table [path...]', "Shows a table of the JSON found at <path> in sys.")
.option('-p, --properties <prop...>', 'Select properties to show.')
.action(tryF(function(args, callback) {

    args.path = args.path || [];
    var here = sys;
    for (var p=0; p<args.path.length; p++) here = here[args.path[p]];

    systemLog.success("Path found: sys"+args.path.map(p => '.'+p).join(''));

    if (typeof args.options.properties === "string") args.options.properties = [args.options.properties];
    
    vorpal.hide();
    if (args.options.properties) console.table(here, args.options.properties);
    else console.table(here);
    vorpal.show();

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
.command('set-prism-chain <lobule> <prisms...>', "Sets the behavior of a lobule.")
.action(tryF(function(args, callback) {

    sys.brain[args.lobule].setPrisms(args.prisms);

    systemLog.success("Prisms of "+args.lobule+": "+args.prisms.join(' '));

    callback();
}));



vorpal
.command('step [times]', "Make the brain interpret 1 or more steps.")
.action(tryF(function(args, callback) {

    args.times = args.times || 1;

    for (var s=0; s<args.times; s++) sys.step();

    callback();
}));



vorpal
.mode('javascript', "Enters into a Javascript REPL session.")
.delimiter('js:')
.init(function(args, callback){
    this.log("Javascript mode on. Type code to evaluate, end with 'exit'.");
    callback();
})
.action(tryF(function(command, callback) {
    this.log(eval(command));
    callback();
}));



vorpal
.mode('consnet', "Enters into a Consnet REPL session.")
.delimiter('cn:')
.init(function(args, callback){
    this.log("Consnet mode on. Type code to evaluate, end with 'exit'.");
    callback();
})
.action(tryF(function(command, callback) {
    sys.consnet.execute.call(sys.consnet, command);
    callback();
}));



vorpal.write = vorpal.log;

var systemLog = new Signale({
    stream: vorpal,
    scope: "system"
});



// Initializers ********************************************************************************



sys.initializeBrain = function initializeBrain(enodoc) {

    enodoc.section("brain").sections("lobule").forEach(enoSection => {

        sys.initialize[enoSection.field("initializer").requiredStringValue()](enoSection);
    });
}



sys.initialize = {};



sys.initialize.defaultInitializer = function(enoSection) {

    var lobule = new sys.Lobule(
        enoSection.field("name").requiredStringValue(),
        enoSection.field("lobe").requiredStringValue());

    lobule.initializer = enoSection.field("initializer").optionalStringValue() || "defaultInitializer";
    lobule.serializer = enoSection.field("serializer").optionalStringValue() || "defaultSerializer";

    lobule.description = enoSection.field("description").optionalStringValue() || lobule.description;

    lobule.input = {
        observedOutputs: enoSection.list("observedOutputs").requiredStringValues(),
        observedMetaOutputs: enoSection.list("observedMetaOutputs").requiredStringValues()
    };

    lobule.output = {
        currentValue: JSON.parse(enoSection.fieldset("output").entry("currentValue").requiredStringValue()),
        futureValue: JSON.parse(enoSection.fieldset("output").entry("futureValue").requiredStringValue()),
        observedBy: JSON.parse(enoSection.fieldset("output").entry("observedBy").requiredStringValue()),
    };

    lobule.metaOutput = {
        currentValue: JSON.parse(enoSection.fieldset("metaOutput").entry("currentValue").requiredStringValue()),
        futureValue: JSON.parse(enoSection.fieldset("metaOutput").entry("futureValue").requiredStringValue()),
        observedBy: JSON.parse(enoSection.fieldset("metaOutput").entry("observedBy").requiredStringValue()),
    };

    lobule.prisms = enoSection.list("prisms").requiredStringValues();

    lobule.states =
        enoSection.section("stateHistory").fields("state").map(field => JSON.parse(field.requiredStringValue()));

    return lobule;
}



// Serializers ********************************************************************************



sys.serializeBrain = function serializeBrain() {

    var fileContent = '# brain\n\n';
    fileContent += Object.keys(sys.brain).map(lobule => sys.brain[lobule].serialize()).join('\n');
    return fileContent;
}



sys.serialize = {};



sys.serialize.defaultSerializer = function(lobule) {

    var result = `
## lobule

name: ${lobule.name}
lobe: ${lobule.lobe}
initializer: ${lobule.initializer}
serializer:  ${lobule.serializer}

-- description
${lobule.description}
-- description

observedOutputs: ${lobule.input.observedOutputs.map(item => "\n- "+item)}

observedMetaOutputs: ${lobule.input.observedMetaOutputs.map(item => "\n- "+item)}

output:
currentValue = ${JSON.stringify(lobule.output.currentValue)}
futureValue =  ${JSON.stringify(lobule.output.futureValue)}
observedBy =   ${JSON.stringify(lobule.output.observedBy)}

metaInput: ${Object.keys(lobule.metaInput).map(key => '\n'+key+" = "+lobule.metaInput[key])}

metaOutput:
currentValue = ${JSON.stringify(lobule.metaOutput.currentValue)}
futureValue =  ${JSON.stringify(lobule.metaOutput.futureValue)}
observedBy =   ${JSON.stringify(lobule.metaOutput.observedBy)}

prisms: ${lobule.prisms.map(item => "\n- "+item).join('')}

### stateHistory

${lobule.states.map(state => "-- state\n"+JSON.stringify(state, null, 4)+"\n-- state\n\n").join('')}
    `;

    return result;

}



// System structure ********************************************************************************



sys.Lobule = function(name, lobe) {

    if (sys.brain[name]) throw new Error("Lobule name already in use");

    this.name = name;           // must be unique
    this.description = name;
    
    this.setLobe(lobe);

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

    this.prisms = [];           // array of function names
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



sys.Lobule.prototype.setLobe = function(lobe) {

    if (!sys.lobe[lobe]) sys.lobe[lobe] = [];
    sys.lobe[lobe].push(this.name);
    this.lobe = lobe;
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

    if (!sys.prism[act]) throw new Error("Unknown prism name: "+act);
    this.prisms.push(act);
}



sys.Lobule.prototype.setPrisms = function(acts) {

    this.prisms = [];
    acts.forEach(act => { if (!sys.prism[act]) throw new Error("Unknown prism name: "+act); });
    for (let a=0; a<acts.length; a++) this.pushPrism(acts[a]);
}



sys.Lobule.prototype.serialize = function() {

    return sys.serialize[this.serializer](this);
}



// Execution ********************************************************************************



sys.step = function step() {

    for (var lobuleName in sys.brain) {

        var lobule = sys.brain[lobuleName];

        var effect = {};
        var state = lobule.states.length ? JSON.parse(JSON.stringify(lobule.states[0])) : {};

        // input is part of the state
        state.input = {
            observedOutputs: {},
            observedMetaOutputs : {}
        };

        // load observed values (save by lobule name)
        for (var oo of lobule.input.observedOutputs)
            state.input.observedOutputs[oo] = sys.brain[oo].output.currentValue;

        // load observed meta-values (save by lobule name)
        for (var om of lobule.input.observedMetaOutputs)
            state.input.observedMetaOutputs[om] = sys.brain[om].metaOutput.currentValue;

        // run the prism chain
        for (var prism of lobule.prisms) {

            ({ state, effect } = sys.prism[prism](state, effect, lobule.states));
        }

        // output is part of the state
        lobule.output.futureValue = state.output ? JSON.parse(JSON.stringify(state.output)) : {};

        lobule.states.unshift(state);
        if (lobule.states.length > lobule.historyLength) lobule.states.pop();
    }

    for (var lobule in sys.brain) {

        lobule.currentValue = lobule.futureValue;
        lobule.futureValue = {};
    }
}



// Start ********************************************************************************



vorpal.exec("load brain --silent").then(function(data) {

    systemLog.success("Ready");
});



vorpal.delimiter('i›').show();



// Test ********************************************************************************

//new sys.Lobule("lobule1");
//new sys.Lobule("lobule2");


