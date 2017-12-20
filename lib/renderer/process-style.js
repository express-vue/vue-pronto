// @ts-check
const fs = require("fs");
// const rewriteStyle = require("vueify/lib/style-rewriter");
const compilers = require("vueify/lib/compilers");
const path = require("path");
const chalk = require("chalk");


/**
 * 
 * @param {object} part 
 * @param {string} filePath 
 * @param {string} id 
 * @param {*} parts 
 * @returns {Promise}
 */
function processStyle (part, filePath, id, parts) {
    var style = getContent(part, filePath);
    return compileAsPromise("style", style, part.lang, filePath)
        .then(function (res) {
            parts.styles.push(res);
        // return rewriteStyle(id, res, part.scoped, options).then(function (res) {
        //   parts.styles.push(res)
        // })
        });
}
  
/**
 * 
 * @param {*} part 
 * @param {*} filePath 
 * @returns {*}
 */
function getContent (part, filePath) {
    return part.src
        ? loadSrc(part.src, filePath)
        : part.content;
}
  
/**
 * 
 * @param {*} src 
 * @param {*} filePath 
 * @returns {string}
 */
function loadSrc (src, filePath) {
    var dir = path.dirname(filePath);
    var srcPath = path.resolve(dir, src);
    try {
        return fs.readFileSync(srcPath, "utf-8");
    } catch (e) {
        //@ts-ignore
        console.error(chalk.red(
            "Failed to load src: \"" + src +
        "\" from file: \"" + filePath + "\""
        ));
    }
}
 
/**
 * 
 * @param {*} type 
 * @param {*} source 
 * @param {*} lang 
 * @param {*} filePath 
 * @returns {object}
 */
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
                resolve(res.trim());
            }, compile, filePath);
        });
    } else {
        return Promise.resolve(source);
    }
}

module.exports.processStyle = processStyle;