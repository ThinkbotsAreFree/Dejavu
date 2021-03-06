const parser = require("./consnet-parser.js");



function isEven(n) { return n % 2 == 0; }



module.exports = function (vorpal, newId) {



    function Consnet(opt) {

        this.net = {
            pair: {},
            left: {},
            right: {},
            value: {},
            lobe: {}
        };

        this.actor = {
            lobeName: "unspecified",
            lobuleName: "unspecified"
        };

        opt = opt || {};

        if (opt.enableLog) this.enableLog = true;

        if (opt.clone) Object.assign(this.net, opt.clone.net);
    }



    Consnet.prototype.newCellId = function (prefix) {

        return this.actor.lobeName + '.' + this.actor.lobuleName + '.' + newId(prefix);
    }



    Consnet.prototype.fullId = function (id) {

        var split = id.split('.');

        var cellName = split[split.length-1];
        var lobuleName = split[split.length-2] || this.actor.lobuleName;
        var lobeName = split[split.length-3] || this.actor.lobeName;

        return lobeName+'.'+lobuleName+'.'+cellName;
    }



    Consnet.prototype.perform = function (fact) {

        for (var f = 0; f < fact.length; f++) {

            var result = Consnet.prototype.process.call(this, fact[f]);
            if (this.enableLog) vorpal.log(result);
        }
    };



    Consnet.prototype.show = function (data) {

        if (this.enableLog) {
            vorpal.log(stringify(data));
            vorpal.log(JSON.stringify(data, null, 4));
        }
    };



    Consnet.prototype.dump = function (data) {

        if (this.enableLog) {
            vorpal.log(codify(this.net));
            vorpal.log(JSON.stringify(this.net, null, 4));
        }
    };



    Consnet.prototype.pair = function (data) {

        if (data.length !== 2) throw new Error("Invalid number of arguments: expected 2, got " + data.length);
        if (typeof data[0] !== "string") throw new Error("Expected identifier: got " + data[0].type);
        if (data[1].type !== "pair") throw new Error("Expected pair: got " + (data[1].type || "identifier"));

        var l = this.process.call(this, data[1].left),
            r = this.process.call(this, data[1].right);

        return this.newPair(l, r, data[0]);

    };



    Consnet.prototype.link = function (data) {

        if (data.length < 3) throw new Error("Invalid number of arguments: expected at least 3, got " + data.length);

        return this.linkItemsToGroup(
            data[0],
            data[1],
            data.slice(2)
        );
    };



    Consnet.prototype.find = function (data) {

        if (data.length !== 2) throw new Error("Invalid number of arguments: expected 2, got " + data.length);

        return this.findItemsInGroup(
            data[0],
            data[1]
        );
    };



    Consnet.prototype.union = function (data) {

        if (!isEven(data.length)) throw new Error("Invalid number of arguments: expected even number of args, got " + data.length);

        var args = [];

        while (data.length > 0) args.push({
            group: data.shift(),
            link: data.shift()
        });

        return this.findItemsInGroupsUnion(args);
    };



    Consnet.prototype.intersection = function (data) {

        if (!isEven(data.length)) throw new Error("Invalid number of arguments: expected even number of args, got " + data.length);

        var args = [];

        while (data.length > 0) args.push({
            group: data.shift(),
            link: data.shift()
        });

        return this.findItemsInGroupsIntersection(args);
    };



    Consnet.prototype.authorizedCommands = [
        "perform",
        "show",
        "dump",
        "pair",
        "link",
        "find",
        "union",
        "intersection"
    ];



    Consnet.prototype.execute = function (cmd) {

        var fact = parser.parse(cmd, this.actor);

        this.perform.call(this, fact);
    };



    Consnet.prototype.process = function (data) {

        if (data.type === "pair") {

            var l = this.process.call(this, data.left),
                r = this.process.call(this, data.right);

            return this.newPair(l, r);
        }

        if (data.type === "structure") {

            if (!this.authorizedCommands.includes(data.head)) throw new Error("Uknown command: " + data.head);
            return this[data.head].call(this, data.content);
        }

        if (data.type === "value") {

            var vid = this.newCellId('V');
            this.net.value[vid] = data.value;
            return vid;
        }

        return data;
    };



    Consnet.prototype.newPair = function (left, right, name) {

        var id = name || this.newCellId('P');

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

        /*if (!this.net.rightOf[left]) this.net.rightOf[left] = [];
        this.net.rightOf[left].push(right);*/

        if (this.net.pair[right]) {

            this.net.pair[right].rightOf.push(id);
        }

        if (!this.net.right[right]) this.net.right[right] = [];
        this.net.right[right].push(id);

        /*if (!this.net.leftOf[right]) this.net.leftOf[right] = [];
        this.net.leftOf[right].push(left);*/

        if (!this.net.lobe[this.actor.lobeName])
            this.net.lobe[this.actor.lobeName] = {};

        if (!this.net.lobe[this.actor.lobeName][this.actor.lobuleName])
            this.net.lobe[this.actor.lobeName][this.actor.lobuleName] = [];

        if (!this.net.lobe[this.actor.lobeName][this.actor.lobuleName].includes(id))
            this.net.lobe[this.actor.lobeName][this.actor.lobuleName].push(id);

        if (!this.net.lobe[this.actor.lobeName][this.actor.lobuleName].includes(left))
            this.net.lobe[this.actor.lobeName][this.actor.lobuleName].push(left);

        if (!this.net.lobe[this.actor.lobeName][this.actor.lobuleName].includes(right))
            this.net.lobe[this.actor.lobeName][this.actor.lobuleName].push(right);

        return id;
    };



    Consnet.prototype.merge = function (cn2) {

        var code = codify(this.net) + ' ' + codify(cn2.net);

        var tmp = new Consnet({ enableLog: false });

        tmp.execute(code);

        this.net = JSON.parse(JSON.stringify(tmp.net));
    };



    Consnet.prototype.linkItemsToGroup = function (group, link, itemList) {

        for (var i = 0; i < itemList.length; i++)
            this.execute(`[${link} [${group} ${itemList[i]}]]`);
    };



    Consnet.prototype.findItemsInGroup = function (group, link, itemsFound, strategy) {

        var result = [];

        var listPairsWithGroupOnLeft = this.net.left[group];

        for (var lpwgol = 0; lpwgol < listPairsWithGroupOnLeft.length; lpwgol++) {

            var pairWithGroupOnLeft = listPairsWithGroupOnLeft[lpwgol];

            var candidate = this.net.pair[pairWithGroupOnLeft].right;

            if (strategy === "intersection")
                if (itemsFound && !itemsFound.includes(candidate)) continue;

            if (strategy === "union")
                if (itemsFound && itemsFound.includes(candidate)) continue;

            var listPairsItsOnRightOf = this.net.pair[pairWithGroupOnLeft].rightOf;

            for (var lpioro = 0; lpioro < listPairsItsOnRightOf.length; lpioro++) {

                var potentialLink = this.net.pair[listPairsItsOnRightOf[lpioro]];

                if (potentialLink.left === link)

                    result.push(candidate);
            }
        }
        return result;
    };



    Consnet.prototype.findItemsInGroupsMulti = function (criteria, strategy) {

        var itemsFound = false;

        for (var c = 0; c < criteria.length; c++) {

            var found = this.findItemsInGroup(
                criteria[c].group,
                criteria[c].link,
                itemsFound,
                strategy
            );
            if (strategy === "intersection") itemsFound = found;
            if (strategy === "union") itemsFound = (itemsFound || []).concat(found);
        }
        return itemsFound;
    };



    Consnet.prototype.findItemsInGroupsIntersection = function (criteria) {

        return this.findItemsInGroupsMulti(criteria, "intersection");
    };



    Consnet.prototype.findItemsInGroupsUnion = function (criteria) {

        return this.findItemsInGroupsMulti(criteria, "union");
    };



    Consnet.prototype.chainItems = function (itemList, link) {

        if (itemList.length < 2) return;

        for (var i = 1; i < itemList.length; i++)
            this.execute(`[${link} [${itemList[i - 1]} ${itemList[i]}]]`);
    };



    // todo path



    Consnet.prototype.getLeft = function (item) {

        return this.net.right[this.fullId(item)].map(pair => this.net.pair[pair].left);
    }



    Consnet.prototype.getRight = function (item) {

        return this.net.left[this.fullId(item)].map(pair => this.net.pair[pair].right);
    }



    Consnet.prototype.getLeftValue = function (item) {

        return this.net.right[this.fullId(item)].map(pair => this.net.value[this.net.pair[pair].left]);
    }



    Consnet.prototype.getRightValue = function (item) {

        return this.net.left[this.fullId(item)].map(pair => this.net.value[this.net.pair[pair].right]);
    }



    Consnet.prototype.delete = function (id, depth) {

        var target = this.fullId(id);

        vorpal.log("deleting " + target);
        depth = depth || 0;

        if (this.net.pair[target]) {

            var l = this.net.pair[target].left,
                r = this.net.pair[target].right;

            // left
            this.net.left[l] = this.net.left[l].filter(id => id !== target);
            if (this.net.left[l].length === 0) delete this.net.left[l];

            // right
            this.net.right[r] = this.net.right[r].filter(id => id !== target);
            if (this.net.right[r].length === 0) delete this.net.right[r];

            if (depth > 0) { // forward deleting

                this.delete(l, depth - 1);
                this.delete(r, depth - 1);
            }

            delete this.net.pair[target];
        }

        if (this.net.value[target]) {

            delete this.net.value[target];
        }

        if (depth < 0) { // backward deleting

            var lo = this.net.left[target];
            if (lo) for (let o = 0; o < lo.length; o++) this.delete(lo[o], depth - 1);

            var ro = this.net.right[target];
            if (ro) for (let o = 0; o < ro.length; o++) this.delete(ro[o], depth - 1);
        }

    };



    function stringify(net) {

        if (Array.isArray(net)) {

            return net.map(stringify).join(' ');

        } else {

            switch (net.type) {

                case "pair":
                    return '[' + stringify(net.left) + ' ' + stringify(net.right) + ']';

                case "structure":
                    return stringify(net.head) + '(' + stringify(net.content) + ')';

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

            result += "pair( " + p + ' ';
            l = mem.value[mem.pair[p].left] ? JSON.stringify(mem.value[mem.pair[p].left]) : mem.pair[p].left;
            r = mem.value[mem.pair[p].right] ? JSON.stringify(mem.value[mem.pair[p].right]) : mem.pair[p].right;
            result += '[' + l + ' ' + r + ']';
            result += " )\n";
        }

        return result;
    }



    return {

        parse: parser.parse,

        stringify: stringify,

        codify: codify,

        Consnet: Consnet

    };
};