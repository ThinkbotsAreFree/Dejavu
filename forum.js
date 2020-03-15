


var forum = {
    category: {},   // top-topics
    message:  {},   // messages content
    notifier: {},   // inbox
};



module.exports = function(sys) {



    function newCategory(category) {

        forum.category[category] = [];
    }



    function delCategory(category) {

        delete forum.category[category];
    }



    function newTopic(user, category, msg) {

        var id = sys.newId('M');

        forum.message[id] = {
            id: id,
            user: user,
            category: category,
            message: sys.dce.parse(msg),
            about: null,
            replies: []
        };
        forum.category[category].push(id);
        if (!notifier[user]) notifier[user] = [];
    }



    function newReply(user, target, msg) {

        var id = sys.newId('M');
        
        forum.message[id] = {
            id: id,
            user: user,
            category: forum.message[target].category,
            message: sys.dce.parse(msg),
            about: target
        };
        forum.message[target].replies.push(id);

        // notify all posters of parent messages
        var notifyList = [];
        var pointer = target;
        while (pointer) {
            if (!notifyList.includes(forum.message[pointer].user))
                notifyList.push(forum.message[pointer].user);

            pointer = forum.message[pointer].about;
        }
        notifyList.forEach(p => forum.notifier[p].push(id));
    }



    function getNotifications(user) {

        return notifier[user].map(m => forum.message[m]);
    }



    function clearNotifications(user) {

        notifier[user] = [];
    }



    function load(content) {

        forum = JSON.parse(content);
    }



    function save() {

        return JSON.stringify(forum);
    }



    return {

        load: load,
        save: save,
        newCategory: newCategory,
        delCategory: delCategory,
        newTopic: newTopic,
        newReply: newReply
    };
}


