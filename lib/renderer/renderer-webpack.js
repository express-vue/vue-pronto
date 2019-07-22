// @ts-check
const fs = require("fs");
const mz = require("mz/fs");
const path = require("path");
const { createBundleRenderer } = require("vue-server-renderer");
const LRU = require("lru-cache");
const Layout = require("../models/layout").Layout;
const Utils = require("../utils");
// @ts-ignore
const find = require("find");
const mkdirp = require("mkdirp");
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
 * @prop {String} pagesPath
 * @prop {String} vueVersion
 * @prop {(VueOptionsType|Object)} head
 * @prop {Object} data
 * @prop {{server: webpack.Configuration, client: webpack.Configuration}} webpack
 * @prop {Object} vue
 * @prop {string} bundlePath
 */

class Renderer {
    /**
     * @param {(ConfigObjectType|Object)} [options={}] - options for constructor
     * @property {{max: number, maxAge: number}} cacheOptions - cacheoptions for LRU cache
     * @property {LRU} lruCache - LRU Cache
     * @property {vueServerRenderer} renderer - instance of vue server renderer
     * @property {String} pagesPath
     * @property {String} nodeModulesPath
     * @property {String} vueVersion
     * @prop {MFS} MFS
     * @prop {Object} webpackServerConfig
     * @prop {Object} webpackClientConfig
     * @prop {string} mode
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
        this.pagesPath = Utils.FindRootPath(options.pagesPath);
        this.nodeModulesPath = Utils.FindNodeModules(this.pagesPath);
        this.rootPath = path.join(this.nodeModulesPath, "../");
        this.mfs = new MFS();
        this.mfs.mkdirpSync(this.rootPath);
        const mode = (!process.env.VUE_DEV || (process.env.VUE_DEV && process.env.VUE_DEV === "false")) ? "production" : "development";
        this.mode = mode;
        const config = Utils.Config.Bootstrap(
            options.webpack ? options.webpack.client : {},
            options.webpack ? options.webpack.server : {},
            mode,
            );
        this.webpackServerConfig = config.server;
        this.webpackClientConfig = config.client;
        this.vue = options.vue ?
            {app: options.vue.app, server: options.vue.server, client: options.vue.client} :
            {app: undefined, server: undefined, client: undefined};
        this.bundlePath = path.join(this.rootPath, ".expressvue", "bundles");
    }
    /**
     * @param {boolean} [forceBuild=false]
     * @returns {Promise<boolean>}
     */
    async Bootstrap(forceBuild = false) {
        const vm = this;
        await mkdirp.sync(vm.bundlePath);
        if (forceBuild) {
            await this.Build();
            return true;
        }
        switch (this.mode.toUpperCase()) {
            case "PRODUCTION":
                // Check for prebuilt bundles and load them to memory
                let bundleFilePaths = find.fileSync(/\.js$/, this.bundlePath);
                if (!forceBuild && bundleFilePaths.length > 0) {
                    await this._loadBundleFilesToMemory(bundleFilePaths);
                    console.info("Loaded Prebuilt Bundles to memory");
                    return true;
                } else {
                    await this.Build();
                    bundleFilePaths = find.fileSync(/\.js$/, this.bundlePath);
                    await this._loadBundleFilesToMemory(bundleFilePaths);
                    return true;
                }
            case "DEVELOPMENT":
                return false;
            default:
                return false;
        }
    }
    /**
     * @returns {Promise<boolean>}
     */
    async Build() {
        const vm = this;
        // find all the vue files and try to precompile them and store them in cache
        const filepaths = find.fileSync(/\.vue$/, vm.pagesPath);
        console.info("Starting Webpack Compilation\n--------");
        const promiseArray = [];
        for (let index = 0; index < filepaths.length; index++) {
            const filepath = filepaths[index];
            try {
                const builtConfig = await vm._buildConfig(filepath);
                promiseArray.push(vm._webPackCompile(builtConfig.config, filepath));
            } catch (error) {
                console.error(`Error Precacheing ${filepath} \n\n ${error}`);
                throw error;
            }
        }
        try {
            const stats = await Promise.all(promiseArray);
            console.info("Webpack Compilation Finished\n--------");
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    /**
     * @param {object[]} files
     */
    async _loadBundleFilesToMemory(files) {
        const vm = this;
        vm.mfs.mkdirpSync("/expressvue/bundles");
        files.forEach(file => {
            vm.mfs.writeFileSync(`/expressvue/bundles/${path.parse(file).base}`, fs.readFileSync(file));
        });
    }
    /**
     * @param {object} element
     * @param {string} filename
     * @returns {Promise<void>}
     */
    async _writeBundleFile(element, filename) {
        try {
            await mz.stat(this.bundlePath);
        } catch (e) {
            await mz.mkdir(this.bundlePath);
        } finally {
            const vm = this;
            return this.mfs.writeFile(`${this.bundlePath}/${filename}`, element.assets[filename]._value, function(err) {
                if (err) {
                    throw err;
                }
                return Promise.resolve(mz.writeFile(`${vm.bundlePath}/${filename}`, element.assets[filename]._value));
            });

        }
    }
    /**
     * @param {string} filePath
     * @returns {Promise<WebpackConfigType>}
     */
    async _buildConfig(filePath) {
        const parsedBundlePath = path.parse(filePath);
        const app = Utils.Config.AppConfig(filePath, this.vue.app);
        const server = Utils.Config.ServerConfig(this.vue.app);
        const client = Utils.Config.ClientConfig(this.vue.client);
        const parsedFilePath = filePath.replace(this.rootPath, "").replace(".vue", "");
        const expressVueFolder = path.join(this.rootPath, ".expressvue");
        const configFolder = path.join(expressVueFolder, parsedFilePath);

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
        webpackServerConfig.output.path = this.bundlePath;
        // @ts-ignore
        webpackServerConfig.output.filename = `${parsedBundlePath.base}.server.js`;

        webpackClientConfig.entry = entryPaths.client;
        // @ts-ignore
        webpackClientConfig.output.path = this.bundlePath;
        // @ts-ignore
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
        const bundlesDir = path.join("/expressvue", "bundles");
        const clientBundleFile = path.join(bundlesDir, `${parsedBundlePath.base}.client.js`);
        const serverBundleFile = path.join(bundlesDir, `${parsedBundlePath.base}.server.js`);
        const vm = this;
        //file was not found so make it
        await this._webPackCompile(config.config, filePath);
        const bundleFilePaths = find.fileSync(/\.js$/, this.bundlePath);
        await this._loadBundleFilesToMemory(bundleFilePaths);
        let serverBundle = vm.mfs.readFileSync(serverBundleFile, "utf-8");
        let clientBundle = vm.mfs.readFileSync(clientBundleFile, "utf-8");
        if (!serverBundle || !clientBundle) {
            throw new Error("Couldn't load bundle");
        }
        return {
            server: serverBundle,
            client: clientBundle,
            clientBundlePath: clientBundleFile,
        };
    }
    /**
     * @param {object} webpackConfig
     * @param {string} filepath
     * @returns {Promise<webpack.Stats>}
     */
    async _webPackCompile(webpackConfig, filepath) {
        const compiler = webpack(webpackConfig);
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
                            reject(stats.compilation.errors);
                        }
                    }
                    console.info(`Compiled ${filepath}`);
                    resolve(stats);
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
            const bundleDir = path.join("/expressvue", "bundles");
            const clientBundleFile = path.join(bundleDir, `${parsedBundlePath.base}.client.js`);
            const serverBundleFile = path.join(bundleDir, `${parsedBundlePath.base}.server.js`);
            const clientBundle = this.mfs.readFileSync(clientBundleFile, "utf-8");
            const serverBundle = this.mfs.readFileSync(serverBundleFile, "utf-8");
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
            if (this.pagesPath === undefined) {
                pathToTest = vueFile;
            } else {
                pathToTest = path.join(this.pagesPath, vueFile);
            }
            await Utils.PromiseFS.asyncAccess(pathToTest);
            this.lruCache.set(cacheKey, pathToTest);
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
        const mergedData = Object.assign({}, this.data, data);
        const template = Object.assign({},
            this.template,
            vueOptions.template,
        );
        //Init Renderer
        const context = {
            head: Utils.BuildHead(mergedHeadObject, mergedData),
            template: template,
            script: vueClass.clientBundlePath,
        };
        const layout = Utils.BuildLayoutWebpack(context);
        const html = await vueClass.renderer.renderToString(mergedData);
        return `${layout.start}${html}${layout.end}`;
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
        const mergedData = Object.assign({}, this.data, data);
        const headString = Utils.BuildHead(
            mergedHeadObject,
            mergedData,
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
        const vueStream = vueClass.renderer.renderToStream(mergedData);
        let htmlStream;
        const layout = Utils.BuildLayoutWebpack(context);

        htmlStream = new Utils.StreamUtils(
            layout.start,
            layout.end,
        );
        return vueStream.pipe(htmlStream);
    }
    /**
     * @param {string} bundleFileName
     * @returns {Promise<string>} bundle
     */
    getBundleFile(bundleFileName) {
        return this.mfs.readFileSync(bundleFileName, "utf-8");
    }
}

module.exports = Renderer;
