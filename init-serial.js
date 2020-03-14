


module.exports = function (sys) {



    sys.initialize = function (enodoc) {

        var idGen = enodoc.section("mind").field("idgen").optionalStringValue();
        if (idGen) sys.currentId = idGen;

        var inDisc = enodoc.section("mind").field("indisc").optionalStringValue();
        if (inDisc) sys.mom.load(inDisc);

        var cnContent = enodoc.section("mind").field("consnet").optionalStringValue();
        if (cnContent) sys.consnet = new sys.cn.Consnet({ clone: JSON.parse(cnContent) });
    }



    sys.serialize = function () {

        var result = "\n# mind\n\n";
        result += "idgen: " + sys.newId() + "\n\n";
        result += "indisc: " + sys.mom.save() + "\n\n";
        result += "-- consnet\n";
        result += JSON.stringify(sys.consnet, null, 4) + '\n';
        result += "-- consnet\n";

        return result;
    }



}



