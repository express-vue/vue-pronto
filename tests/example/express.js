// @ts-check
"use strict";
const Pronto = require("../../lib");

//This is the Middleware in express-vue this wont be in the file
/**
 *
 * @param {object} options
 * @returns {Function}
 */
function init(options) {
    //Make new object
    const renderer = new Pronto(options);
    //Middleware init
    return (req, res, next) => {
        //Res RenderVUE function
        /**
         *
         * @param {string} componentPath
         * @param {object} data
         * @param {object} vueOptions
         */
        res.renderVue = (componentPath, data = {}, vueOptions = {}) => {
            res.set("Content-Type", "text/html");
            renderer.RenderToStream(componentPath, data, vueOptions)
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
