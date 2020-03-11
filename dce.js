


const parser = require("./english-parser.js");


var superlative = {

    "good": "best",
    "new": "newest",
    "long": "longest",
    "great": "greatest",
    "little": "littlest",
    "old": "oldest",
    "big": "biggest",
    "high": "highest",
    "low": "lowest",
    "small": "smallest",
    "large": "largest",
    "early": "earliest",
    "young": "youngest",
    "few": "fewest",
    "bad": "worst"
};


var metaAssertionQuestion = {
    "true": { sign: "positive", tail: "true", base: "truth", value: true },
    "not true": { sign: "negative", tail: "true", base: "truth", value: false },
    "false": { sign: "positive", tail: "false", base: "truth", value: false },
    "not false" : { sign: "negative", tail: "false", base: "truth", value: true },
    "possible": { sign: "positive", tail: "possible", base: "possibility", value: true },
    "not possible": { sign: "negative", tail: "possible", base: "possibility", value: false },
    "impossible": { sign: "positive", tail: "impossible", base: "possibility", value: false },
    "not impossible": { sign: "negative", tail: "impossible", base: "possibility", value: true },
    "necessary": { sign: "positive", tail: "necessary", base: "necessity", value: true },
    "not necessary": { sign: "negative", tail: "necessary", base: "necessity", value: false },
    "provable": { sign: "positive", tail: "provable", base: "provability", value: true },
    "not provable": { sign: "negative", tail: "provable", base: "provability", value: false },
}

var metaAQ = {};

for (var m in metaAssertionQuestion) {

    metaAQ["s:"+metaAssertionQuestion[m].sign+" t:"+metaAssertionQuestion[m].tail] = m;
}



var comparativeLongToShort = {
    "more good": "better",
    "more new": "newer",
    "more long": "longer",
    "more grate": "greater",
    "more old": "older",
    "more big": "bigger",
    "more high": "higher",
    "more low": "lower",
    "more small": "smaller",
    "more large": "larger",
    "more early": "earlier",
    "more young": "younger",
    "more few": "fewer",
    "more bad": "worse"
};

var comparativeShortToLong = {};

for (var c in comparativeLongToShort) comparativeShortToLong[comparativeLongToShort[c]] = c;



var auxrDef = {
    "not be": { base: "be", sign: "negative" },
    "not provably not": { base: "prove", sign: "negative", tail: "negative" },
    "not provably": { base: "prove", sign: "negative" },
    "not have to be": { base: "have to", sign: "negative", person: "other", tail: "be" },
    "not have to": { base: "have to", sign: "negative", person: "other" },
    "not": { base: "negative" },
    "has to be": { base: "have to", sign: "positive", person: "third", tail: "be" },
    "has to": { base: "have to", sign: "positive", person: "third" },
    "have to be": { base: "have to", sign: "positive", person: "other", tail: "be" },
    "have to": { base: "have to", sign: "positive", person: "other" },
    "be": { base: "be", sign: "positive" }
};


var auxrest = {};

for (var a in auxrDef) {

    var key = auxrDef[a].base;
    if (auxrDef[a].sign) key += " s:"+auxrDef[a].sign;
    if (auxrDef[a].person) key += " p:"+auxrDef[a].person;
    if (auxrDef[a].tail) key += " t:"+auxrDef[a].tail;

    auxrest[key] = a;
}


function auxr(base, sign, person, tail) {

    var key = base;
    if (sign) key += " s:"+sign;
    if (person) key += " p:"+person;
    if (tail) key += " t:"+tail;

    return auxrest[key];
}



