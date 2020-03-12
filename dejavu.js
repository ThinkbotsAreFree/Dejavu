


const sys = {};



const newId  = (function(){
    sys.currentId = "0";
    var addOne = function(s) {		
        let newNumber = '';
        let continueAdding = true;		
        for (let i = s.length - 1; i>= 0; i--) {			
            if (continueAdding) {				
                let num = parseInt(s[i], 10) + 1;			
                if (num < 10) {					
                    newNumber += num;
                    continueAdding = false;					
                } else {					
                    newNumber += '0';
                    if (i==0) newNumber += '1';
                }				
            } else {  			
                newNumber +=s[i];
            }
        }		
        return newNumber.split("").reverse().join("");
    }	
    return function(prefix) {
        prefix = prefix || '';
        sys.currentId = addOne(sys.currentId);
        return prefix+sys.currentId;
    };
})();



const fs = require("fs");

const vorpal = require("vorpal")();
const {Signale} = require("signale");
const colors = require("colors");
const enolib = require('enolib');

const { launch } = require("./file-ui.js");
const cn = require("./consnet.js")(vorpal, newId);

const dce = require("./dce.js");

console.log("[Dejavu]".brightMagenta);



sys.brain = {};
sys.lobe =  {};
sys.prism = require("./prism.js")(sys);

sys.consnet = new cn.Consnet({ enableLog: true });

const graph = require("./graph.js")(sys);



// UI ********************************************************************************



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
.command('meta-input <lobule> <key> <value>', "modifies the metaInput a lobule.")
.action(tryF(function(args, callback) {

    sys.brain[args.lobule].metaInput[args.key] = JSON.parse(args.value);

    systemLog.success("metaInput of "+args.lobule+": "+JSON.stringify(sys.brain[args.lobule].metaInput));

    callback();
}));



vorpal
.command('step [times]', "Make the brain interpret 1 or more steps.")
.action(tryF(function(args, callback) {

    args.times = args.times || 1;

    for (var s=0; s<args.times; s++) sys.step();

    callback();
}));


function initJS() {

    x = dce.parse(`

    is there a man;
    is there a woman;
    for every man is there a woman;
    is there a man who works?
    a man has to work.
    there are (a man and a woman) who have to work.
    for many problems there is at least a solution.
    there is a [woman]'s man.
    a solution is better than a problem.
    it is not impossible that a woman is more good than a man.
    is it provable that a man is more bad than a woman?
    this man is the smallest man.
    if there is a problem then there is a solution else there is no solution.
    does a man work on this problem?
    is there a man who works on this problem?
    is there a man?
    for every man is there a woman?
    which man is there?
    are there (a man and a woman)?
    is it true that a man works on a problem?
    does a man work on the problem?
    does a man always work on a problem?
    a man always works on a problem.
    which man does work on this problem?
    which problem does this man work on?
    there is a man who works on this problem.
    does the man find a solution to the problem?
    for each of these problems there is a solution.
    for some of them there are more than 1 solution.
    if there is a problem then there is a solution.
    if there is a man who works on a problem then there is a solution else there is no solution.
    a young man does not have to find a solution.
    a man gives a solution to another man.
    there is a solution which is found by a man.
    a man wants to find a solution to each of these problems.
    a man finds nothing but solutions.
    one always finds at least 1 solution to a problem.
    you get the [man]'s solution.
    this solution looks good.
    this solution looks better than mine.
    you should not have to find a solution.
    it is not provable that there is always a solution.
    (the solution to a problem) is itself.
    one can quickly find a solution to a problem.
    a solution can always be found.
    this one feels like the best solution.
    is there a [dog]?
    the [lion] is not always [hungry].
    this is [ska].
    
    `);
    console.log(x);
    x = dce.stringify(x);
    console.log(x);

    x = dce.parse(x);
    console.log(x);
    x = dce.stringify(x);
    console.log(x);
}



vorpal
.mode('javascript', "Enters into a Javascript REPL session.")
.delimiter('js:')
.init(function(args, callback){
    this.log("Javascript mode on. Type code to evaluate, end with 'exit'.");
    tryF( initJS() );
    callback();
})
.action(tryF(function(command, callback) {
    this.log(eval(command));
    callback();
}));



vorpal
.mode('consnet [lobule]', "Enters into a Consnet REPL session.")
.delimiter("cn:")
.init(function(args, callback){
    this.log("Consnet mode on. Type code to evaluate, end with 'exit'.");
    if (args.lobule)
        sys.consnet = sys.brain[args.lobule].states[0];
    else
        sys.consnet = new cn.Consnet({ enableLog: true });
    callback();
})
.action(tryF(function(command, callback) {
    sys.consnet.enableLog = true;
    sys.consnet.execute.call(sys.consnet, command);
    delete sys.consnet.enableLog;
    callback();
}));



vorpal
.mode('dce', "Enters into a DCE REPL session.")
.delimiter("nl:")
.init(function(args, callback){
    this.log("Controlled Natural Language mode on. Type code to evaluate, end with 'exit'.");
    callback();
})
.action(tryF(function(txt, callback) {

    vorpal.log(JSON.stringify(dce.parse(txt), null, 4));
    callback();
}));



vorpal.write = vorpal.log;

var systemLog = new Signale({
    stream: vorpal,
    scope: "system"
});



// Initializers ********************************************************************************



