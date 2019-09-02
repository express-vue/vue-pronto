const path = require("path");
const { createBundleRenderer } = require("vue-server-renderer");
const LRU = require("lru-cache");
const {
    StreamUtils,
    Cache,
    config,
    findRootPath,
    findNodeModules,
    buildLayoutWebpack,
    buildHead,
    mergeHead,
    promiseFS,
} = require("../utils");
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
 * @prop {import("../models/layout").Layout} template
 */

/**
 * @typedef BundleFileSubtype
 * @prop {string} path
 * @prop {string} filename
 */

/**
 * @typedef MemoryBundleFileType
 * @prop {string} base
 * @prop {string} path
 * @prop {{client:string, server:string}} filename
 */

/**
 * @typedef BundleFileType
 * @prop {string} base
 * @prop {MemoryBundleFileType} memory
 * @prop {BundleFileSubtype} server
 * @prop {BundleFileSubtype} client
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
 * @prop {string} expressVueFolder
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
        this.internalCache = new Cache();
        this.head = options.head || {
            scripts: [],
        };
        this.data = options.data || {};
        this.template = options.template || {};
        this.pagesPath = findRootPath(options.pagesPath);
        this.baseUrl = this.parseBaseURL(options.baseUrl);
        this.nodeModulesPath = findNodeModules(this.pagesPath);
        this.rootPath = path.join(this.nodeModulesPath, "../");
        this.mfs = new MFS();
        this.mfs.mkdirpSync(this.rootPath);
        const mode = (!process.env.VUE_DEV || (process.env.VUE_DEV && process.env.VUE_DEV === "false")) ? "production" : "development";
        this.mode = mode;
        const {server, client} = config.bootstrap(
            options.webpack ? options.webpack.client : {},
            options.webpack ? options.webpack.server : {},
            mode,
            );
        this.webpackServerConfig = server;
        this.webpackClientConfig = client;
        this.vue = options.vue ?
            {app: options.vue.app, server: options.vue.server, client: options.vue.client} :
            {app: undefined, server: undefined, client: undefined};
        this.expressVueFolder = path.join(this.rootPath, ".expressvue");
    }
    /**
     * @param {string} baseUrl
     * @returns {string}
     */
    parseBaseURL(baseUrl = "") {
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.slice(0, -1);
        }

        return baseUrl;
    }
    /**
     * @param {boolean} [forceBuild=false]
     * @returns {Promise<boolean>}
     */
    async Bootstrap(forceBuild = false) {
        const vm = this;
        await mkdirp.sync(vm.expressVueFolder);
        if (forceBuild) {
            await this.Build();
            return true;
        }
        // Check for prebuilt bundles and load them to memory
        let bundleFilePaths = find.fileSync(/bundle\.js$/, this.expressVueFolder);
        switch (this.mode.toUpperCase()) {
            case "PRODUCTION":
                if (!forceBuild && bundleFilePaths.length > 0) {
                    await this._loadBundleFilesToMemory(bundleFilePaths);
                    console.info("Loaded Prebuilt Bundles to memory");
                    return true;
                } else {
                    await this.Build();
                    bundleFilePaths = find.fileSync(/bundle\.js$/, this.expressVueFolder);
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
            await Promise.all(promiseArray);
            console.info("Webpack Compilation Finished\n--------");
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    /**
     * @param {object[]} filepaths
     * @returns {Promise<void>}
     */
    async _loadBundleFilesToMemory(filepaths) {
        const vm = this;
        for (var i = 0, len = filepaths.length; i < len; i++) {
            const filepath = filepaths[i];
            const bundlePath = this.getBundleFilePath(filepath);
            vm.mfs.mkdirpSync(bundlePath.memory.base);
            const file = await promiseFS.readFile(filepath);
            vm.mfs.writeFileSync(`${bundlePath.memory.path}.js`, file);
        }
        return;
    }
    /**
     * @param {string} filePath
     * @returns {BundleFileType}
     */
    getBundleFilePath(filePath) {
        const parsedFilePath = filePath.replace(this.rootPath, "").replace(".vue", "");
        const expressVueFolder = path.join(this.rootPath, ".expressvue");
        const configFolder = path.join(expressVueFolder, parsedFilePath);
        const serverFilename = "server.bundle.js";
        const clientFilename = "client.bundle.js";
        let memoryParsed;
        if (filePath.includes(".expressvue")) {
            memoryParsed = path.parse(filePath.replace(".expressvue/", "").split(this.pagesPath)[1]);
        } else {
            memoryParsed = path.parse(filePath.split(this.pagesPath)[1]);
        }
        const memoryBase = path.join(`/${this.baseUrl}/expressvue/bundles`, memoryParsed.dir);
        const memoryPath = path.join(memoryBase, memoryParsed.name);

        return {
            base: configFolder,
            memory: {
                base: memoryBase,
                path: memoryPath,
                filename: {
                    client: path.join(memoryPath, clientFilename),
                    server: path.join(memoryPath, serverFilename),
                },
            },
            server: {
                path: path.join(configFolder, serverFilename),
                filename: serverFilename,
            },
            client: {
                path: path.join(configFolder, clientFilename),
                filename: clientFilename,
            },
        };
    }
    /**
     * @param {string} filePath
     * @returns {Promise<WebpackConfigType>}
     */
    async _buildConfig(filePath) {
        const bundlePath = this.getBundleFilePath(filePath);
        const {app, server, client} = config.appConfig(filePath, this.vue);

        try {
            await promiseFS.statIsDirectory(bundlePath.base);
        } catch (error) {
            mkdirp.sync(bundlePath.base);
        }

        const appPath = path.join(bundlePath.base, "app.js");
        const serverPath = path.join(bundlePath.base, "entry-server.js");
        const clientPath = path.join(bundlePath.base, "entry-client.js");

        await Promise.all([
            promiseFS.writeFile(appPath, app),
            promiseFS.writeFile(serverPath, server),
            promiseFS.writeFile(clientPath, client),
        ]);

        const entryPaths = {
            server: serverPath,
            client: clientPath,
        };
        const webpackServerConfig = Object.assign({}, this.webpackServerConfig);
        const webpackClientConfig = Object.assign({}, this.webpackClientConfig);

        webpackServerConfig.entry = entryPaths.server;
        // @ts-ignore
        webpackServerConfig.output.path = bundlePath.base;
        // @ts-ignore
        webpackServerConfig.output.filename = bundlePath.server.filename;

        webpackClientConfig.entry = entryPaths.client;
        // @ts-ignore
        webpackClientConfig.output.path = bundlePath.base;
        // @ts-ignore
        webpackClientConfig.output.filename = bundlePath.client.filename;

        return {
            server: entryPaths.server,
            client: entryPaths.client,
            config: [webpackServerConfig, webpackClientConfig],
        };
    }
    /**
     *
     * @param {WebpackConfigType} webpackConfig
     * @param {string} filePath
     * @returns {Promise<{client: string, server: string, clientBundlePath: string}>}
     */
    async _makeBundle(webpackConfig, filePath) {
        const bundlePath = this.getBundleFilePath(filePath);
        //file was not found so make it
        await this._webPackCompile(webpackConfig.config, filePath);
        const bundleFilePaths = find.fileSync(/bundle\.js$/, this.expressVueFolder);
        await this._loadBundleFilesToMemory(bundleFilePaths);
        let serverBundle = this.mfs.readFileSync(bundlePath.memory.filename.server, "utf-8");
        let clientBundle = this.mfs.readFileSync(bundlePath.memory.filename.client, "utf-8");
        if (!serverBundle || !clientBundle) {
            throw new Error("Couldn't load bundle");
        }
        return {
            server: serverBundle,
            client: clientBundle,
            clientBundlePath: bundlePath.memory.filename.client,
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
     * @param {object} context
     * @returns {Promise<{renderer: {renderToStream: Function, renderToString: Function}, client: string, clientBundlePath: string}>}
     */
    async _makeVueClass(filePath, context) {
        //Check if the bundle exists if not make a new one
        try {
            const bundlePath = this.getBundleFilePath(filePath);
            context.script = bundlePath.memory.filename.client;
            const layout = buildLayoutWebpack(context);

            const clientBundle = this.mfs.readFileSync(bundlePath.memory.filename.client, "utf-8");
            const serverBundle = this.mfs.readFileSync(bundlePath.memory.filename.server, "utf-8");
            const rendererOptions = {
                runInNewContext: false,
                template: layout.toString(),
            };

            const renderer = createBundleRenderer(
                serverBundle,
                rendererOptions,
            );
            return {
                renderer: renderer,
                client: clientBundle,
                clientBundlePath: bundlePath.memory.filename.client,
            };
        } catch (error) {
            //Make Bundle
            const webpackConfig = await this._buildConfig(filePath);
            const bundle = await this._makeBundle(webpackConfig, filePath);
            context.script = bundle.clientBundlePath;
            const layout = buildLayoutWebpack(context);

            const rendererOptions = {
                runInNewContext: false,
                template: layout.toString(),
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
            await promiseFS.access(pathToTest);
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
        const mergedHeadObject = mergeHead(
            vueOptions.head,
            this.head,
        );
        const mergedData = Object.assign({}, this.data, data);

        const template = Object.assign({},
            this.template,
            vueOptions.template,
        );
        const context = {
            head: buildHead(mergedHeadObject, mergedData),
            template: template,
        };
        const vueClass = await this._makeVueClass(filePath, context);
        return await vueClass.renderer.renderToString(mergedData);
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
        const mergedHeadObject = mergeHead(
            vueOptions.head,
            this.head,
        );
        const mergedData = Object.assign({}, this.data, data);
        const headString = buildHead(
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
        };
        const vueClass = await this._makeVueClass(filePath, context);
        const vueStream = vueClass.renderer.renderToStream(mergedData);
        const htmlStream = new StreamUtils();
        return vueStream.pipe(htmlStream);
    }
    /**
     * @param {string} bundleFileName
     * @returns {string} bundle
     */
    getBundleFile(bundleFileName) {
        if (bundleFileName.endsWith("server.bundle.js")) {
            return "";
        } else {
            return this.mfs.readFileSync(bundleFileName, "utf-8");
        }
    }
}

module.exports = Renderer;
