// @ts-check
const fs = require("fs");
const path = require("path");
const requireFromString = require("require-from-string");
const vueServerRenderer = require("vue-server-renderer");
const Vue = require("vue");
const LRU = require("lru-cache");
const Layout = require("../models/layout").Layout;
const Utils = require("../utils");
// @ts-ignore
const find = require("find");
// @ts-ignore
const jsToString = require("js-to-string");

const {VueLoaderPlugin} = require("vue-loader");
const Webpack = require("webpack");
const MFS = require("memory-fs");

/**
 * @typedef CompiledObjectType
 * @prop {String} compiled
 * @prop {Object} webpackConfig
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
     * @prop {MFS} MFS
     * @prop {Object} webpackConfig
     */
    constructor(options = {}) {

        this.cacheOptions = options.cacheOptions || {
            max: 500,
            maxAge: 1000 * 60 * 60,
        };
        this.lruCache = LRU(this.cacheOptions);
        this.internalCache = new Utils.Cache();
        this.head = options.head || {};
        this.data = options.data || {};
        this.template = options.template || {};
        const version = Utils.VueVersion(options.vueVersion);
        if (version.enabled) {
            if (this.head.scripts) {
                this.head.scripts.push(version.script);
            } else {
                this.head.scripts = [version.script];
            }
        }
        this.rootPath = Utils.FindRootPath(options.rootPath);
        this.mfs = new MFS();
        this.mfs.mkdirpSync(this.rootPath);
        const baseoutput =  {
                path: path.resolve(this.rootPath, "../public"),
                publicPath: "/",
                filename: "client/[name].js",
                chunkFilename: "client/[name].js",
        };
        this.webpackConfig = {
            entry: {
                index: ["vuepronto/server-entry.js"],
            },
            output: Object.assign({}, baseoutput, {
                filename: "vuepronto/[name].js",
                libraryTarget: "commonjs2",
            }),
            module: {
                rules: [
                    {
                        test: /\.vue$/,
                        loader: "vue-loader",
                    },
                ],
            },
            plugins: [
              new VueLoaderPlugin(),
            ],
        };

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

        this.nodeModulesPath = Utils.FindNodeModules(this.rootPath);
        this.jsToStringOptions = {
            functions: [
                {
                    name: "data",
                    // @ts-ignore
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
     *
     * @param {string} filePath
     * @returns {Promise<CompiledObjectType>}
     */
    Compile(filePath) {
        return new Promise((resolve, reject) => {
            const webpackImport = `import Vue from 'vue'
            import App from '${filePath}'

            export function createApp () {
                const app = new Vue({
                    render: h => h(App)
                })
                return { app }
            }`;
            const pathh = path.resolve(this.rootPath, "../public");
            const serverEntryPath = path.join(pathh, "server-entry.js");
            this.mfs.mkdirpSync(pathh);
            this.mfs.writeFileSync(serverEntryPath, webpackImport, "utf-8");
            this.webpackConfig.entry.index = [serverEntryPath];
            const compiled = {
                compiled: webpackImport,
                webpackConfig: this.webpackConfig,
                style: "",
                filePath: filePath,
            };
            resolve(compiled);
        });
    }
    /**
     *
     * @param {CompiledObjectType} compiled
     * @param {string} filePath
     * @returns {Promise<{bundle: object, compiled: string}>}
     */
    MakeBundle(compiled, filePath) {
        return new Promise((resolve, reject) => {
            const webpackCompiler = Webpack(compiled.webpackConfig);
            webpackCompiler.outputFileSystem = this.mfs;
            const fileOutput = compiled.webpackConfig.output;
            /**
             * @param {object} serverConfig
             * @param {string} projectName
             */
            function getFileName(serverConfig, projectName) {
                return serverConfig.output.filename.replace("[name]", projectName);
            }
            const outputPath = path.join(fileOutput.path, getFileName(compiled.webpackConfig, "projectName"));
            webpackCompiler.watch({}, (error, stats) => {
                if (error) { reject(error); }
                // @ts-ignore
                stats.compilation.errors.forEach(reject);
                // @ts-ignore
                stats.compilation.warnings.forEach(reject);
                try {
                    const bundle = this.mfs.readFileSync(outputPath, "utf-8");
                    // const bundle = vm.mfs.readFileSync(path.join(fileOutput.path, fileOutput.filename), "utf-8");
                    resolve({
                        bundle: bundle,
                        compiled: compiled.compiled,
                    });
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
    /**
     *
     * @param {string} filePath
     * @param {Object} data
     * @returns {Promise<{vue: object, css: string, script: string, compiled: string}>}
     */
    MakeVueClass(filePath, data) {
        return new Promise((resolve, reject) => {
            let cachedBundle = this.internalCache.get(filePath);
            if (cachedBundle) {
                if (cachedBundle.bundle.bundle.data && typeof cachedBundle.bundle.bundle.data === "function") {
                    cachedBundle.bundle.bundle.data = this.FixData(cachedBundle.bundle.bundle.data(), data);
                }
                // @ts-ignore
                const vue = new Vue(cachedBundle.bundle.bundle);
                const cleanBundle = this._deleteCtor(cachedBundle.bundle.bundle);
                const object = {
                    vue: vue,
                    css: cachedBundle.style,
                    script: jsToString(cleanBundle, this.jsToStringOptions),
                    compiled: cachedBundle.compiled,
                };
                resolve(object);
            } else {
                //Make Bundle
                this.Compile(filePath)
                    .then(compiled => {
                        this.MakeBundle(compiled, filePath)
                            .then(bundle => {
                                const createBundleRenderer = require("vue-server-renderer").createBundleRenderer;
                                const thing = createBundleRenderer(bundle.bundle);
                                this.internalCache.set(filePath, {bundle: bundle, style: compiled.style});
                                //Insert Data
                                if (bundle.bundle.data && typeof bundle.bundle.data === "function") {
                                    bundle.bundle.data = this.FixData(bundle.bundle.data(), data);
                                }

                                //Create Vue Class
                                // @ts-ignore
                                const vue = new Vue(bundle.bundle);
                                const cleanBundle = this._deleteCtor(bundle.bundle);
                                const object = {
                                    vue: vue,
                                    css: compiled.style,
                                    script: jsToString(cleanBundle, this.jsToStringOptions),
                                    compiled: bundle.compiled,
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
                    this.MakeVueClass(filePath, data)
                        .then(vueClass => {
                            const rendererOptions = {
                                cache: this.lruCache,
                            };
                            this.renderer = vueServerRenderer.createRenderer(rendererOptions);
                            const mergedHeadObject = Utils.MergeHead(vueOptions.head, this.head);
                            const template = Object.assign({}, this.template, vueOptions.template);
                            //Init Renderer
                            const context = {
                                head: Utils.BuildHead(mergedHeadObject),
                                template: template,
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
     * @param  {Object} data                                 - data to be inserted when generating vue class
     * @param  {VueOptionsType} vueOptions - vue options to be used when generating head
     * @return {Promise<NodeJS.ReadableStream>}
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
