// @flow
const fs = require("fs");
// const rewriteStyle = require("vueify/lib/style-rewriter");
const compilers = require("vueify/lib/compilers");
const path = require("path");
const chalk = require("chalk");


function processStyle (part, filePath, id, parts) {
    var style = getContent(part, filePath);
    return compileAsPromise("style", style, part.lang, filePath)
        .then(function (res) {
            res = res.trim();
            parts.styles.push(res);
        // return rewriteStyle(id, res, part.scoped, options).then(function (res) {
        //   parts.styles.push(res)
        // })
        });
}
  
function getContent (part, filePath) {
    return part.src
        ? loadSrc(part.src, filePath)
        : part.content;
}
  
function loadSrc (src, filePath) {
    var dir = path.dirname(filePath);
    var srcPath = path.resolve(dir, src);
    try {
        return fs.readFileSync(srcPath, "utf-8");
    } catch (e) {
        console.error(chalk.red(
            "Failed to load src: \"" + src +
        "\" from file: \"" + filePath + "\""
        ));
    }
}
  
function compileAsPromise (type, source, lang, filePath) {
    var compile = compilers[lang];
    if (compile) {
        return new Promise(function (resolve, reject) {
            compile(source, function (err, res) {
                if (err) {
                    // report babel error codeframe
                    if (err.codeFrame) {
                        process.nextTick(function () {
                            console.error(err.codeFrame);
                        });
                    }
                    return reject(err);
                }
                resolve(res);
            }, compile, filePath);
        });
    } else {
        return Promise.resolve(source);
    }
}

module.exports.processStyle = processStyle;