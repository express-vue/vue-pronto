const compiler = require('vue-component-compiler');
const fs = require("fs");
const path = require("path");
const requireFromString = require("require-from-string");
const vueCompiler = require('vue-template-compiler')
const vueify = require("vueify");
const vueServerRenderer = require("vue-server-renderer");
const Vue = require("vue");
const stringToStream = require("string-to-stream");
const babel = require("babel-core");
const butternut = require("butternut");
const LRU = require("lru-cache");
const processStyle = require("./process-style").processStyle;


const cacheOptions = {
    max: 500,
    maxAge: 1000 * 60 * 60
};
const lruCache = LRU(cacheOptions);

const template = `<!DOCTYPE html>
<html lang="en">
    <head>
        <title>{{title}}</title>
        <style>{{css}}</style>
    </head>
    <body>
        <!--vue-ssr-outlet-->
    </body>
</html>`

const renderer = vueServerRenderer.createRenderer({
    cache: lruCache,
    template: template
});

const renderFunctionRegex = /(?:__vue__options__.render=function\(\){)(.*)(?:};__)/gm;
const staticRenderFunctionsRegex = /(?:__vue__options__.staticRenderFns=\[)(.*)(?:\])/gm;
const exportsRegex = /(?:module.exports={)(.*)(?:}}\(\);)/gm;

function FixData(oldData, newData) {
    const mergedData = Object.assign({}, oldData, newData);
    return function() { 
        return mergedData
    };
}

function BuildComponent(componentFile, filePath, vueComponentMatch) {
    return new Promise((resolve, reject) => {
        let compiledComponent = "";
        const relativePath = path.resolve(path.parse(filePath).dir, componentFile)
        Compile(relativePath)
            .then(compiled => {
                const {code,map} = butternut.squash(compiled.compiled);
                const moduleExports = exportsRegex.exec(code)[1];
                const renderFunctionContents = renderFunctionRegex.exec(code)[1];
                const staticRenderFns = staticRenderFunctionsRegex.exec(code)[1];
                const vueComponent = `{${moduleExports},render: function render() {${renderFunctionContents}},staticRenderFns: [${staticRenderFns}]}`
                resolve({
                    compiled: vueComponent,
                    filePath: relativePath,
                    match: vueComponentMatch
                });
            })
            .catch(reject);
    });
}


function FindAndReplaceComponents(code, filePath) {
    return new Promise((resolve, reject) => {
        const vueFileRegex = /([\w/.\-@_\d]*\.vue)/igm;
        const requireRegex = /(require\(['"])([\w:/.\-@_\d]*\.vue)(['"]\))/igm;
        let vueComponentMatches = code.match(requireRegex);
        if (vueComponentMatches && vueComponentMatches.length > 0) {
            let promiseArray = [];
            for (let index = 0; index < vueComponentMatches.length; index++) {
                let vueComponentMatch = vueComponentMatches[index];
                const vueComponentFile = vueComponentMatch.match(vueFileRegex)[0];
                if (vueComponentFile) {
                    promiseArray.push(BuildComponent(vueComponentFile, filePath, vueComponentMatch));
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
    })
}

function Compile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function(err, fileContent) {
            if (err) {
                reject(err);
            }
            const content = String(fileContent);
            let resolvedParts = {
                styles: []
            }
            let compiled = {
                compiled: "",
                style: ""
            };

            const stylesArray = vueCompiler.parseComponent(content, {pad: true}).styles;
            const compiler = vueify.compiler;
            compiler.compile(content, filePath, function(error, stringFile) {
                if (error) {
                    reject(error)
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
    })
}

function MakeBundle(stringFile, filePath) {
    return new Promise((resolve, reject) => {
        FindAndReplaceComponents(stringFile, filePath)
            .then(code => {
                const bundle = requireFromString(code);
                resolve(bundle);
            })
            .catch(reject);
    });
}

function MakeVueClass(filePath, data) {
    return new Promise((resolve, reject) => {
        const cachedBundle = lruCache.get(filePath);
        if (cachedBundle) {
            cachedBundle.bundle.data = FixData(cachedBundle.bundle.data(), data);
            const vue = new Vue(cachedBundle.bundle);
            const object = {
                vue:vue,
                css: cachedBundle.style
            }
            resolve(object);
        } else {
            //Make Bundle
            Compile(filePath)
                .then(compiled => {
                    MakeBundle(compiled.compiled, filePath)
                        .then(bundle =>{
                            lruCache.set(filePath, {bundle: bundle, style: compiled.style});
                            //Insert Data
                            bundle.data = FixData(bundle.data(), data);
                            //Create Vue Class
                            const vue = new Vue(bundle);
                            const object = {
                                vue: vue,
                                css: compiled.style
                            }
                            resolve(object);
                        })
                        .catch(reject);
                })
                .catch(reject);
        }
    });
}


function renderToString(vuefile, data) {
    return new Promise((resolve, reject) => {
        MakeVueClass(vuefile, data)
            .then(vueClass => {
                //Init Renderer
                const context = {
                    title: 'Hello',
                    css: vueClass.css
                }
                renderer.renderToString(vueClass.vue, context)
                    .then(html => {
                        resolve(html)
                    })
                    .catch(reject)
            })
            .catch(reject);
    })
} 

module.exports.renderToString = renderToString;