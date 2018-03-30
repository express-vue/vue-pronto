// @ts-check
const Layout = require("../models/layout").Layout;
const Plugin = require("../models/plugin");

/**
 * BuildLayout
 * @param {{head: string, template: Layout, css: string, script: string}} layoutObject
 * @param {Plugin[]} plugins
 * @returns {{start: string, end: string}}
 */
function BuildLayout(layoutObject, plugins) {
    let finishedLayout = {
        start: "",
        end: "",
    };

    if (layoutObject) {
        const layout = new Layout(layoutObject.template);
        finishedLayout.start = `${layout.html.start}<head>${layoutObject.head}<style>${layoutObject.css}</style></head>${layout.body.start}${layout.template.start}`;
        finishedLayout.end = `${layout.template.end}${BuildScript(layoutObject.script, plugins)}${layout.body.end}${layout.html.end}`;
    } else {
        throw new Error("Missing Layout Object");
    }

    return finishedLayout;
}

/**
 *
 * @param {String} script
 * @param {Plugin[]} plugins
 * @returns {String}
 */
function BuildScript(script, plugins) {
    let debugToolsString = "";
    let pluginsString = "";
    const minifyRegex = /\s+(?=([^"]*"[^"]*")*[^"]*$)/gm;

    if (process.env.VUE_DEV && process.env.VUE_DEV === "true") {
        debugToolsString = "Vue.config.devtools = true;";
    }

    if (plugins && plugins.length > 0) {
        for (let index = 0; index < plugins.length; index++) {
            const plugin = plugins[index];
            let pluginStr = plugin.toString();
            pluginsString += pluginStr;
        }
    }

    let vueString = `var createApp = function () {return new Vue({})};`;
    if (script) {
        vueString = `var createApp = function () {return new Vue(${script})};`;
    }

    vueString = vueString.replace(minifyRegex, " ");

    const javaScriptString = `(function(){"use strict";${pluginsString}${vueString}"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),${debugToolsString}app.$mount("#app");`;
    return `<script>${javaScriptString}</script>`;
}

module.exports = BuildLayout;
