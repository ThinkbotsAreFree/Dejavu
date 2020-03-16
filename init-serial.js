


module.exports = function (sys) {



    sys.initialize = function (enodoc) {

        var idGen = enodoc.section("brain").field("idgen").optionalStringValue();
        if (idGen) sys.currentId = idGen;

        var inDisc = enodoc.section("brain").field("indisc").optionalStringValue();
        if (inDisc) sys.mom.load(inDisc);

        var cnContent = enodoc.section("brain").field("consnet").optionalStringValue();
        if (cnContent) sys.consnet = new sys.cn.Consnet({ clone: JSON.parse(cnContent) });

        enodoc.section("brain").fieldsets("lobule").forEach(element => {

            var fieldset = element;

            new sys.Lobule(
                fieldset.entry("lobe").requiredStringValue(),
                fieldset.entry("pchain").requiredStringValue().split(' '),
                fieldset.entry("name").requiredStringValue(),
                fieldset.entry("description").requiredStringValue()
            );
        });
        
    }



    sys.serialize = function () {

        var lobules = '';

        for (var lobeName in sys.lobe)
            for (var lobuleName in sys.lobe[lobeName].lobule)
                lobules += sys.lobe[lobeName].lobule[lobuleName].toString();

        var result = "\n# brain\n\n";
        result += "idgen: " + sys.newId() + "\n\n";
        result += "indisc: " + sys.mom.save() + "\n";
        result += lobules+'\n';
        result += "-- consnet\n";
        result += JSON.stringify(sys.consnet, null, 4) + '\n';
        result += "-- consnet\n";

        return result;
    }



}



