// @ts-check
const fs = require("fs");
const path = require("path");
const requireFromString = require("require-from-string");
const {createBundleRenderer} = require("vue-server-renderer");
const Vue = require("vue");
const LRU = require("lru-cache");
const Layout = require("../models/layout").Layout;
const Utils = require("../utils");
// @ts-ignore
const find = require("find");
// @ts-ignore
const jsToString = require("js-to-string");
const mkdirp = require("mkdirp");

const {
    VueLoaderPlugin,
} = require("vue-loader");
const {
    BabelLoaderPlugin,
    // @ts-ignore
    } = require("babel-loader");
const webpack = require("webpack");
const MFS = require("memory-fs");

/**
 * @typedef CompiledObjectType
 * @prop {String} server
 * @prop {String} client
 * @prop {String} filePath
 */

/**
 * @typedef WebpackConfigType
 * @prop {string} server
 * @prop {string} client
 * @prop {Object} config
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
        this.head = options.head || {
            scripts: [],
        };
        this.data = options.data || {};
        this.template = options.template || {};
        // const version = Utils.VueVersion(options.vueVersion);
        // if (version.enabled) {
        //     if (this.head.scripts) {
        //         this.head.scripts.push(version.script);
        //     } else {
        //         this.head.scripts = [version.script];
        //     }
        // }
        this.rootPath = Utils.FindRootPath(options.rootPath);
        this.nodeModulesPath = Utils.FindNodeModules(this.rootPath);
        this.trueRootPath = path.join(this.nodeModulesPath, "../");
        this.mfs = new MFS();
        this.mfs.mkdirpSync(this.trueRootPath);
        // this.mfs
        this.webpackServerConfig = {
            entry: "./src/entry-client.js",
            mode: "production",
            target: "node",
            output: {
                filename: "server.js",
                libraryTarget: "commonjs2",
            },
            module: {
                rules: [{
                        test: /\.vue$/,
                        loader: "vue-loader",
                    },
                    {
                        test: /\.js$/,
                        loader: "babel-loader",
                    },
                    {
                        test: /\.css$/,
                        use: [
                            "vue-style-loader",
                            "css-loader",
                        ],
                    },
                ],
            },
            plugins: [
                new VueLoaderPlugin(),
            ],
        };
        this.webpackClientConfig = {
            entry: "./src/entry-client.js",
            output: {
                filename: "client.js",
            },
            mode: "production",
            module: {
                rules: [{
                        test: /\.vue$/,
                        loader: "vue-loader",
                    },
                    {
                        test: /\.js$/,
                        loader: "babel-loader",
                    },
                    {
                        test: /\.css$/,
                        use: [
                            "vue-style-loader",
                            "css-loader",
                        ],
                    },
                ],
            },
            plugins: [
                new VueLoaderPlugin(),
            ],
        };

        if (!process.env.VUE_DEV) {
            // find all the vue files and try to precompile them and store them in cache
        find.file(
                /\.vue$/,
                this.rootPath,
                /** @param {array} files */
                files => {
                    //Make Bundle for each component and store it in cache
                    for (let filePath of files) {
                        this.MakeVueClass(filePath, {}, filePath.replace(this.trueRootPath, ""))
                            .then(() => {
                                const debug = `Precached -> ${filePath}`;
                                if (!process.env.TEST) {
                                    console.info(debug);
                                }
                            })
                            .catch(error => {
                                console.error(
                                    `Error Precaching \nfilePath -> ${filePath}\n-------\n${error}`,
                                );
                            });
                    }
                },
            );
        }
    }
    /**
     * @param {string} filePath
     * @param {string} vueFile
     * @returns {Promise<WebpackConfigType>}
     */
    BuildConfig(filePath, vueFile) {
        return new Promise((resolve, reject) => {
            const parsedBundlePath = path.parse(filePath);
            const app = `import Vue from "vue";
            import App from "${filePath}";

            export function createApp (data) {
                const app = new Vue({
                    data,
                    render: h => h(App)
                })
                return { app }
            }`;

            const server = `import { createApp } from "./app"
            export default context => {
                return new Promise((resolve, reject) => {
                    const { app } = createApp(context);

                    resolve(app);
                });
            };`;

            const client = `import { createApp } from "./app"
            const store = window.__INITIAL_STATE__;
            const { app } = createApp(store ? store : {});
            app.$mount("#app")`;

            const parsedFilePath = filePath.replace(this.trueRootPath, "").replace(".vue", "");
            const configFolder = path.join(this.trueRootPath, ".expressvue", parsedFilePath);
            try {
                fs.statSync(configFolder).isDirectory();
            } catch (error) {
                mkdirp.sync(configFolder);
            }

            const appPath = path.join(configFolder, "app.js");
            const serverPath = path.join(configFolder, "entry-server.js");
            const clientPath = path.join(configFolder, "entry-client.js");

            fs.writeFileSync(appPath, app, "utf-8");
            fs.writeFileSync(serverPath, server, "utf-8");
            fs.writeFileSync(clientPath, client, "utf-8");

            const entryPaths = {
                server: serverPath,
                client: clientPath,
            };
            const webpackServerConfig = Object.assign({}, this.webpackServerConfig);
            const webpackClientConfig = Object.assign({}, this.webpackClientConfig);

            webpackServerConfig.entry = entryPaths.server;
            webpackServerConfig.output.path = parsedBundlePath.dir;
            webpackServerConfig.output.filename = `${parsedBundlePath.base}.server.js`;

            webpackClientConfig.entry = entryPaths.client;
            webpackClientConfig.output.path = "/expressvue/bundles";
            webpackClientConfig.output.filename = `${parsedBundlePath.base}.client.js`;

            resolve({
                server: entryPaths.server,
                client: entryPaths.client,
                config: [webpackServerConfig, webpackClientConfig],
            });
        });
    }
    /**
     *
     * @param {WebpackConfigType} config
     * @param {string} filePath
     * @returns {Promise<{client: string, server: string, clientBundlePath: string}>}
     */
    MakeBundle(config, filePath) {
        return new Promise((resolve, reject) => {
            const parsedBundlePath = path.parse(filePath);
            const bundlePath = parsedBundlePath.dir;
            const clientBundleFile = path.join("/expressvue/bundles", `${parsedBundlePath.base}.client.js`);
            const serverBundleFile = path.join(bundlePath, `${parsedBundlePath.base}.server.js`);
            this.mfs.mkdirpSync(bundlePath);
            try {
                const serverBundle = this.mfs.readFileSync(serverBundleFile, "utf-8");
                const clientBundle = this.mfs.readFileSync(clientBundleFile, "utf-8");
                resolve({
                    server: serverBundle,
                    client: clientBundle,
                    clientBundlePath: clientBundleFile,
                });
            } catch (error) {

                const compiler = webpack(config.config);
                compiler.outputFileSystem = this.mfs;
                compiler.run((err, stats) => {
                    if (err) {
                        reject(err);
                    }
                    // @ts-ignore
                    stats.stats.forEach(stat => {
                        if (stat.hasErrors()) {
                            reject(stat.compilation.errors);
                        }
                    });
                    try {
                        const serverBundle = this.mfs.readFileSync(serverBundleFile, "utf-8");
                        const clientBundle = this.mfs.readFileSync(serverBundleFile, "utf-8");
                        if (!serverBundle || !clientBundle) {
                            reject(new Error("Couldn't load bundle"));
                        }
                        resolve({
                            server: serverBundle,
                            client: clientBundle,
                            clientBundlePath: clientBundleFile,
                        });
                    } catch (error) {
                        reject(error);
                    }
                });
            }

        });
    }
    /**
     *
     * @param {string} filePath
     * @param {Object} data
     * @param {string} vueFile
     * @returns {Promise<{renderer: {renderToStream: Function, renderToString: Function}, client: string, clientBundlePath: string}>}
     */
    MakeVueClass(filePath, data, vueFile) {
        return new Promise((resolve, reject) => {
            //Make Bundle
            this.BuildConfig(filePath, vueFile)
                .then(config => {
                    this.MakeBundle(config, filePath)
                        .then(bundle => {
                            const rendererOptions = {
                                runInNewContext: false,
                            };
                            const renderer = createBundleRenderer(
                                bundle.server,
                                rendererOptions,
                            );
                            const object = {
                                renderer: renderer,
                                client: bundle.client,
                                clientBundlePath: bundle.clientBundlePath,
                                // css: compiled.style,
                                // script: jsToString(
                                //     cleanBundle,
                                //     this.jsToStringOptions,
                                // ),
                                // compiled: bundle.compiled,
                            };
                            resolve(object);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
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
                fs.stat(pathToTest, error => {
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
                    this.MakeVueClass(filePath, data, vueFile)
                        .then(vueClass => {
                            const mergedHeadObject = Utils.MergeHead(
                                vueOptions.head,
                                this.head,
                            );
                            const template = Object.assign({},
                                this.template,
                                vueOptions.template,
                            );
                            //Init Renderer
                            const context = {
                                head: Utils.BuildHead(mergedHeadObject, data),
                                template: template,
                                script: vueClass.clientBundlePath,
                            };
                            const layout = Utils.BuildLayoutWebpack(context);
                            vueClass.renderer.renderToString(data)
                                .then(/** @param {string} html */ html => {
                                    const htmlString = `${layout.start}${html}${
                                        layout.end
                                    }`;
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
                    this.MakeVueClass(filePath, data, vueFile)
                        .then(vueClass => {
                            const mergedHeadObject = Utils.MergeHead(
                                vueOptions.head,
                                this.head,
                            );
                            const headString = Utils.BuildHead(
                                mergedHeadObject,
                                data,
                            );
                            const template = Object.assign({},
                                this.template,
                                vueOptions.template,
                            );
                            //Init Renderer
                            const context = {
                                head: headString,
                                template: template,
                                script: vueClass.clientBundlePath,
                            };
                            const vueStream = vueClass.renderer.renderToStream(data);
                            let htmlStream;
                            const layout = Utils.BuildLayoutWebpack(context);

                            htmlStream = new Utils.StreamUtils(
                                layout.start,
                                layout.end,
                            );
                            htmlStream = vueStream.pipe(htmlStream);

                            resolve(htmlStream);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
    /**
     * @param {string} bundleFileName
     * @returns {Promise<string>} bundle
     */
    async getBundleFile(bundleFileName) {
        try {
            const clientBundle = this.mfs.readFileSync(bundleFileName, "utf-8");
            return clientBundle;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Renderer;
