var esprima = require('esprima-the-party');
var fs = require('fs');
var ast = require('./ast');
var path = require('path');
var escodegen = require('escodegen');
function parseScripts(sourcePaths, withLocs) {
    var asts = {};
    sourcePaths.forEach(function (sourcePath) {
        var contents = fs.readFileSync(sourcePath).toString();
        asts[sourcePath] = esprima.parse(contents, { loc: withLocs });
    });
    return asts;
}
function mkpath(dir) {
    var mk = '';
    dir.split(path.sep).forEach(function (component) {
        mk = path.join(mk, component);
        if (!fs.existsSync(mk) || !fs.statSync(mk).isDirectory()) {
            if (fs.mkdirSync(mk)) {
                console.error('Could not make path component:', mk);
                process.exit(1);
            }
        }
    });
}
function outputAsts(asts, dir, sourceMaps) {
    Object.keys(asts).forEach(function (sourcePath) {
        var destPath = path.join(dir, sourcePath);
        mkpath(path.dirname(destPath));
        var output, ast = asts[sourcePath];
        if (sourceMaps) {
            var tmp = escodegen.generate(ast, {
                    sourceMapWithCode: true,
                    sourceMap: sourcePath
                });
            output = tmp.code;
            fs.writeFileSync(destPath + '.map', tmp.map);
        } else {
            output = escodegen.generate(ast);
        }
        fs.writeFileSync(destPath, output);
    });
}
exports.compile = function (scripts, opts) {
    var asts = parseScripts(scripts, opts.dumpLocs || !opts.dump);
    var compiled = ast.compile(asts);
    if (opts.dump) {
        console.log(JSON.stringify(opts.dumpSources ? asts : compiled, null, 2));
    }
    if (opts.output) {
        outputAsts(compiled, opts.output, opts.sourceMaps);
    } else if (!opts.dump) {
    }
};