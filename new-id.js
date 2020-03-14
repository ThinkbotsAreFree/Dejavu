


module.exports = function (sys) {



    sys.newId = (function () {
        sys.currentId = '0';
        var addOne = function (s) {
            let newNumber = '';
            let continueAdding = true;
            for (let i = s.length - 1; i >= 0; i--) {
                if (continueAdding) {
                    let num = parseInt(s[i], 10) + 1;
                    if (num < 10) {
                        newNumber += num;
                        continueAdding = false;
                    } else {
                        newNumber += '0';
                        if (i == 0) newNumber += '1';
                    }
                } else {
                    newNumber += s[i];
                }
            }
            return newNumber.split('').reverse().join('');
        }
        return function (prefix) {
            prefix = prefix || '';
            sys.currentId = addOne(sys.currentId);
            return prefix + sys.currentId;
        };
    })();



    sys.changeCurrentId = function (id) {

        sys.currentId = id;
    }



}


