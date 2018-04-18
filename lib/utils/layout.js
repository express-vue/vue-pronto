// @ts-check
const Layout = require("../models/layout").Layout;
/**
 * BuildLayout
 * @param {{head: string, template: Layout, css: string, script: string}} layoutObject
 * @param {string} compiled
 * @returns {{start: string, end: string}}
 */
function BuildLayout(layoutObject, compiled) {
    let finishedLayout = {
        start: "",
        end: "",
    };
    let variables = "";
    if (compiled) {
        variables = getVariables(compiled);
    }

    if (layoutObject) {
        const layout = new Layout(layoutObject.template);
        finishedLayout.start = `${layout.html.start}<head>${layoutObject.head}<style>${layoutObject.css}</style></head>${layout.body.start}${layout.template.start}`;
        finishedLayout.end = `${layout.template.end}${BuildScript(layoutObject.script, variables)}${layout.body.end}${layout.html.end}`;
    } else {
        throw new Error("Missing Layout Object");
    }

    return finishedLayout;
}

/**
 * @param {string} script
 * @returns {string}
 */
function getVariables(script) {
    let variables = "";
    const regex = /(?:function\(\){Object.defineProperty\(exports,"__esModule",{value:!0}\);)(var .*};)(?=return)/igm;
    const innerRegex = /(?!function\(\){Object.defineProperty\(exports,"__esModule",{value:!0}\);)(var .*};)/igm;
    const matches = script.match(regex);
    if (matches && matches.length > 0) {
        for (const match of matches) {
            let element = innerRegex.exec(match);
            if (element && element.length > 0) {
                variables += `${element[0]}\n`;
            }
        }
    }

    return variables;
}
/**
 *
 * @param {String} script
 * @param {string} variables
 * @returns {String}
 */
function BuildScript(script, variables) {
    let debugToolsString = "";

    if (process.env.VUE_DEV && process.env.VUE_DEV === "true") {
        debugToolsString = "Vue.config.devtools = true;";
    }

    let vueString = `var createApp = function () {return new Vue({})};`;
    if (script) {
        vueString = `var createApp = function () {return new Vue(${script})};`;
    }

    const javaScriptString = `(function(){"use strict";${vueString}"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),${debugToolsString}app.$mount("#app");`;
    return `<script>${variables}\n${javaScriptString}</script>`;
}

module.exports = BuildLayout;