var auxiDef = {
    "does not ": {
        base: "do",
        person: "third",
        sign: "negative",
        numberCategory: "singular"
    },
    "does ": {
        base: "do",
        person: "third",
        sign: "positive",
        numberCategory: "singular"
    },
    "do not ": {
        base: "do",
        person: "other",
        sign: "negative",
        numberCategory: "unknown"
    },
    "do ": {
        base: "do",
        person: "other",
        sign: "positive",
        numberCategory: "unknown"
    },
    "are not ": {
        base: "be",
        person: "other",
        sign: "negative",
        numberCategory: "plural"
    },
    "are ": {
        base: "be",
        person: "other",
        sign: "positive",
        numberCategory: "plural",
    },
    "is not ": {
        base: "be",
        person: "unknown",
        sign: "negative",
        numberCategory: "singular"
    },
    "is ": {
        base: "be",
        person: "unknown",
        sign: "positive",
        numberCategory: "singular"
    },
    "be ": {
        base: "be",
        person: "infinitive",
        sign: "positive",
        numberCategory: "singular"
    },
    "must not ": {
        base: "must",
        person: "unknown",
        sign: "negative",
        numberCategory: "unknown"
    },
    "must ": {
        base: "must",
        person: "unknown",
        sign: "positive",
        numberCategory: "unknown"
    },
    "cannot ": {
        base: "can",
        person: "unknown",
        sign: "negative",
        numberCategory: "unknown"
    },
    "can ": {
        base: "can",
        person: "unknown",
        sign: "positive",
        numberCategory: "unknown"
    },
    "should not ": {
        base: "should",
        person: "unknown",
        sign: "negative",
        numberCategory: "unknown"
    },
    "should ": {
        base: "should",
        person: "unknown",
        sign: "positive",
        numberCategory: "unknown"
    },
    "may not ": {
        base: "may",
        person: "unknown",
        sign: "negative",
        numberCategory: "unknown"
    },
    "may ": {
        base: "may",
        person: "unknown",
        sign: "positive",
        numberCategory: "unknown"
    }
};


var auxiliary = {};

for (a in auxiDef) {

    if (!auxiliary[auxiDef[a].base]) auxiliary[auxiDef[a].base] = {};

    auxiliary[auxiDef[a].base]["p:"+auxiDef[a].person+" s:"+auxiDef[a].sign+" n:"+auxiDef[a].numberCategory] = a;
}

function auxi(base, person, sign, number) {

    return auxiliary[base][
         "p:"+(person || "unknown")+
        " s:"+(sign || "unknown")+
        " n:"+(number || "unknown")
    ];
}



