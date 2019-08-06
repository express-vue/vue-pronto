// @ts-check
const fs = require("fs");
const CleanCss = require("clean-css");
const autoprefixer = require("autoprefixer");
const cssMinify = new CleanCss();

//@ts-ignore
const compilers = require("vueify/lib/compilers");
// @ts-ignore
const rewriteStyle = require("vueify/lib/style-rewriter");
const path = require("path");
//@ts-ignore
const chalk = require("chalk");

/**
 *
 * @param {object} part
 * @param {string} filePath
 * @param {string} id
 * @returns {Promise<string>}
 */
function processStyle(part, filePath, id) {
    var style = getContent(part, filePath);
    return new Promise((resolve, reject) => {
        compileAsPromise("style", style, part.lang, filePath)
            .then(compiledStyle => {
                // @ts-ignore
                return rewriteStyle(id, compiledStyle, part.scoped, { postcss: [autoprefixer()] }).then(function(res) {
                    const minified = minifyStyles(res);
                    resolve(minified);
                });
            })
            .catch(reject);
    });
}

/**
 *
 * @param {string} style
 * @returns {string}
 */
function minifyStyles(style) {
    const minified = cssMinify.minify(style);
    return minified.styles;
}

/**
 *
 * @param {*} part
 * @param {*} filePath
 * @returns {*}
 */
function getContent(part, filePath) {
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
function loadSrc(src, filePath) {
    var dir = path.dirname(filePath);
    var srcPath = path.resolve(dir, src);
    try {
        return fs.readFileSync(srcPath, "utf-8");
    } catch (e) {
        //@ts-ignore
        console.error(chalk.red(`Failed to load src: ${src} from file: ${filePath}`));
        throw e;
    }
}

/**
 *
 * @param {*} type
 * @param {*} source
 * @param {*} lang
 * @param {*} filePath
 * @returns {Promise<object>}
 */
function compileAsPromise(type, source, lang, filePath) {
    var compile = compilers[lang];
    if (compile) {
        compile.options = compile.options || {};
        compile.emit = compile.emit || function() {
            return true;
        };
        return new Promise(function(resolve, reject) {
            /**
             * @param {Object} err
             * @param {Object} res
             */
            function compileFunction(err, res) {
                if (err) {
                    // report babel error codeframe
                    if (err.codeFrame) {
                        process.nextTick(function() {
                            console.error(err.codeFrame);
                        });
                    }
                    return reject(err);
                }

                resolve(res.trim());
            }
            compile(source, compileFunction, compile, filePath);
        });
    } else {
        return Promise.resolve(source);
    }
}

module.exports.processStyle = processStyle;
