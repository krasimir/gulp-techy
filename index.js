var through2 = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var path = require('path');
var File = gutil.File;
var Page = require('./lib/Page');
var yamlFront = require('yaml-front-matter');
var glob = require('glob');
var fs = require('fs');

var techyFiles;

var extend = function() {
    var process = function(destination, source) {   
        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                destination[key] = source[key];
            }
        }
        return destination;
    };
    var result = arguments[0];
    for(var i=1; i<arguments.length; i++) {
        result = process(result, arguments[i]);
    }
    return result;
}

var getPagePaths = function(file) {
    var p = path.dirname(path.normalize(file).replace(path.normalize(options.root), '')),
        numOfSlashes = 0,
        root = '';
    if(p == '\\') { numOfSlashes = 0; }
    else {
        var m = p.match(/\\/g);
        var numOfSlashes = m ? m.length : 0;
    }
    for(var i=0; i<numOfSlashes; i++) {
        root += '../';
    }
    var res = {
        root: root,
        self: p.replace(/\\/g, '/').substr(1),
        file: path.basename(file)
    };
    return res;
}

var applyYamlConfig = function(page, config) {
    if(page && config) {
        for(var prop in config) {
            if(prop != '__content') {
                page.set(prop, config[prop]);
            }
        }
    }
}

var getInfo = function(options) {
    var info = { pages: [] };
    var process = function(infoFiles) {
        var processedFiles = [];
        for(var i=0; i<infoFiles.length; i++) {
            if(path.normalize(infoFiles[i].toString()).replace(/\\/g, '/').indexOf('/node_modules/') == -1) {
                processedFiles.push(infoFiles[i]);
                var yamlConfig = yamlFront.loadFront(fs.readFileSync(infoFiles[i]).toString('utf8'));
                var content = yamlConfig.__content;
                var page = extend(Page(), {});
                page.set('root', options.root);
                page.set('paths', getPagePaths(infoFiles[i]));
                page.set('infoPass', true);
                page.set('techyFiles', techyFiles);
                applyYamlConfig(page, yamlConfig);
                page.parser(content, true);
                info.pages.push(page);
            } else {
                // console.log('Skipped: ' + infoFiles[i]);
            }
        }
        return processedFiles;
    }
    process(glob.sync(options.src))
    return info;
}

module.exports = function (o) {

    if(!o.src) {
        this.emit('error', new PluginError('gulp-techy', 'Missing src property'));
        return;
    }

    options = o || {};

    options.root = options.root || process.cwd();
    techyFiles = [].concat(glob.sync(__dirname + '/lib/api/**/*.techy.js')).concat(glob.sync(options.root + '/**/*.techy.js'));
    options.src = options.src || options.root + '/**/*.*';
    options.info = getInfo(options);


    function transform (file, enc, next) {
        var self = this;

        if (file.isNull()) {
            this.push(file); // pass along
            return next();
        }

        if (file.isStream()) {
            this.emit('error', new PluginError('gulp-techy', 'Streaming not supported'));
            return next();
        }

        var page = extend(Page(), options);
        page.set('techyFiles', techyFiles);
        page.set('paths', getPagePaths(file.path));

        var yamlConfig = yamlFront.loadFront(fs.readFileSync(file.path).toString('utf8'));
        applyYamlConfig(page, yamlConfig);
        var content = page.parser(yamlConfig.__content).get('content');

        file.contents = new Buffer(content);
        // file.path = gutil.replaceExtension(file.path, targetExt);
        self.push(file);
        
        next();

    }

    return through2.obj(transform);
};