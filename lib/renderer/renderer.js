// @ts-check
const fs = require("fs");
const path = require("path");
const requireFromString = require("require-from-string");
const vueCompiler = require("vue-template-compiler");
const vueify = require("vueify");
const vueServerRenderer = require("vue-server-renderer");
const Vue = require("vue");
const uglify = require("uglify-js");
const LRU = require("lru-cache");
const processStyle = require("./process-style").processStyle;


class Renderer {
    /**
     * @param {object} options
    */
    /**
     * @property {{max: number, maxAge: number}} cacheOptions - fffdfd
     * @property {LRU} lruCache
     * @property {string} template
     * @property {vueServerRenderer} renderer
    */
    constructor(options = {}) {
        if (options.cacheOptions) {
            this.cacheOptions = options.cacheOptions;
        } else {
            this.cacheOptions = {
                max: 500,
                maxAge: 1000 * 60 * 60
            };
        }

        if (options.template) {
            this.template = options.template;
        } else {
            this.template = `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>{{title}}</title>
                    <style>{{css}}</style>
                </head>
                <body>
                    <!--vue-ssr-outlet-->
                </body>
            </html>`;
        }

        this.lruCache = LRU(this.cacheOptions);
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
                        this.FindAndReplaceComponents(compiled.compiled, filePath)
                            .then((codeString) => {
                                // const renderFunctionRegex = /(?:__vue__options__.render=function\(\){)(.*)(?:};?,?__)/gm;
                                // const staticRenderFunctionsRegex = /(?:__vue__options__.staticRenderFns=\[)(.*)(?:\])/gm;
                                // const exportsRegex = /(?:module.exports={)(.*)(?:}}\(\);?)/gm;
                                // const importsRegex = /(?:"use strict";?)(.*)(?:module.exports={)/gm;
                                const reg = /(?:"use strict";)(.*)(?:module.exports={)(.*)(?:}}\(\);?)(?:.*)(?:__vue__options__.render=function\(\){)(.*)(?:},?;?__vue__options__.staticRenderFns=\[)(.*)(?:\])/gm;
                                
                                let vueComponent = "";
                                let imports = "";
                                let moduleExports = "";
                                let renderFunctionContents = "";
                                let staticRenderFns = "";
                                
                                const {code} = uglify.minify(codeString, {mangle:false});
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
                                    match: vueComponentMatch
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
                    const last_element = code.match(vueFileRegex);
                    if (last_element === undefined || last_element === null) {
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
                    styles: []
                };
                let compiled = {
                    compiled: "",
                    style: ""
                };

                const stylesArray = vueCompiler.parseComponent(content, {pad: true}).styles;
                //@ts-ignore
                const compiler = vueify.compiler;
                compiler.compile(content, filePath, function(error, stringFile) {
                    if (error) {
                        reject(error);
                    }
                    if (stylesArray.length > 0) {
                        processStyle(stylesArray[0], filePath, "", resolvedParts)
                            .then(() => {
                                compiled.compiled = stringFile;
                                compiled.style = resolvedParts.styles.join("\n");

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
                    const bundle = requireFromString(code);
                    resolve(bundle);
                })
                .catch(reject);
        });
    }
    /**
     * 
     * @param {string} filePath 
     * @param {object} data 
     * @returns {Promise<{vue: object, css: string}>}
     */
    MakeVueClass(filePath, data) {
        return new Promise((resolve, reject) => {
            const cachedBundle = this.lruCache.get(filePath);
            if (cachedBundle) {
                cachedBundle.bundle.data = this.FixData(cachedBundle.bundle.data(), data);
                //@ts-ignore
                const vue = new Vue(cachedBundle.bundle);
                const object = {
                    vue:vue,
                    css: cachedBundle.style
                };
                resolve(object);
            } else {
                //Make Bundle
                this.Compile(filePath)
                    .then(compiled => {
                        this.MakeBundle(compiled.compiled, filePath)
                            .then(bundle =>{
                                this.lruCache.set(filePath, {bundle: bundle, style: compiled.style});
                                //Insert Data
                                bundle.data = this.FixData(bundle.data(), data);
                                //Create Vue Class
                                //@ts-ignore
                                const vue = new Vue(bundle);
                                const object = {
                                    vue: vue,
                                    css: compiled.style
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
     * renderToStream returns a string from res.renderVue to the client
     * @param {string} vuefile 
     * @param {object} data 
     * @param {object} vueOptions 
     * @returns {Promise}
     */
    RenderToString(vuefile, data, vueOptions) {
        return new Promise((resolve, reject) => {
            this.renderer = vueServerRenderer.createRenderer({
                cache: this.lruCache,
                template: vueOptions.template ? vueOptions.template : this.template
            });
            this.MakeVueClass(vuefile, data)
                .then(vueClass => {
                    //Init Renderer
                    const context = {
                        title: vueOptions.title,
                        css: vueClass.css
                    };
                    this.renderer.renderToString(vueClass.vue, context)
                        .then(html => {
                            resolve(html);
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }
    /**
     * renderToStream returns a stream from res.renderVue to the client
     * @param  {string} vuefile                               - full path to .vue component
     * @param  {Object} data                                  - data to be inserted when generating vue class
     * @param  {{template: string, title: string}} vueOptions - vue options to be used when generating head
     * @return {Promise}                                      - Promise returns a Stream
     */
    RenderToStream(vuefile, data, vueOptions) {
        return new Promise((resolve, reject) => {
            this.renderer = vueServerRenderer.createRenderer({
                cache: this.lruCache,
                template: vueOptions.template ? vueOptions.template : this.template
            });
            this.MakeVueClass(vuefile, data)
                .then(vueClass => {
                    //Init Renderer
                    const context = {
                        title: vueOptions.title ? vueOptions.title : "",
                        css: vueClass.css
                    };
                    const vueStream = this.renderer.renderToStream(vueClass.vue, context);
                    resolve(vueStream);
                })
                .catch(reject);
        });
    }
}

module.exports = Renderer;
