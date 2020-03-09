module.exports = function(sys) {



    var module = {};



    const tree = {};



    module.setLine = function(line, fruit) {

        var cursor = tree,
            parent;

        line.forEach(token => {

            if (!cursor[token]) cursor[token] = { branch: {}, count: 0 };
            parent = cursor[token];
            cursor[token].count += 1;
            cursor = cursor[token].branch;
        });
        parent.fruit = fruit;
    };



    module.removeLine = function(rawLine) {

        var cursor = tree,
            line = rawLine.slice(0);

        while (line.length) {

            if (cursor[line[0]].count == 1) {
                delete cursor[line[0]];
                line = [];
            } else {
                cursor[line[0]].count -= 1;
                cursor = cursor[line[0]].branch;
                line.shift();
            }
        }
    };



    function query(line, cursor) {

        var found;

        if (line.length > 1) {

            if (cursor[line[0]]) found = query(line.slice(1), cursor[line[0]].branch);
            if (found) return found;
            
            if (cursor['?']) found = query(line.slice(1), cursor['?'].branch);
            if (found) return found;
            
            if (cursor['*']) while (!found && line.length > 1) {
                line.shift();
                found = query(line, cursor['*'].branch);
            }
            if (found) return found;
            if (cursor['*']) return cursor['*'].fruit;

            return undefined;
        }
        if (cursor[line[0]]) return cursor[line[0]].fruit;
        if (cursor['?']) return cursor['?'].fruit;
        if (cursor['*']) return cursor['*'].fruit;
    }



    module.queryLine = function(line) {

        var result = query(line.slice(0), tree);

        return result;
    };



    return module;
}