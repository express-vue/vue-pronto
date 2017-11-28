// @flow
"use strict";
const Models = require("./models");
const LRU = require("lru-cache");
const path = require("path");
const Utils = require("./utils");
const Renderer = require("./renderer");
const vueServerRenderer = require("vue-server-renderer").createRenderer();

const cacheOptions = {
    max: 500,
    maxAge: 1000 * 60 * 60
};
const lruCache = LRU(cacheOptions);


/**
 * ExpressVueRenderer Class is the main init Class
 * init with `new ExpressVueRenderer(options)`
 * returns the ExpressVueRenderer class
 * @class
 */
class ExpressVueRenderer {
    GlobalOptions: Models.Defaults;
    Cache: LRU;
    /**
     * ExpressVueRenderer constructor
     * @constructor
     * @param {Object} options - The options passed to init the class
     */
    constructor(options: Object) {
        this.GlobalOptions = new Models.Defaults(options);
        this.Cache = lruCache;
    }
    /**
     * createAppObject is an internal function used by renderToStream
     * @param  {string} componentPath - full path to .vue file
     * @param  {Object} data          - data to be inserted when generating vue class
     * @param  {Object} vueOptions    - vue options to be used when generating head
     * @return {Promise}              - Promise consists of an AppClass Object
     */
    createAppObject(componentPath: string, data: Object, vueOptions: ? Object): Promise < Models.AppClass > {
        return new Promise((resolve, reject) => {
            let Options = Object.create(this.GlobalOptions);
            Options.data = Models.Defaults.mergeObjects(Options.data, data);
            // Options.mergeDataObject(data);
            if (vueOptions) {
                Options.vue = Models.Defaults.mergeObjects(Options.vue, vueOptions);
                if (vueOptions.layout) {
                    Options.layout = Models.Defaults.mergeObjects(Options.layout, vueOptions.layout);
                }
            }
            Options.component = componentPath;

            Utils.setupComponent(path.join(Options.rootPath, componentPath), Options, this.Cache)
                .then((component) => {

                    const rendered = Renderer.renderHtmlUtil(component);
                    if (!rendered) {
                        reject(new Error("Renderer Error"));
                    } else {
                        const VueClass = rendered.app;
                        const template = Options.layout;
                        const script = rendered.scriptString;
                        const head = new Utils.HeadUtils(Options.vue, rendered.layout.style);

                        const app = new Models.AppClass(VueClass, template, script, head.toString());
                        resolve(app);
                    }
                }).catch((error) => {
                    reject(error);
                });

        });
    }
    /**
     * renderToStream is the main function used by res.renderVue
     * @param {string} componentPath - full path to .vue component
     * @param  {Object} data          - data to be inserted when generating vue class
     * @param  {Object} vueOptions    - vue options to be used when generating head
     * @return {Promise}              - Promise returns a Stream
     */
    renderToStream(componentPath: string, data: Object, vueOptions: Object): Promise < Object > {
        return new Promise((resolve, reject) => {
            this.createAppObject(componentPath, data, vueOptions)
                .then(app => {
                    const vueStream = vueServerRenderer.renderToStream(app.VueClass);
                    let htmlStream;
                    const htmlStringStart = `${app.template.html.start}${app.head}${app.template.body.start}${app.template.template.start}`;
                    const htmlStringEnd = `${app.template.template.end}${app.script}${app.template.body.end}${app.template.html.end}`;

                    htmlStream = new Utils.StreamUtils(htmlStringStart, htmlStringEnd);
                    htmlStream = vueStream.pipe(htmlStream);

                    resolve(htmlStream);
                }).catch(error => {
                    reject(error);
                });
        });
    }
}

module.exports = ExpressVueRenderer;