var path = require('path');
var fs = require("fs");

var Page = function() {

    var api = {
        infoPass: false, // true if the page is creating during the info pass
        root: '', // file system roote path
        rootTechy: '',  // file system roote path of the Techy
        info: {
            pages: []
        },
        paths: {
            root: '', // the path to the main route
            self: '', // the path of the current file to main route
            file: '', // the name of the markdown file
        }
    };
    api.set = function(key, value) {
        this[key] = value;
        return this;
    };
    api.get = function(key) {
        return this[key];
    };
    api.registerMethods = function() {
        var techyFiles = this.get('techyFiles');
        for(var i=0; i<techyFiles.length; i++) {
            var f = require(techyFiles[i]);
            var name = path.basename(techyFiles[i]).replace('.techy.js', '');
            this[name] = f;
        }
        return this;
    };
    // infoPass is true when Techy goes through the pages to fill the `info` property
    api.parser = function(content, infoPass) {

        api.registerMethods();

        var re = /<%( )?([^%>]*)%>/g, str = content;
        while(match = re.exec(content)) {
            var code = match[0], src = match[0], result = '', allowedMethods = /(set|get)\(('|")/g;
            code = code.replace('<p>', '').replace('</p>', '').replace('@techy', 'techy').replace(/<% ?/g, '').replace(/ ?%>/g, '');
            code = 'with(techy) { return ' + code + '; }';
            if(infoPass && code.indexOf(allowedMethods) >= 0) {
                // console.log('skipped', code);
                // skipping the code execution if the method is not allowed during the info pass phase
            } else {
                try {
                    var codeResult = (new Function('techy', code)).apply(this, [this]);
                    result = typeof codeResult === 'string' || typeof codeResult === 'number' ? codeResult : '';
                } catch(e) {
                    if(!infoPass) {
                        console.log('\n\n', e, '\nCode: ', code, '\n\n');
                    }
                    result = src;
                }
            }
            str = str.replace('<p>' + src + '</p>', result || '').replace(src, result || '');
        }
        // console.log('\n\n', page.build(str));
        this.set('content', str);
        return this;
    }

    return api;
}

module.exports = Page;