"use strict";
let Renderer;
if (process.env.DEBUG) {
    Renderer = require("../../src");
} else {
    Renderer = require("../../lib");
}


//This is the Middlewarein express-vue this wont be in the file
function init(options) {
    //Make new object
    const evr = new Renderer(options);
    //Middleware init
    return (req, res, next) => {
        //Res RenderVUE function
        res.renderVue = (componentPath, data = {}, vueOptions = {}) => {
            res.set("Content-Type", "text/html");
            evr.RenderToStream(componentPath, data, vueOptions)
                .then(stream => {
                    stream.on("data", chunk => res.write(chunk));
                    stream.on("end", () => res.end());
                })
                .catch(error => {
                    console.error(error);
                    res.send(error);
                });
        };
        return next();
    };
}

module.exports.init = init;