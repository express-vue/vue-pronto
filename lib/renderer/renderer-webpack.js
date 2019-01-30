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
const WebpackConfig = require("webpack-chain");
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
        this.lruCache = new LRU(this.cacheOptions);
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
        const productionMode = process.env.VUE_DEV ? "development" : "production";
        this.webpackServerConfig = {
            entry: "./src/entry-server.js",
            mode: productionMode,
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
            resolve: {
                extensions: [
                    ".js",
                    ".vue",
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
            mode: productionMode,
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
            resolve: {
                extensions: [
                    ".js",
                    ".vue",
                ],
            },
            plugins: [
                new VueLoaderPlugin(),
            ],
        };
    }
    /**
     * @returns {Promise<boolean>}
     */
    async WebpackCompile() {
        if (!process.env.VUE_DEV) {
            const vm = this;
            // find all the vue files and try to precompile them and store them in cache
            const filepaths = find.fileSync(/\.vue$/, vm.rootPath);
            console.info("Starting Webpack Compilation\n--------");
            const promiseArray = [];
            for (let index = 0; index < filepaths.length; index++) {
                const filepath = filepaths[index];
                try {
                    const builtConfig = await vm._buildConfig(filepath);
                    const compiler = webpack(builtConfig.config);
                    compiler.outputFileSystem = vm.mfs;
                    promiseArray.push(vm._webPackCompile(builtConfig.config, vm.mfs, filepath));
                } catch (error) {
                    console.error(`Error Precacheing ${filepath} \n\n ${error}`);
                    throw error;
                }
            }
            try {
                await Promise.all(promiseArray);
                console.info("Webpack Compilation Finished\n--------");
                return true;
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
        return false;
    }
    /**
     * @param {string} filePath
     * @returns {Promise<WebpackConfigType>}
     */
    async _buildConfig(filePath) {
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

        await Promise.all([
            Utils.PromiseFS.asyncWrite(appPath, app),
            Utils.PromiseFS.asyncWrite(serverPath, server),
            Utils.PromiseFS.asyncWrite(clientPath, client),
        ]);

        const entryPaths = {
            server: serverPath,
            client: clientPath,
        };
        const webpackServerConfig = Object.assign({}, this.webpackServerConfig);
        const webpackClientConfig = Object.assign({}, this.webpackClientConfig);

        webpackServerConfig.entry = entryPaths.server;
        // @ts-ignore
        webpackServerConfig.output.path = parsedBundlePath.dir;
        webpackServerConfig.output.filename = `${parsedBundlePath.base}.server.js`;

        webpackClientConfig.entry = entryPaths.client;
        // @ts-ignore
        webpackClientConfig.output.path = "/expressvue/bundles";
        webpackClientConfig.output.filename = `${parsedBundlePath.base}.client.js`;

        return {
            server: entryPaths.server,
            client: entryPaths.client,
            config: [webpackServerConfig, webpackClientConfig],
        };
    }
    /**
     *
     * @param {WebpackConfigType} config
     * @param {string} filePath
     * @returns {Promise<{client: string, server: string, clientBundlePath: string}>}
     */
    async _makeBundle(config, filePath) {
        const parsedBundlePath = path.parse(filePath);
        const bundlePath = parsedBundlePath.dir;
        const clientBundleFile = path.join("/expressvue/bundles", `${parsedBundlePath.base}.client.js`);
        const serverBundleFile = path.join(bundlePath, `${parsedBundlePath.base}.server.js`);
        const vm = this;
        //file was not found so make it
        await this._webPackCompile(config.config, vm.mfs, filePath);
        try {
            const serverBundle = vm.mfs.readFileSync(serverBundleFile, "utf-8");
            const clientBundle = vm.mfs.readFileSync(clientBundleFile, "utf-8");
            if (!serverBundle || !clientBundle) {
                throw new Error("Couldn't load bundle");
            }
            return {
                server: serverBundle,
                client: clientBundle,
                clientBundlePath: clientBundleFile,
            };
        } catch (error) {
            throw error;
        }
    }
    /**
     * @param {object} webpackConfig
     * @param {object} outputFileSystem
     * @param {string} filepath
     * @returns {Promise<void>}
     */
    async _webPackCompile(webpackConfig, outputFileSystem, filepath) {
        const compiler = webpack(webpackConfig);
        compiler.outputFileSystem = outputFileSystem;
        return new Promise((resolve, reject) => {
            compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    if (stats) {
                        // @ts-ignore
                        if (stats.stats) {
                            // @ts-ignore
                            stats.stats.forEach(stat => {
                                if (stat.hasErrors()) {
                                    reject(stat.compilation.errors);
                                }
                            });
                        } else if (stats.hasErrors()) {
                            console.error(stats.compilation.errors);
                        }
                    }
                    console.info(`Cached ${filepath}`);
                    resolve();
                }
            });
        });
    }
    /**
     *
     * @param {string} filePath
     * @returns {Promise<{renderer: {renderToStream: Function, renderToString: Function}, client: string, clientBundlePath: string}>}
     */
    async _makeVueClass(filePath) {
        //Check if the bundle exists if not make a new one
        try {
            const parsedBundlePath = path.parse(filePath);
            const bundlePath = parsedBundlePath.dir;
            const clientBundleFile = path.join("/expressvue/bundles", `${parsedBundlePath.base}.client.js`);
            const serverBundleFile = path.join(bundlePath, `${parsedBundlePath.base}.server.js`);
            const serverBundle = this.mfs.readFileSync(serverBundleFile, "utf-8");
            const clientBundle = this.mfs.readFileSync(clientBundleFile, "utf-8");
            const rendererOptions = {
                runInNewContext: false,
            };
            const renderer = createBundleRenderer(
                serverBundle,
                rendererOptions,
            );
            return {
                renderer: renderer,
                client: clientBundle,
                clientBundlePath: clientBundleFile,
            };
        } catch (error) {
            //Make Bundle
            try {
                const config = await this._buildConfig(filePath);
                const bundle = await this._makeBundle(config, filePath);
                const rendererOptions = {
                    runInNewContext: false,
                };
                const renderer = createBundleRenderer(
                    bundle.server,
                    rendererOptions,
                );
                return {
                    renderer: renderer,
                    client: bundle.client,
                    clientBundlePath: bundle.clientBundlePath,
                };
            } catch (error) {
                throw error;
            }
        }
    }
    /**
     *
     * @param {String} vueFile
     * @param {String} [parentRoute=""]
     * @returns {Promise<String>}
     */
    async _findFile(vueFile, parentRoute = "") {
        const cacheKey = vueFile + parentRoute;
        const cached = this.lruCache.get(cacheKey);
        let pathToTest = "";
        if (cached) {
            return cached;
        } else {
            if (this.rootPath === undefined) {
                pathToTest = vueFile;
            } else {
                pathToTest = path.join(this.rootPath, vueFile);
            }
            try {
                await Utils.PromiseFS.asyncAccess(pathToTest);
                this.lruCache.set(cacheKey, pathToTest);
            } catch (error) {
                throw error;
            }
        }
        return pathToTest;
    }
    /**
     * renderToString returns a string from res.renderVue to the client
     * @param {string} vueFile    - full path to vue component
     * @param {Object} data       - data to be inserted when generating vue class
     * @param {Object} vueOptions - vue options to be used when generating head
     * @returns {Promise<string>}
     */
    async RenderToString(vueFile, data, vueOptions) {
        const filePath = await this._findFile(vueFile);
        const vueClass = await this._makeVueClass(filePath);
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
        const html = await vueClass.renderer.renderToString(data);
        const htmlString = `${layout.start}${html}${
            layout.end
        }`;
        return htmlString;
    }
    /**
     * renderToStream returns a stream from res.renderVue to the client
     * @param  {string} vueFile                              - full path to .vue component
     * @param  {Object} data                                 - data to be inserted when generating vue class
     * @param  {VueOptionsType} vueOptions - vue options to be used when generating head
     * @return {Promise<NodeJS.ReadableStream>}
     */
    async RenderToStream(vueFile, data, vueOptions) {
        const filePath = await this._findFile(vueFile);
        const vueClass = await this._makeVueClass(filePath);
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

        return htmlStream;
    }
    /**
     * @param {string} bundleFileName
     * @returns {Promise<string>} bundle
     */
    getBundleFile(bundleFileName) {
        const clientBundle = this.mfs.readFileSync(bundleFileName, "utf-8");
        return clientBundle;
    }
}

module.exports = Renderer;