var verbDef = {

    "saying": { infinitive: "to say", variant: "ing" },
    "says": { infinitive: "to say", variant: "third" },
    "say": { infinitive: "to say", variant: "default" },
    "said": { infinitive: "to say", variant: "ed" },
 
    "getting": { infinitive: "to get", variant: "ing" },
    "gets": { infinitive: "to get", variant: "third" },
    "get": { infinitive: "to get", variant: "default" },
    "gotten": { infinitive: "to get", variant: "ed" },
    "got": { infinitive: "to get", variant: "ed" },
 
    "making": { infinitive: "to make", variant: "ing" },
    "makes": { infinitive: "to make", variant: "third" },
    "make": { infinitive: "to make", variant: "default" },
    "made": { infinitive: "to make", variant: "ed" },
 
    "going": { infinitive: "to go", variant: "ing" },
    "goes": { infinitive: "to go", variant: "third" },
    "gone": { infinitive: "to go", variant: "ed" },
    "go": { infinitive: "to go", variant: "default" },
 
    "knowing": { infinitive: "to know", variant: "ing" },
    "knows": { infinitive: "to know", variant: "third" },
    "known": { infinitive: "to know", variant: "ed" },
    "know": { infinitive: "to know", variant: "default" },
 
    "takes": { infinitive: "to take", variant: "ing" },
    "taking": { infinitive: "to take", variant: "third" },
    "taken": { infinitive: "to take", variant: "ed" },
    "take": { infinitive: "to take", variant: "default" },
 
    "sees": { infinitive: "to see", variant: "ing" },
    "seeing": { infinitive: "to see", variant: "third" },
    "seen": { infinitive: "to see", variant: "ed" },
    "see": { infinitive: "to see", variant: "default" },
 
    "comes": { infinitive: "to come", variant: "third" },
    "come": { infinitive: "to come", variant: "default" },
    "coming": { infinitive: "to come", variant: "ing" },
 
    "thinks": { infinitive: "to think", variant: "third" },
    "thinking": { infinitive: "to think", variant: "ing" },
    "think": { infinitive: "to think", variant: "default" },
    "thought": { infinitive: "to think", variant: "ed" },
 
    "looks": { infinitive: "to look", variant: "third" },
    "looking": { infinitive: "to look", variant: "ing" },
    "looked": { infinitive: "to look", variant: "ed" },
    "look": { infinitive: "to look", variant: "default" },
 
    "wants": { infinitive: "to want", variant: "third" },
    "wanting": { infinitive: "to want", variant: "ing" },
    "wanted": { infinitive: "to want", variant: "ed" },
    "want": { infinitive: "to want", variant: "default" },
 
    "gives": { infinitive: "to give", variant: "third" },
    "giving": { infinitive: "to give", variant: "ing" },
    "given": { infinitive: "to give", variant: "ed" },
    "give": { infinitive: "to give", variant: "default" },
 
    "uses": { infinitive: "to use", variant: "third" },
    "using": { infinitive: "to use", variant: "ing" },
    "used": { infinitive: "to use", variant: "ed" },
    "use": { infinitive: "to use", variant: "default" },
 
    "finds": { infinitive: "to find", variant: "third" },
    "finding": { infinitive: "to find", variant: "ing" },
    "found": { infinitive: "to find", variant: "ed" },
    "find": { infinitive: "to find", variant: "default" },
 
    "tells": { infinitive: "to tell", variant: "third" },
    "telling": { infinitive: "to tell", variant: "ing" },
    "told": { infinitive: "to tell", variant: "ed" },
    "tell": { infinitive: "to tell", variant: "default" },
 
    "asks": { infinitive: "to ask", variant: "third" },
    "asking": { infinitive: "to ask", variant: "ing" },
    "asked": { infinitive: "to ask", variant: "ed" },
    "ask": { infinitive: "to ask", variant: "default" },
 
    "works": { infinitive: "to work", variant: "third" },
    "working": { infinitive: "to work", variant: "ing" },
    "worked": { infinitive: "to work", variant: "ed" },
    "work": { infinitive: "to work", variant: "default" },
 
    "seems": { infinitive: "to seem", variant: "third" },
    "seeming": { infinitive: "to seem", variant: "ing" },
    "seemed": { infinitive: "to seem", variant: "ed" },
    "seem": { infinitive: "to seem", variant: "default" },
 
    "feels": { infinitive: "to feel", variant: "third" },
    "feeling": { infinitive: "to feel", variant: "ing" },
    "felt": { infinitive: "to feel", variant: "ed" },
    "feel": { infinitive: "to feel", variant: "default" },
 
    "tries": { infinitive: "to try", variant: "third" },
    "trying": { infinitive: "to try", variant: "ing" },
    "tried": { infinitive: "to try", variant: "ed" },
    "try": { infinitive: "to try", variant: "default" },
 
    "leaves": { infinitive: "to leave", variant: "third" },
    "leave": { infinitive: "to leave", variant: "default" },
    "leaving": { infinitive: "to leave", variant: "ing" },
    "left": { infinitive: "to leave", variant: "ed" },
 
    "calls": { infinitive: "to call", variant: "third" },
    "calling": { infinitive: "to call", variant: "ing" },
    "called": { infinitive: "to call", variant: "ed" },
    "call": { infinitive: "to call", variant: "default" },
 
    "believes": { infinitive: "to believe", variant: "third" },
    "believing": { infinitive: "to believe", variant: "ing" },
    "believed": { infinitive: "to believe", variant: "ed" },
    "believe": { infinitive: "to believe", variant: "default" },
 
    "is": { infinitive: "to be", variant: "default" },
    "are": { infinitive: "to be", variant: "default" },
    "am": { infinitive: "to be", variant: "default" },
    "being": { infinitive: "to be", variant: "ing" },
    "been": { infinitive: "to be", variant: "ed" },
};


var conjugation = {};

for (v in verbDef) {

    if (!conjugation[verbDef[v].infinitive]) conjugation[verbDef[v].infinitive] = {
        1: 'am',
        2: 'are',
        3: 'is',
        4: 'are',
        5: 'are',
        6: 'are',
        ed: 'been',
        ing: 'being'
    };

    if (verbDef[v].infinitive !== "to be") {
        if (verbDef[v].variant === "third") conjugation[verbDef[v].infinitive][3] = v;
        else if (verbDef[v].variant === "default") {
            conjugation[verbDef[v].infinitive][1] = v;
            conjugation[verbDef[v].infinitive][2] = v;
            conjugation[verbDef[v].infinitive][4] = v;
            conjugation[verbDef[v].infinitive][5] = v;
            conjugation[verbDef[v].infinitive][6] = v;
        }
        else conjugation[verbDef[v].infinitive][verbDef[v].variant] = v;
    }
}


var variantToConjugation = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    default: 1,
    third: 3,
    ing: "ing",
    ed: "ed"
};

var variantToConjugationBe = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    default: 3,
    third: 3,
    ing: "ing",
    ed: "ed"
};



