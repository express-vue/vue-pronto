// @ts-check
const fs = require("fs");
const path = require("path");
const requireFromString = require("require-from-string");
// @ts-ignore
const vueCompiler = require("vue-template-compiler");
// @ts-ignore
const vueify = require("vueify");
const vueServerRenderer = require("vue-server-renderer");
const Vue = require("vue");
const uglify = require("uglify-js");
const LRU = require("lru-cache");
const processStyle = require("./process-style").processStyle;
const Stream = require("stream");
const Layout = require("../models/layout").Layout;
const Utils = require("../utils");

/**
 * @typedef CompiledObjectType
 * @prop {String} compiled
 * @prop {String} style
 * @prop {String} filePath
 */

/**
 * @typedef VueOptionsType
 * @prop {String} title
 * @prop {Object} head
 * @prop {Object[]} head.scripts
 * @prop {Object[]} head.metas
 * @prop {Object[]} head.styles
 * @prop {Layout} template
 */

/**
 * @typedef ConfigObjectType
 * @prop {{max: number, maxAge: number}} cacheOptions - cacheoptions for LRU cache
 * @prop {String} rootPath
 * @prop {String} vueVersion
 * @prop {VueOptionsType} head
 * @prop {Object} data
 */

class Renderer {
    /**
     * @param {ConfigObjectType} options - options for constructor
     * @property {{max: number, maxAge: number}} cacheOptions - cacheoptions for LRU cache
     * @property {LRU} lruCache - LRU Cache
     * @property {vueServerRenderer} renderer - instance of vue server renderer
     * @property {String} rootPath
     * @property {String} vueVersion
     */
    constructor(options) {
        this.cacheOptions = options.cacheOptions || {
            max: 500,
            maxAge: 1000 * 60 * 60,
        };
        this.lruCache = LRU(this.cacheOptions);
        this.rootPath = options.rootPath;
        this.head = options.head || {};
        this.data = options.data || {};
        this.vueVersion = options.vueVersion || "2.5.13";
        let script = {};
        if (process.env.VUE_DEV && process.env.VUE_DEV === "true") {
            script = {src: `https://cdn.jsdelivr.net/npm/vue@${this.vueVersion}/dist/vue.js`};
        } else {
            script = {src: `https://cdn.jsdelivr.net/npm/vue@${this.vueVersion}/dist/vue.min.js`};
        }
        if (this.head.scripts) {
            this.head.scripts.push(script);
        } else {
            this.head.scripts = [script];
        }
    }
    /**
     * @param {object} oldData
     * @param {object} newData
     * @returns {object}
     */
    FixData(oldData, newData) {
        const mergedData = Object.assign({}, oldData, newData, this.data);
        return function() {
            return mergedData;
        };
    }
    /**
     * @param {string} componentFile
     * @param {string} filePath
     * @param {string} vueComponentMatch
     * @returns {Promise<{compiled: string, filePath: string, match: string, style: string}>}
     */
    BuildComponent(componentFile, filePath, vueComponentMatch) {
        return new Promise((resolve, reject) => {
            const cachedComponent = this.lruCache.get(vueComponentMatch);
            if (cachedComponent) {
                resolve(cachedComponent);
            } else {
                const relativePath = path.resolve(path.parse(filePath).dir, componentFile);
                this.Compile(relativePath)
                    .then(compiled => {
                        this.FindAndReplaceComponents(compiled, relativePath)
                            .then((compiledObject) => {
                                const reg = /(?:"use strict";)(.*)(?:module.exports={|exports.default={)(.*)(?:}}\(\);?)(?:.*)(?:__vue__options__.render=function\(\){)(.*)(?:},?;?__vue__options__.staticRenderFns=\[)(.*)(?:\])/gm;

                                let vueComponent = "";
                                let imports = "";
                                let moduleExports = "";
                                let renderFunctionContents = "";
                                let staticRenderFns = "";

                                let {code} = uglify.minify(compiledObject.compiled, {mangle: false});

                                const matches = reg.exec(code);
                                if (matches && matches.length > 0) {
                                    const importMatch = matches[1];
                                    const exportMatch = matches[2];
                                    const renderMatch = matches[3];
                                    const staticMatch = matches[4];

                                    if (importMatch !== "") {
                                        imports = importMatch;
                                    }

                                    if (exportMatch !== "") {
                                        moduleExports = exportMatch;
                                    }

                                    if (renderMatch !== "") {
                                        renderFunctionContents = `,render: function render() {${renderMatch}}`;
                                    }

                                    staticRenderFns = `,staticRenderFns: [${staticMatch}]`;
                                }

                                if (imports === "") {
                                    vueComponent = `{${moduleExports}${renderFunctionContents}${staticRenderFns}}`;
                                } else {
                                    vueComponent = `function(){${imports}return {${moduleExports}${renderFunctionContents}${staticRenderFns}}}()`;
                                }
                                if (vueComponent.includes("Object.defineProperty(exports,\"__esModule\",{value:!0}),return")) {
                                    vueComponent = vueComponent.replace("Object.defineProperty(exports,\"__esModule\",{value:!0}),return", "Object.defineProperty(exports,\"__esModule\",{value:!0});return");
                                }
                                const objectToReturn = {
                                    compiled: vueComponent,
                                    filePath: relativePath,
                                    match: vueComponentMatch,
                                    style: compiledObject.style,
                                };

                                this.lruCache.set(cachedComponent, objectToReturn);
                                resolve(objectToReturn);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    })
                    .catch(reject);
            }
        });
    }
    /**
     *
     * @param {CompiledObjectType} compiledObject
     * @param {string} filePath
     * @returns {Promise<CompiledObjectType>}
     */
    FindAndReplaceComponents(compiledObject, filePath) {
        return new Promise((resolve, reject) => {
            const vueFileRegex = /([\w/.\-@_\d]*\.vue)/igm;
            const requireRegex = /(require\(['"])([\w:/.\-@_\d]*\.vue)(['"]\))/igm;
            let vueComponentMatches = compiledObject.compiled.match(requireRegex);
            if (vueComponentMatches && vueComponentMatches.length > 0) {
                let promiseArray = [];
                for (let index = 0; index < vueComponentMatches.length; index++) {
                    const vueComponentMatch = vueComponentMatches[index];
                    const vueComponentFile = vueComponentMatch.match(vueFileRegex);
                    if (vueComponentFile && vueComponentFile.length > 0) {
                        promiseArray.push(this.BuildComponent(vueComponentFile[0], filePath, vueComponentMatch));
                    }
                }
                Promise.all(promiseArray)
                    .then(renderedItemArray => {
                        for (var index = 0; index < renderedItemArray.length; index++) {
                            var renderedItem = renderedItemArray[index];
                            compiledObject.compiled = compiledObject.compiled.replace(renderedItem.match, renderedItem.compiled);
                            compiledObject.style += renderedItem.style;
                        }
                        //check if its the last element and then render
                        const lastElement = compiledObject.compiled.match(vueFileRegex);
                        if (lastElement === undefined || lastElement === null) {
                            resolve(compiledObject);
                        }
                    })
                    .catch(reject);
            } else {
                resolve(compiledObject);
            }
        });
    }
    /**
     *
     * @param {String} stringFile
     * @param {String} filePath
     * @returns {String}
     */
    FindAndReplaceScripts(stringFile, filePath) {
        const requireRegex = /(require\(['"])([.?][\w:/.\-@_\d]*(?:\.js)?[^\.vue])(['"][\)])/igm;
        let scriptFileMatches = requireRegex.exec(stringFile);
        if (scriptFileMatches && scriptFileMatches.length > 0) {
            const match = scriptFileMatches[2];
            const resolvedPath = path.resolve(path.parse(filePath).dir, match);
            if (resolvedPath) {
                stringFile = stringFile.replace(match, resolvedPath);
            }
        }
        return stringFile;
    }
    /**
     *
     * @param {string} filePath
     * @returns {Promise<CompiledObjectType>}
     */
    Compile(filePath) {
        return new Promise((resolve, reject) => {
            const vm = this;
            fs.readFile(filePath, function(err, fileContent) {
                if (err) {
                    reject(err);
                }
                const content = String(fileContent);
                let resolvedParts = {
                    styles: [],
                };
                let compiled = {
                    compiled: "",
                    style: "",
                    filePath: filePath,
                };

                const stylesArray = vueCompiler.parseComponent(content, {pad: true}).styles;
                // @ts-ignore
                const compiler = vueify.compiler;
                compiler.compile(content, filePath,
                    /**
                     * @param {object} error
                     * @param {string} stringFile
                     */
                    function(error, stringFile) {
                    if (error) {
                        reject(error);
                    }
                    stringFile = vm.FindAndReplaceScripts(stringFile, filePath);
                    if (stylesArray.length > 0) {
                        processStyle(stylesArray[0], filePath, "", resolvedParts)
                            .then(processedStyle => {
                                compiled.compiled = stringFile;
                                compiled.style += processedStyle;
                                resolve(compiled);
                            })
                            .catch(reject);
                    } else {
                        compiled.compiled = stringFile;
                        resolve(compiled);
                    }
                });
            });
        });
    }
    /**
     *
     * @param {CompiledObjectType} compiledObject
     * @param {string} filePath
     * @returns {Promise<{data: object}>}
     */
    MakeBundle(compiledObject, filePath) {
        return new Promise((resolve, reject) => {
            this.FindAndReplaceComponents(compiledObject, filePath)
                .then(compiled => {
                    const bundle = requireFromString(compiled.compiled, filePath);
                    resolve(bundle);
                })
                .catch(reject);
        });
    }
    /**
     *
     * @param {string} filePath
     * @param {object} data
     * @returns {Promise<{vue: object, css: string, script: string}>}
     */
    MakeVueClass(filePath, data) {
        return new Promise((resolve, reject) => {
            const cachedBundle = this.lruCache.get(filePath);
            if (cachedBundle) {
                cachedBundle.bundle.data = this.FixData(cachedBundle.bundle.data(), data);
                // @ts-ignore
                const vue = new Vue(cachedBundle.bundle);
                const cleanBundle = this._deleteCtor(cachedBundle.bundle);
                const object = {
                    vue: vue,
                    css: cachedBundle.style,
                    script: Utils.ScriptToString(cleanBundle),
                };
                resolve(object);
            } else {
                //Make Bundle
                this.Compile(filePath)
                    .then(compiled => {
                        this.MakeBundle(compiled, filePath)
                            .then(bundle => {
                                this.lruCache.set(filePath, {bundle: bundle, style: compiled.style});
                                //Insert Data
                                bundle.data = this.FixData(bundle.data(), data);
                                //Create Vue Class
                                // @ts-ignore
                                const vue = new Vue(bundle);
                                const cleanBundle = this._deleteCtor(bundle);
                                const object = {
                                    vue: vue,
                                    css: compiled.style,
                                    script: Utils.ScriptToString(cleanBundle),
                                };
                                resolve(object);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            }
        });
    }
    /**
     *
     * @param {object} script
     * @returns {object}
     */
    _deleteCtor(script) {
        for (let component in script.components) {
            if (script.components.hasOwnProperty(component)) {
                delete script.components[component]._Ctor;
                if (script.components[component].components) {
                    script.components[component] = this._deleteCtor(script.components[component]);
                }
            }

        }
        return script;
    }
    /**
     *
     * @param {String} vueFile
     * @param {String} [parentRoute=""]
     * @returns {Promise<String>}
     */
    FindFile(vueFile, parentRoute = "") {
        return new Promise((resolve, reject) => {
            let pathToTest = "";
            if (this.rootPath === undefined) {
                pathToTest = vueFile;
            } else {
                pathToTest = path.join(this.rootPath, vueFile);
            }
            fs.stat(pathToTest, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(pathToTest);
                }
            });
        });
    }
    /**
     * renderToString returns a string from res.renderVue to the client
     * @param {string} vueFile    - full path to vue component
     * @param {object} data       - data to be inserted when generating vue class
     * @param {object} vueOptions - vue options to be used when generating head
     * @returns {Promise<string>}
     */
    RenderToString(vueFile, data, vueOptions) {
        return new Promise((resolve, reject) => {
            this.FindFile(vueFile)
                .then(filePath => {
                    this.MakeVueClass(filePath, data)
                        .then(vueClass => {
                            const rendererOptions = {
                                cache: this.lruCache,
                            };
                            this.renderer = vueServerRenderer.createRenderer(rendererOptions);
                            const mergedHeadObject = Utils.MergeHead(vueOptions.head, this.head);
                            //Init Renderer
                            const context = {
                                head: Utils.BuildHead(mergedHeadObject),
                                template: vueOptions.template,
                                css: vueClass.css,
                                script: vueClass.script,
                            };
                            const layout = Utils.BuildLayout(context);
                            this.renderer.renderToString(vueClass.vue)
                                .then(html => {
                                    const htmlString = `${layout.start}${html}${layout.end}`;
                                    resolve(htmlString);
                                })
                                .catch(reject);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
    /**
     * renderToStream returns a stream from res.renderVue to the client
     * @param  {string} vueFile                              - full path to .vue component
     * @param  {object} data                                 - data to be inserted when generating vue class
     * @param  {VueOptionsType} vueOptions - vue options to be used when generating head
     * @return {Promise<Stream>}
     */
    RenderToStream(vueFile, data, vueOptions) {
        return new Promise((resolve, reject) => {
            this.FindFile(vueFile)
                .then(filePath => {
                    this.MakeVueClass(filePath, data)
                        .then(vueClass => {
                            const rendererOptions = {
                                cache: this.lruCache,
                            };
                            this.renderer = vueServerRenderer.createRenderer(rendererOptions);
                            const mergedHeadObject = Utils.MergeHead(vueOptions.head, this.head);
                            const headString = Utils.BuildHead(mergedHeadObject);
                            //Init Renderer
                            const context = {
                                head: headString,
                                template: vueOptions.template,
                                css: vueClass.css,
                                script: vueClass.script,
                            };
                            const vueStream = this.renderer.renderToStream(vueClass.vue);
                            let htmlStream;
                            const layout = Utils.BuildLayout(context);

                            htmlStream = new Utils.StreamUtils(layout.start, layout.end);
                            htmlStream = vueStream.pipe(htmlStream);

                            resolve(htmlStream);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
}

module.exports = Renderer;
