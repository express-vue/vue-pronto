// @ts-check
const Layout = require("../models/layout").Layout;
/**
 * buildLayout
 * @param {{head: string, template: Layout, css: string, script: string}} layoutObject
 * @returns {{start: string, end: string}}
 */
function buildLayout(layoutObject) {
    let finishedLayout = {
        start: "",
        end: "",
    };

    if (layoutObject) {
        const layout = new Layout(layoutObject.template);
        finishedLayout.start = `${layout.html.start}<head>${layoutObject.head}<style>${layoutObject.css}</style></head>${layout.body.start}${layout.template.start}`;
        finishedLayout.end = `${layout.template.end}${BuildScript(layoutObject.script)}${layout.body.end}${layout.html.end}`;
    } else {
        throw new Error("Missing Layout Object");
    }

    return finishedLayout;
}

/**
 *
 * @param {String} script
 * @returns {String}
 */
function BuildScript(script) {
    let debugToolsString = "";

    if (process.env.VUE_DEV && process.env.VUE_DEV === "true") {
        debugToolsString = "Vue.config.devtools = true;";
    }

    let vueString = `var createApp = function () {return new Vue({})};`;
    if (script) {
        vueString = `var createApp = function () {return new Vue(${script})};`;
    }

    const javaScriptString = `(function(){"use strict";${vueString}"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),${debugToolsString}app.$mount("#app");`;
    return `<script>${javaScriptString}</script>`;
}

module.exports = buildLayout;