var isQuestion = false;

function stringify(node) {

    if (Array.isArray(node)) return node.map(stringify).join(' ');

    if (!node) return ' ';

    var result = ' ';



    if (node.type === "ExistentialQuestion") {

        if (node.numberCategory === "singular") {

            result = (node.sign === "positive") ? " is there " : " isn't there ";

        } else { // plural

            result = (node.sign === "positive") ? " are there " : " aren't there ";
        }

        if (Array.isArray(node.adverb)) result += node.adverb.map(stringify).join(' ');
        
        result += ' '+stringify(node.existing)+' ';

        if (Array.isArray(node.complement)) result += node.complement.map(stringify).join(' ');
        else if (node.complement) result += stringify(node.complement);

        isQuestion = true;

        return result;
    }



    if (node.type === "UniversalGroup" || node.type === "UniversalIndividual") {

        return ' '+stringify(node.quantor)+' '+stringify(node.topic)+' '+stringify(node.fact)+' ';

    }



    if (node.type === "Context") {

        return ' '+node.context+' '+(node.of ? "of " : '')+stringify(node.topic)+' '+stringify(node.fact)+' ';

    }

    

    if (node.type === "Determiner") {

        return ' '+stringify(node.determiner)+' '+stringify(node.determined)+' ';
    }



    if (node.type === "RelativeClause") {

        result = ' '+stringify(node.subject)+' '+stringify(node.link)+' '+stringify(node.verb)+' ';
        if (Array.isArray(node.complement)) result += node.complement.map(stringify).join(' ');
        else if (node.complement) result += stringify(node.complement);

        return result;
    }



    if (node.type === "Verb") {

        result = ' '+stringify(node.aux)+' ';
        if (Array.isArray(node.adverb)) result += node.adverb.map(stringify).join(' ');
        result += ' '+stringify(node.auxr)+' ';

        if (node.verb.infinitive === "to be")
            result += ' '+conjugation[node.verb.infinitive][variantToConjugationBe[node.verb.variant]]+' ';
        else
            result += ' '+conjugation[node.verb.infinitive][variantToConjugation[node.verb.variant]]+' ';
        
        return result;
    }



    if (node.type === "Auxiliary") {

        return ' '+auxi(node.auxi.base, node.auxi.person, node.auxi.sign, node.auxi.numberCategory)+' '+node.auxr.form+' ';
    }



    if (node.type === "Auxrest") {

        return ' '+auxr(node.auxr.base, node.auxr.sign, node.auxr.person, node.auxr.tail)+' ';
    }



    if (node.type === "Aux") {

        return ' '+auxi(node.base, node.person, node.sign, node.numberCategory)+' ';
    }



    if (node.type === "Sentence") {

        result = ' '+stringify(node.subject)+' '+stringify(node.verb)+' ';
        if (Array.isArray(node.complement)) result += node.complement.map(stringify).join(' ');
        else if (node.complement) result += stringify(node.complement);
        
        return result;
    }



    if (node.type === "Existential") {

        if (node.numberCategory === "singular") {

            if (node.sign === "positive")

                result += "there is ";

            else { // negative

                if (node.followedByDeterminer)
                    result += "there isn't ";
                else
                    result += "there is no ";
            }

        } else { // plural

            if (node.sign === "positive")

                result += "there are ";

            else { // negative

                if (node.followedByDeterminer)
                    result += "there aren't ";
                else
                    result += "there are no ";
            }
        }

        if (Array.isArray(node.adverb)) result += node.adverb.map(stringify).join(' ');
        else if (node.adverb) result += stringify(node.adverb);

        result += ' '+stringify(node.existing)+' ';

        if (Array.isArray(node.complement)) result += node.complement.map(stringify).join(' ');
        else if (node.complement) result += stringify(node.complement);

        return result;
    }



    if (node.type === "NothingBut") {

        return ' nothing but '+stringify(node.what)+' ';
    }



    if (node.type === "NobodyBut") {

        return ' nobody but '+stringify(node.what)+' ';
    }



    if (node.type === "EachOf") {

        return ' each of '+stringify(node.what)+' ';
    }


    if (node.type === "Link") {

        result += ' ( ';
        result += stringify(node.left)+' '+node.link+' '+stringify(node.right)+' ';
        result += ' ) ';

        return result;
    }



    if (node.type === "GeneralisedQuantor") {

        return ' '+node.quantor+' '+stringify(node.quantity)+' ';
    }



    if (node.type === "Generic") {

        return ' '+node.what+' ';
    }



    if (node.type === "Name") {

        return ' "'+node.name+'" ';
    }



    if (node.type === "Ownership") {

        var g = (node.owner[node.owner.length-1] === 's') ? "'" : "'s"
        return ' '+node.owner+g+' '+node.owned+' ';
    }



    if (node.type === "Possessive") {

        return ' '+node.pronoun+' '+(node.own ? "own" : '')+' '+stringify(node.owned);
    }



    if (node.type === "Comparison") {

        if (node.comparative) {

            result = ' '+node.comparative+" than "+stringify(node.target)+' ';

        } else if (node.comparison === "more" || node.comparison === "less") {

            result = ' '+node.comparison+' '+stringify(node.adjective)+" than "+stringify(node.target)+' ';

        } else {

            result = " as "+stringify(node.adjective)+" as "+stringify(node.target);
        }

        return result;
    }



    if (node.type === "SentenceInit") {

        return " it is "+metaAQ["s:"+node.meta.sign+" t:"+node.meta.tail]+" that "+stringify(node.fact)+' ';
    }



    if (node.type === "QuestionInit") {

        return " is it "+metaAQ["s:"+node.meta.sign+" t:"+node.meta.tail]+" that "+stringify(node.fact)+' ';
    }



    if (node.type === "Superlative") {

        if (node.direction === "most") {
            if (superlative[node.adjective]) return " the "+superlative[node.adjective]+' '+stringify(node.target)+' ';
            return " the most "+node.adjective+' '+stringify(node.target)+' ';
        }
        return " the least "+node.adjective+' '+stringify(node.target)+' ';
    }



    if (node.type === "Complement") {

        var link = node.link === "direct" ? '' : node.link;
        return ' '+link+' '+stringify(node.item)+' ';
    }



    if (node.type === "Rule") {

        result = " if "+stringify(node.condition)+" then "+stringify(node.thenPart)+' ';
        if (node.elsePart) result += " else "+stringify(node.elsePart)+' ';

        return result;
    }



    if (node.type === "AuxQuestion") {

        isQuestion = true;
        
        result = ' '+stringify(node.auxi)+' ';
        if (Array.isArray(node.adverb)) result += node.adverb.map(stringify).join(' ');
        result += ' '+stringify(node.content)+' ';

        return result;
    }



    if (node.type === "WHQuestion") {

        isQuestion = true;

        if (node.existing) return ' '+node.question+' '+stringify(node.existing)+' ';
        if (node.sentence) return ' '+node.question+' '+stringify(node.sentence)+' ';

        result = ' '+node.question+' '+stringify(node.topic)+' '+stringify(node.auxi)+' ';
        if (node.subject) result += stringify(node.subject)+' ';
        if (node.auxr) result += stringify(node.auxr)+' ';
        if (node.verb && node.auxi !== node.verb) result += stringify(node.verb)+' ';
        if (Array.isArray(node.complement)) result += node.complement.map(stringify).join(' ');
        if (node.complementLink) result += stringify(node.complementLink)+' ';

        return result;
    }



    if (node.type === "Adjective") {

        return ' '+node.adjective.map(stringify).join(' ')+' '+stringify(node.target)+' ';
    }







    if (typeof node === "string") return node;
    return JSON.stringify(node);
}



function comparativeToShort(txt) {

    for (var c in comparativeLongToShort)
        txt = txt.replace(new RegExp(c, "g"), comparativeLongToShort[c]);

    return txt;
}



function comparativeToLong(txt) {

    for (var c in comparativeShortToLong)
        txt = txt.replace(new RegExp(c, "g"), comparativeShortToLong[c]);

    return txt;
}



module.exports = {

    stringify: function(tree) {

        var result = '';
        var sentence;

        for (var t=0; t<tree.length; t++) if (tree[t]) {

            isQuestion = false;

            sentence = tree[t];

            sentence = stringify(sentence).trim();
            sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

            if (isQuestion)
                result += sentence+'?\n';
            else
                result += sentence+'.\n';
        }

        result = comparativeToShort(result).replace(/ i /g, " I ").replace(/ +/g, ' ');
        return result.trim();
    },

    parse: function(txt) {
        
        return parser.parse('; '+comparativeToLong(txt.toLowerCase()));
    }

};


