const parser = require("./consnet-parser.js");



module.exports = function(vorpal, newId) {



    function Consnet(opt) {

        this.net = {
            pair:  {},
            left:  {},
            right: {},
            value: {}
        };

        opt = opt || {};

        this.enableLog = opt.enableLog ? true : false;

        if (opt.clone) Object.assign(this.net, opt.clone.net);
    }



    Consnet.prototype.assert = function(fact) {

        for (var f=0; f<fact.length; f++) {

            Consnet.prototype.process.call(this, fact[f]);
        }
    };



    Consnet.prototype.show = function(data) {

        if (this.enableLog) {
            vorpal.log(stringify(data));
            vorpal.log(JSON.stringify(data, null, 4));
        }
    };



    Consnet.prototype.dump = function(data) {

        if (this.enableLog) {
            vorpal.log(codify(this.net));
            vorpal.log(JSON.stringify(this.net, null, 4));
        }
    };



    Consnet.prototype.pair = function(data) {

        if (data.length !== 2) throw new Error("Invalid number of arguments (expected 2): got "+data.length);
        if (typeof data[0] !== "string") throw new Error("Expected identifier: got "+data[0].type);
        if (data[1].type !== "pair") throw new Error("Expected pair: got "+(data[1].type || "identifier"));

        var l = this.process.call(this, data[1].left),
            r = this.process.call(this, data[1].right);
    
        return this.newPair(l, r, data[0]);
    
    };



    Consnet.prototype.authorizedCommands = [
        "assert",
        "show",
        "dump",
        "pair"
    ];



    Consnet.prototype.execute = function(cmd) {

        var fact = parser.parse(cmd);

        this.assert.call(this, fact);
    };



    Consnet.prototype.process = function(data) {

        if (data.type === "pair") {

            var l = this.process.call(this, data.left),
                r = this.process.call(this, data.right);
            
            return this.newPair(l, r);
        }

        if (data.type === "structure") {

            if (!this.authorizedCommands.includes(data.head)) throw new Error("Uknown command: "+data.head);
            return this[data.head].call(this, data.content);
        }

        if (data.type === "value") {

            var vid = newId('v');
            this.net.value[vid] = data.value;
            return vid;
        }

        return data;
    };



    Consnet.prototype.newPair = function(left, right, name) {

        var id = name || newId('p');

        if (this.net.pair[id]) return;

        this.net.pair[id] = {
            left: left,
            right: right,
            leftOf: [],
            rightOf: []
        };

        if (this.net.pair[left]) {
            
            this.net.pair[left].leftOf.push(id);
        }

        if (!this.net.left[left]) this.net.left[left] = [];
        this.net.left[left].push(id);

        if (this.net.pair[right]) {

            this.net.pair[right].rightOf.push(id);
        }

        if (!this.net.right[right]) this.net.right[right] = [];
        this.net.right[right].push(id);

        return id;
    };



    Consnet.prototype.merge = function(cn2) {

        var code = codify(this.net)+' '+codify(cn2.net);

        var tmp = new Consnet({enableLog: false});

        tmp.execute(code);

        this.net = JSON.parse(JSON.stringify(tmp.net));
    };



    Consnet.prototype.linkItemsToGroup = function(group, linkType, itemList) {

        for (var i = 0; i<itemList.length; i++)
            this.execute(`[${linkType} [${group} ${itemList[i]}]]`);
    };



    Consnet.prototype.findItemsInGroup = function(group, linkType, itemsFound, strategy) {

        var result = [];

        var listPairsWithGroupOnLeft = this.net.left[group];

        for (var lpwgol=0; lpwgol<listPairsWithGroupOnLeft.length; lpwgol++) {

            var pairWithGroupOnLeft = listPairsWithGroupOnLeft[lpwgol];

            var candidate = this.net.pair[pairWithGroupOnLeft].right;

            if (strategy === "intersection")
                if (itemsFound && !itemsFound.includes(candidate)) continue;

            if (strategy === "union")
                if (itemsFound && itemsFound.includes(candidate)) continue;

            var listPairsItsOnRightOf = this.net.pair[pairWithGroupOnLeft].rightOf;

            for (var lpioro=0; lpioro<listPairsItsOnRightOf.length; lpioro++) {

                var potentialLink = this.net.pair[listPairsItsOnRightOf[lpioro]];

                if (potentialLink.left === linkType)
                
                    result.push(candidate);
            }
        }
        return result;
    };



    Consnet.prototype.findItemsInGroupsMulti = function(criteria, strategy) {

        var itemsFound = false;

        for (var c=0; c<criteria.length; c++) {

            var found = this.findItemsInGroup(
                criteria[c].group,
                criteria[c].linkType,
                itemsFound,
                strategy
            );
            if (strategy === "intersection") itemsFound = found;
            if (strategy === "union") itemsFound = (itemsFound || []).concat(found);
        }
        return itemsFound;
    };



    Consnet.prototype.findItemsInGroupsIntersection = function(criteria) {

        return this.findItemsInGroupsMulti(criteria, "intersection");
    };



    Consnet.prototype.findItemsInGroupsUnion = function(criteria) {

        return this.findItemsInGroupsMulti(criteria, "union");
    };



    function stringify(net) {

        if (Array.isArray(net)) {

            return net.map(stringify).join(' ');

        } else {

            switch (net.type) {

                case "pair":
                    return '['+stringify(net.left)+' '+stringify(net.right)+']';

                case "structure":
                    return stringify(net.head)+'('+stringify(net.content)+')';
                
                case "value":
                    return JSON.stringify(net.value);
                
                default:
                    return net;
            }
        }
    }



    function codify(mem) {

        var result = '',
            l,
            r;

        for (var p in mem.pair) {

            result += "pair( "+p+' ';
            l = mem.value[mem.pair[p].left] ? JSON.stringify(mem.value[mem.pair[p].left]) : mem.pair[p].left;
            r = mem.value[mem.pair[p].right] ? JSON.stringify(mem.value[mem.pair[p].right]) : mem.pair[p].right;
            result += '['+l+' '+r+']';
            result += " )\n";
        }

        return result;
    }



    return {

        parse: parser.parse,

        stringify: stringify,

        normalize: function(x) { return stringify(parser.parse(x)); },

        Consnet: Consnet

    };
};