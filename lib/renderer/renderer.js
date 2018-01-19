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

const Utils = require("../utils");

class Renderer {
    /**
     *
     * @param {object} options - options for constructor
     * @property {{max: number, maxAge: number}} cacheOptions - cacheoptions for LRU cache
     * @property {LRU} lruCache - LRU Cache
     * @property {vueServerRenderer} renderer - instance of vue server renderer
     * @property {String} - rootPath
     */
    constructor(options = {}) {
        this.cacheOptions = options.cacheOptions || {
            max: 500,
            maxAge: 1000 * 60 * 60,
        };
        this.lruCache = LRU(this.cacheOptions);
        this.rootPath = options.rootPath;
        this.head = options.head;
    }
    /**
     * @param {object} oldData
     * @param {object} newData
     * @returns {object}
     */
    FixData(oldData, newData) {
        const mergedData = Object.assign({}, oldData, newData);
        return function() {
            return mergedData;
        };
    }
    /**
     * @param {string} componentFile
     * @param {string} filePath
     * @param {string} vueComponentMatch
     * @returns {Promise<{compiled: string, filePath: string, match: string}>}
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
                        this.FindAndReplaceComponents(compiled.compiled, relativePath)
                            .then((codeString) => {
                                const reg = /(?:"use strict";)(.*)(?:module.exports={|exports.default={)(.*)(?:}}\(\);?)(?:.*)(?:__vue__options__.render=function\(\){)(.*)(?:},?;?__vue__options__.staticRenderFns=\[)(.*)(?:\])/gm;

                                let vueComponent = "";
                                let imports = "";
                                let moduleExports = "";
                                let renderFunctionContents = "";
                                let staticRenderFns = "";

                                let {code} = uglify.minify(codeString, {mangle: false});
                                if (code !== undefined && code.includes("Object.defineProperty(exports,\"__esModule\",{value:!0}),")) {
                                    code = code.replace("Object.defineProperty(exports,\"__esModule\",{value:!0}),", "Object.defineProperty(exports,\"__esModule\",{value:!0});");
                                }
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
                                    vueComponent = `function () {${imports}return {${moduleExports}${renderFunctionContents}${staticRenderFns}}}()`;
                                }
                                const objectToReturn = {
                                    compiled: vueComponent,
                                    filePath: filePath,
                                    match: vueComponentMatch,
                                };

                                this.lruCache.set(cachedComponent, objectToReturn);
                                resolve(objectToReturn);
                            }).catch(error => {
                                reject(error);
                            });
                    })
                    .catch(reject);
            }
        });
    }
    /**
     *
     * @param {string} code
     * @param {string} filePath
     * @returns {Promise}
     */
    FindAndReplaceComponents(code, filePath) {
        return new Promise((resolve, reject) => {
            const vueFileRegex = /([\w/.\-@_\d]*\.vue)/igm;
            const requireRegex = /(require\(['"])([\w:/.\-@_\d]*\.vue)(['"]\))/igm;
            let vueComponentMatches = code.match(requireRegex);
            if (vueComponentMatches && vueComponentMatches.length > 0) {
                let promiseArray = [];
                for (let index = 0; index < vueComponentMatches.length; index++) {
                    const vueComponentMatch = vueComponentMatches[index];
                    const vueComponentFile = vueComponentMatch.match(vueFileRegex);
                    if (vueComponentFile && vueComponentFile.length > 0) {
                        promiseArray.push(this.BuildComponent(vueComponentFile[0], filePath, vueComponentMatch));
                    }
                }
                Promise.all(promiseArray).then(renderedItemArray => {
                    for (var index = 0; index < renderedItemArray.length; index++) {
                        var renderedItem = renderedItemArray[index];
                        code = code.replace(renderedItem.match, renderedItem.compiled);
                    }
                    //check if its the last element and then render
                    const lastElement = code.match(vueFileRegex);
                    if (lastElement === undefined || lastElement === null) {
                        resolve(code);
                    }
                }).catch(reject);
            } else {
                resolve(code);
            }
        });
    }
    /**
     *
     * @param {string} filePath
     * @returns {Promise<{compiled: string, style: string}>}
     */
    Compile(filePath) {
        return new Promise((resolve, reject) => {
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
                    if (stylesArray.length > 0) {
                        processStyle(stylesArray[0], filePath, "", resolvedParts)
                            .then(processedStyle => {
                                compiled.compiled = stringFile;
                                compiled.style = processedStyle;

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
     * @param {string} stringFile
     * @param {string} filePath
     * @returns {Promise<{data: object}>}
     */
    MakeBundle(stringFile, filePath) {
        return new Promise((resolve, reject) => {
            this.FindAndReplaceComponents(stringFile, filePath)
                .then(code => {
                    const bundle = requireFromString(code, filePath);
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
                        this.MakeBundle(compiled.compiled, filePath)
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
     * @returns {Promise}
     */
    FindFile(vueFile) {
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
     * @param  {{head: Object, template: string}} vueOptions - vue options to be used when generating head
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
