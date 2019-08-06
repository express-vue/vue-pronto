// @ts-check
const fs = require("fs");
const path = require("path");
const requireFromString = require("require-from-string");
// @ts-ignore
const vueCompiler = require("vue-template-compiler");
// @ts-ignore
const vueify = require("vueify");
vueify.compiler.loadConfig();
const vueServerRenderer = require("vue-server-renderer");
const Vue = require("vue");
const uglify = require("uglify-js");
const LRU = require("lru-cache");
const processStyle = require("./process-style").processStyle;
const Utils = require("../utils");
// @ts-ignore
const find = require("find");
// @ts-ignore
const jsToString = require("js-to-string");

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
 * @prop {(VueOptionsType|Object)} head
 * @prop {Object} data
 * @prop {Object} babel
 */

class Renderer {
    /**
     * @param {(ConfigObjectType|Object)} [options={}] - options for constructor
     * @property {{max: number, maxAge: number}} cacheOptions - cacheoptions for LRU cache
     * @property {LRU} lruCache - LRU Cache
     * @property {vueServerRenderer} renderer - instance of vue server renderer
     * @property {String} rootPath
     * @property {String} nodeModulesPath
     * @property {String} vueVersion
     * @property {Object} babel
     */
    constructor(options = {}) {

        this.cacheOptions = options.cacheOptions || {
            max: 500,
            maxAge: 1000 * 60 * 60,
        };
        this.renderer = vueServerRenderer.createRenderer();
        this.lruCache = new LRU(this.cacheOptions);
        this.internalCache = new Utils.Cache();
        this.head = options.head || {};
        this.data = options.data || {};
        this.propsData = options.propsData || {};
        this.template = options.template || {};
        const version = Utils.vueVersion(options.vueVersion);
        if (version.enabled) {
            if (this.head.scripts) {
                this.head.scripts.push(version.script);
            } else {
                this.head.scripts = [version.script];
            }
        }
        this.rootPath = Utils.findRootPath(options.rootPath);
        this.babel = options.babel;
        if (options.babel) {
            vueify.compiler.applyConfig({ babel: options.babel});
        }
        if (!process.env.VUE_DEV) {
            // find all the vue files and try to precompile them and store them in cache
            find.file(/\.vue$/, this.rootPath,
                /** @param {array} files */
                files => {
                    //Make Bundle for each component and store it in cache
                    for (let filePath of files) {
                        this.MakeVueClass(filePath, {})
                            .then(() => {
                                const debug = `Precached -> ${filePath}`;
                                if (!process.env.TEST) {
                                    console.info(debug);
                                }
                            })
                            .catch(error => {
                                console.error(`Error Precaching \nfilePath -> ${filePath}\n-------\n${error}`);
                            });
                    }
                });
        }

        this.nodeModulesPath = Utils.findNodeModules(this.rootPath);
        this.jsToStringOptions = {
            functions: [
                {
                    name: "data",
                    /**
                     * @param {function} script
                     * @return {string|void}
                     */
                    toString: function(script) {
                        const func = `module.exports = function data() { return ${jsToString(script())}; };`;
                        const required = requireFromString(func);
                        return String(required);
                    },
                },
            ],
        };

    }
    /**
     * @param {Object} oldData
     * @param {Object} newData
     * @returns {Function}
     */
    FixData(oldData, newData) {
        const mergedData = Object.assign({}, oldData, this.data, newData);
        return function data() {
            return mergedData;
        };
    }
    /**
     * @param {Object} oldPropsData
     * @param {Object} newPropsData
     * @returns {Function}
     */
    FixPropsData(oldPropsData, newPropsData) {
        return Object.assign({}, oldPropsData, this.propsData, newPropsData);
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
                const parsedDirectory = filePath.includes("node_modules") ? filePath : path.parse(filePath).dir;
                const relativePath = path.resolve(parsedDirectory, componentFile);
                this.Compile(relativePath)
                    .then(compiled => {
                        this.FindAndReplaceComponents(compiled, relativePath)
                            .then((compiledObject) => {
                                let reg;
                                const isES6 = compiledObject.compiled.includes("use strict");
                                if (isES6) {
                                    reg = /(?:"use strict";)(.*)(?:module.exports={|exports.default={)(.*)(?:}}\(\);?)(?:.*)(?:__vue__options__.render=function\(\){)(.*)(?:},?;?__vue__options__.staticRenderFns=\[)(.*)(?:\])((?:,?;?__vue__options__._scopeId=")(.*)(?:"))?/gm;
                                } else {
                                    reg = /(?!"use strict";)(.*)(?:module.exports={|exports.default={)(.*)(?:}\(?\)?;?)(?:.*)(?:__vue__options__.render=function\(\){)(.*)(?:},?;?__vue__options__.staticRenderFns=\[)(.*)(?:\])((?:,?;?__vue__options__._scopeId=")(.*)(?:"))?/gm;
                                }

                                let vueComponent = "";
                                let imports = "";
                                let moduleExports = "";
                                let renderFunctionContents = "";
                                let staticRenderFns = "";
                                let scopeId = "";

                                let { code } = uglify.minify(compiledObject.compiled, { mangle: false });

                                const matches = reg.exec(code);
                                if (matches && matches.length > 0) {
                                    const importMatch = matches[1];
                                    const exportMatch = matches[2];
                                    const renderMatch = matches[3];
                                    const staticMatch = matches[4];
                                    const scopeMatch = matches[6];

                                    if (importMatch && importMatch !== "") {
                                        imports = importMatch;
                                    }

                                    if (exportMatch && exportMatch !== "") {
                                        moduleExports = exportMatch;
                                    }

                                    if (renderMatch && renderMatch !== "") {
                                        renderFunctionContents = `,render: function render() {${renderMatch}}`;
                                    }

                                    if (staticMatch && staticMatch !== "") {
                                        staticRenderFns = `,staticRenderFns: [${staticMatch}]`;
                                    }

                                    if (scopeMatch && scopeMatch !== "") {
                                        scopeId = `,_scopeId: "${scopeMatch}"`;
                                    }

                                }

                                if (imports === "") {
                                    vueComponent = `{${moduleExports}${renderFunctionContents}${staticRenderFns}${scopeId}}`;
                                } else {
                                    vueComponent = `function(){${imports}return {${moduleExports}${renderFunctionContents}${staticRenderFns}${scopeId}}}()`;
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
            /** @type {Promise[]} */
            let promiseArray = [];
            const vueFileRegex = /([\w/.\-@_\d]*\.vue)/igm;
            const requireModuleRegex = /(require\(['"])([^./][\w][\w:/.\-@_\d]*\.vue?[^\.js])(['"][\)])/igm;
            const requireRegex = /(require\(['"])([.?][\w:/.\-@_\d]*\.vue?[^\.js])(['"][\)])/igm;
            let vueComponentMatches = compiledObject.compiled.match(requireRegex);
            let vueComponentsModuleMatches = compiledObject.compiled.match(requireModuleRegex);
            if (vueComponentMatches && vueComponentMatches.length > 0) {
                for (let index = 0; index < vueComponentMatches.length; index++) {
                    const vueComponentMatch = vueComponentMatches[index];
                    const vueComponentFileNameMatch = vueComponentMatch.match(vueFileRegex);
                    if (vueComponentFileNameMatch && vueComponentFileNameMatch.length > 0) {
                        promiseArray.push(this.BuildComponent(vueComponentFileNameMatch[0], filePath, vueComponentMatch));
                    }
                }
            }
            if (vueComponentsModuleMatches && vueComponentsModuleMatches.length > 0) {
                for (let index = 0; index < vueComponentsModuleMatches.length; index++) {
                    let vueComponentModuleMatch = vueComponentsModuleMatches[index];
                    const vueComponentFileNameMatch = vueComponentModuleMatch.match(vueFileRegex);
                    if (vueComponentFileNameMatch && vueComponentFileNameMatch.length > 0) {
                        promiseArray.push(this.BuildComponent(vueComponentFileNameMatch[0], this.nodeModulesPath, vueComponentModuleMatch));
                    }
                }
            }
            /**
             * @param {Promise[]} promises
             * @param {(String[]|null)} componentArray
             * @param {(String[]|null)} modulesArray
             * @returns {Boolean}
             */
            function isFinished(promises, componentArray, modulesArray) {
                let components = 0;
                let modules = 0;
                if (componentArray) {
                    components = componentArray.length;
                }
                if (modulesArray) {
                    modules = modulesArray.length;
                }
                if (promises.length > 0 && (promises.length === (modules + components))) {
                    return true;
                } else {
                    return false;
                }
            }
            const finished = isFinished(promiseArray, vueComponentMatches, vueComponentsModuleMatches);
            if (finished && promiseArray.length > 0) {
                Promise.all(promiseArray)
                    .then(renderedItemArray => {
                        for (var index = 0; index < renderedItemArray.length; index++) {
                            var renderedItem = renderedItemArray[index];
                            compiledObject.compiled = compiledObject.compiled.replace(renderedItem.match, renderedItem.compiled);
                            compiledObject.style += renderedItem.style;
                        }
                        //check if its the last element and then render
                        const lastElement = compiledObject.compiled.match(requireRegex);
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
        while (scriptFileMatches && scriptFileMatches.length > 0) { // this loop used to be an if
            const match = scriptFileMatches[2];
            const resolvedPath = path.resolve(path.parse(filePath).dir, match).replace(/\\/g, "/");
            if (resolvedPath) {
                stringFile = stringFile.replace(match, resolvedPath);
            }
            scriptFileMatches = requireRegex.exec(stringFile); // this is to update the matches
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
                let compiled = {
                    compiled: "",
                    style: "",
                    filePath: filePath,
                };

                const stylesArray = vueCompiler.parseComponent(content, { pad: true }).styles;

                if (vm.babel) {
                    vueify.compiler.applyConfig({ babel: vm.babel});
                }
                const compiler = vueify.compiler;
                compiler.compile(content, filePath,
                    /**
                     * @param {Object} error
                     * @param {string} stringFile
                     */
                    function(error, stringFile) {
                        if (error) {
                            reject(error);
                        }
                        stringFile = vm.FindAndReplaceScripts(stringFile, filePath);
                        let id = "";
                        stringFile.replace(/__vue__options__\._scopeId = "(.*?)"/gm,
                            /**
                             * @param {string} match
                             * @param {string} p1
                             * @return {string}
                             */
                            function(match, p1) {
                                id = p1;
                                return "";
                            });
                        if (stylesArray.length > 0) {
                            processStyle(stylesArray[0], filePath, id)
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
     * @returns {Promise<{data: object, propsData: object, props: object}>}
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
     * @param {Object} data
     * @param {{data: Object, propsData: Object} | Object} vueOptions
     * @returns {Promise<{vue: object, css: string, script: string}>}
     */
    MakeVueClass(filePath, data, vueOptions = {}) {
        return new Promise((resolve, reject) => {
            let cachedBundle = this.internalCache.get(filePath);
            if (cachedBundle) {
                const cachedData = Object.assign({}, cachedBundle.data());
                const newbundle = Object.assign({}, cachedBundle.bundle);

                if (cachedBundle.bundle.data && typeof cachedBundle.bundle.data === "function") {
                    newbundle.data = this.FixData(cachedData, data);
                }
                if (vueOptions.propsData && (cachedBundle.bundle.propsData || cachedBundle.bundle.props)) {
                    newbundle.propsData = this.FixPropsData(cachedBundle.bundle.propsData || {}, vueOptions.propsData);
                }

                // @ts-ignore
                const vue = new Vue(newbundle);
                // vue._data = newbundle.data();
                const cleanBundle = this._deleteCtor(newbundle);
                const object = {
                    vue: vue,
                    css: cachedBundle.style,
                    script: jsToString(cleanBundle, this.jsToStringOptions),
                };
                resolve(object);
            } else {
                //Make Bundle
                this.Compile(filePath)
                    .then(compiled => {
                        this.MakeBundle(compiled, filePath)
                            .then(bundle => {
                                this.internalCache.set(filePath, { bundle: bundle, style: compiled.style, data: bundle.data });
                                //Insert Data
                                if (bundle.data && typeof bundle.data === "function") {
                                    bundle.data = this.FixData(bundle.data(), data);
                                }
                                //Insert propsData
                                if (vueOptions.propsData && (bundle.propsData || bundle.props)) {
                                    bundle.propsData = this.FixPropsData(bundle.propsData || {}, vueOptions.propsData);
                                }

                                //Create Vue Class
                                // @ts-ignore
                                const vue = new Vue(bundle);
                                const cleanBundle = this._deleteCtor(bundle);
                                const object = {
                                    vue: vue,
                                    css: compiled.style,
                                    script: jsToString(cleanBundle, this.jsToStringOptions),
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
     * @param {Object} script
     * @returns {Object}
     */
    _deleteCtor(script) {
        for (let component in script.components) {
            delete script.components[component]._Ctor;
            if (script.components[component].components) {
                script.components[component] = this._deleteCtor(script.components[component]);
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
            const cacheKey = vueFile + parentRoute;
            const cached = this.lruCache.get(cacheKey);
            if (cached) {
                resolve(cached);
            } else {
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
                        this.lruCache.set(cacheKey, pathToTest);
                        resolve(pathToTest);
                    }
                });
            }
        });
    }
    /**
     * renderToString returns a string from res.renderVue to the client
     * @param {string} vueFile    - full path to vue component
     * @param {Object} data       - data to be inserted when generating vue class
     * @param {Object} vueOptions - vue options to be used when generating head
     * @returns {Promise<string>}
     */
    RenderToString(vueFile, data, vueOptions) {
        return new Promise((resolve, reject) => {
            this.FindFile(vueFile)
                .then(filePath => {
                    this.MakeVueClass(filePath, data, vueOptions)
                        .then(vueClass => {
                            const mergedHeadObject = Utils.mergeHead(vueOptions.head, this.head);
                            const template = Object.assign({}, this.template, vueOptions.template);
                            //Init Renderer
                            const context = {
                                head: Utils.buildHead(mergedHeadObject),
                                template: template,
                                css: vueClass.css,
                                script: vueClass.script,
                            };
                            const layout = Utils.buildLayout(context);
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
     * @param  {Object} data                                 - data to be inserted when generating vue class
     * @param  {(VueOptionsType|object)} vueOptions          - vue options to be used when generating head
     * @return {Promise<NodeJS.ReadableStream>}
     */
    RenderToStream(vueFile, data, vueOptions) {
        return new Promise((resolve, reject) => {
            this.FindFile(vueFile)
                .then(filePath => {
                    this.MakeVueClass(filePath, data, vueOptions)
                        .then(vueClass => {
                            const mergedHeadObject = Utils.mergeHead(vueOptions.head, this.head);
                            const headString = Utils.buildHead(mergedHeadObject);
                            const template = Object.assign({}, this.template, vueOptions.template);
                            //Init Renderer
                            const context = {
                                head: headString,
                                template: template,
                                css: vueClass.css,
                                script: vueClass.script,
                            };
                            const vueStream = this.renderer.renderToStream(vueClass.vue);
                            let htmlStream;
                            const layout = Utils.buildLayout(context);

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