sys.initializeBrain = function initializeBrain(enodoc) {

    var idGen = enodoc.section("brain").field("IDGEN").optionalStringValue();
    if (idGen) sys.currentId = idGen;

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
        currentValue: new cn.Consnet({
            clone: JSON.parse(enoSection.fieldset("output").entry("currentValue").requiredStringValue()) }),
        futureValue: new cn.Consnet({
            clone: JSON.parse(enoSection.fieldset("output").entry("futureValue").requiredStringValue()) }),
        observedBy: JSON.parse(enoSection.fieldset("output").entry("observedBy").requiredStringValue()),
    };

    lobule.metaOutput = {
        currentValue: new cn.Consnet({
            clone: JSON.parse(enoSection.fieldset("metaOutput").entry("currentValue").requiredStringValue()) }),
        futureValue: new cn.Consnet({
            clone: JSON.parse(enoSection.fieldset("metaOutput").entry("futureValue").requiredStringValue()) }),
        observedBy: JSON.parse(enoSection.fieldset("metaOutput").entry("observedBy").requiredStringValue()),
    };

    lobule.prisms = enoSection.list("prisms").requiredStringValues();

    lobule.states =
        enoSection.section("stateHistory").sections("state").map(
            section => {
                var s = new cn.Consnet();
                s.execute(section.list("net").requiredStringValues().join('\n'));
                section.elements().filter(el => el.yieldsField()).forEach(field => {
                    s[field.stringKey()] = JSON.parse(field.toField().requiredStringValue());
                });
                return s;
            }
        );

    return lobule;
}



// Serializers ********************************************************************************



sys.serializeBrain = function serializeBrain() {

    var fileContent = "# brain\n\nIDGEN: "+newId()+"\n\n";
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

observedOutputs: ${lobule.input.observedOutputs.map(item => "\n- "+item).join('')}

observedMetaOutputs: ${lobule.input.observedMetaOutputs.map(item => "\n- "+item).join('')}

output:
currentValue = ${JSON.stringify({ net: lobule.output.currentValue.net })}
futureValue = ${JSON.stringify({ net: lobule.output.futureValue.net })}
observedBy = ${JSON.stringify(lobule.output.observedBy)}

metaInput: ${Object.keys(lobule.metaInput).map(key => '\n'+key+" = "+lobule.metaInput[key])}

metaOutput:
currentValue = ${JSON.stringify({ net: lobule.metaOutput.currentValue.net })}
futureValue = ${JSON.stringify({ net: lobule.metaOutput.futureValue.net })}
observedBy = ${JSON.stringify(lobule.metaOutput.observedBy)}

prisms: ${lobule.prisms.map(item => "\n- "+item).join('')}

### stateHistory

${lobule.states.map(state => {

    var result = "#### state\n\n";

    var code = cn.codify(state.net).trim();

    if (code.length > 0) {
        result += "net:\n";
        result += code.split('\n').map(line => "- "+line+'\n').join('')+'\n';
    }
    result += Object.keys(state).map(key => (key === "net") ? '' : key+": "+state[key]+'\n').join('');

    return result+'\n';
}).join('')}
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
        currentValue: new cn.Consnet(),
        futureValue: new cn.Consnet(),
        observedBy: []
    };

    this.initializer = "defaultInitializer";
    this.serializer = "defaultSerializer";

    this.prisms = [];           // array of function names
    this.states = [];           // history of the state object, 0 is current

    this.metaInput = {          // control panel
        historyLength: 10
    };
    this.metaOutput = {         // indicates what's being done
        currentValue: new cn.Consnet(),
        futureValue: new cn.Consnet(),
        observedBy: []
    };

    sys.brain[name] = this;
}



sys.Lobule.prototype.setLobe = function(lobe) {

    lobe = lobe || "default";
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

        var effect = {},
            data = {},
            inactive = false,
            activationChain = [];

        if (lobule.states.length > 0) {

            data.state = new cn.Consnet({ clone: lobule.states[0] });
            Object.keys(lobule.states[0]).forEach(key => {
                if (key !== "net") data.state[key] = JSON.parse(JSON.stringify(lobule.states[0][key]));
            });

        } else {
            data.state = new cn.Consnet();
        }

        data.history = lobule.states;

        data.input = {
            observedOutputs: {},
            observedMetaOutputs : {}
        };

        // load observed values (save by lobule name)
        for (var oo of lobule.input.observedOutputs)
            data.input.observedOutputs[oo] = sys.brain[oo].output.currentValue;

        // load observed meta-values (save by lobule name)
        for (var om of lobule.input.observedMetaOutputs)
            data.input.observedMetaOutputs[om] = sys.brain[om].metaOutput.currentValue;

        data.metaInput = lobule.metaInput;

        data.output = new cn.Consnet();
        
        // run the prism chain
        for (var prism of lobule.prisms) {

            ({ data, effect, inactive } = sys.prism[prism](data, effect));

            if (!inactive) activationChain.push(prism);
        }

        data.metaOutput = new cn.Consnet();

        // insert activationChain in metaOutput
        data.metaOutput.chainItems(activationChain, "NextEvent");
        data.metaOutput.linkItemsToGroup("ActivationChain", "Abstraction", activationChain);

        lobule.output.futureValue =     new cn.Consnet({ clone: data.output });
        lobule.metaOutput.futureValue = data.metaOutput;

        lobule.states.unshift(data.state);

        while (lobule.states.length > lobule.metaInput.historyLength) lobule.states.pop();
    }

    for (var lobuleName in sys.brain) {

        var lobule = sys.brain[lobuleName];

        lobule.output.currentValue =     lobule.output.futureValue;
        lobule.metaOutput.currentValue = lobule.metaOutput.futureValue;
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


