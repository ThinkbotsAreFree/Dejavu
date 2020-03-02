// from https://stackoverflow.com/questions/29902347/open-a-file-with-default-program-in-node-webkit
// from https://thisdavej.com/how-to-watch-for-files-changes-in-node-js/



/*
 *  This is meant to be an text interface in VS Code
 *  Content changes are shown instantly because VS Code hot-reload files
 *  On server-side, we can watch file to use it as input
 * 
 */



function getCommandLine() {
    switch (process.platform) { 
        case 'darwin' : return 'open';
        case 'win32' : return 'start';
        case 'win64' : return 'start';
        default : return 'xdg-open';
    }
}



const exec = require('child_process').exec;
const fs = require('fs');



module.exports = {



    watch: function(filepath, callback) {

        let fsWait = false;
        fs.watch(filepath, (event, filename) => {
            if (filename) {
                if (fsWait) return;
                fsWait = setTimeout(() => {
                    fsWait = false;
                }, 100);
                callback(event, filename);
            }
        });
    },



    launch: function(filepath) { exec(getCommandLine() + ' ' + filepath); }
};


