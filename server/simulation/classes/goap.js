path = require('path');
fs = require('fs');

function Goap() {
    this.actions = [];
}

Goap.prototype.loadActions = function (dir) {
    let thisGoap = this;
    return new Promise((resolve, reject) => {
        let pathList = walkSync(dir);
        // console.log(JSON.stringify(pathList));
        for (i in pathList) {
            let path = pathList[i];
            console.log(`path: ${path}`);
            let json = fs.readFileSync(path);
            try {
                let data = JSON.parse(json);
                if (data.goap){
                    for (i in data.goap){
                        let action = data.goap[i];
                        thisGoap.actions.push(action);
                        console.log(`action: ${JSON.stringify(action.name)}`);
                    }
                }
            }catch(err){
                console.error(`could not read from: ${path}, err: ${err}`);
            }
        }
        resolve();
    });

}

Goap.prototype.findAction = function (actionName) {
    for (i in this.actions) {
        let action = this.actions[i];
        if (action.name === actionName){
            return action;
        }
    }
}

// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function (dir, filelist) {
    var path = path || require('path');
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        }
        else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
};
module.exports = Goap;