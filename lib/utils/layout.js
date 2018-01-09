// @ts-check
const Layout = require("../models/layout");

/**
 * BuildLayout
 * @param {{head: string, template: Object, css: string, script: string}} layoutObject
 * @returns {{start: string, end: string}}
 */
function BuildLayout(layoutObject) {
    let finishedLayout = {
        start: "",
        end: "",
    };

    if (layoutObject) {
        const layout = new Layout.Layout(layoutObject.template);
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

    if (process.env.VUE_DEV) {
        debugToolsString = "Vue.config.devtools = true;";
    }
    const javaScriptString = `(function () {'use strict';var createApp = function () {return new Vue(${script})};if (typeof module !== 'undefined' && module.exports) {module.exports = createApp} else {this.app = createApp()}}).call(this);${debugToolsString}app.$mount('#app');`;

    return `<script>${javaScriptString}</script>`;
}

module.exports = BuildLayout;
