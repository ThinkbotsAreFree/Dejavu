


module.exports = function (sys) {



    function Lobule(lobe, pchain, name, description) {

        var lobuleName = name || sys.newId('L');

        if (!sys.lobe[lobe]) sys.lobe[lobe] = {
            lobule: {}
        };

        if (sys.lobe[lobe].lobule[lobuleName]) throw new Error("Lobule name already used");

        this.lobe = lobe;
        this.name = lobuleName;
        this.pchain = pchain || [];
        this.description = description || name + " (no description)";

        sys.lobe[lobe].lobule[lobuleName] = this;
    }



    Lobule.prototype.toString = function () {

        return `
lobule:
name = ${this.name}
lobe = ${this.lobe}
pchain = ${this.pchain.join(' ')}
description = ${this.description}
`;
    }



    sys.Lobule = Lobule;
};


