// @ts-check
const Layout = require("../models/layout").Layout;
/**
 * BuildLayout
 * @param {{head: string, template: Layout, script: string}} layoutObject
 * @returns {{start: string, end: string}}
 */
function BuildLayout(layoutObject) {
    let finishedLayout = {
        start: "",
        end: "",
    };


    if (layoutObject) {
        const layout = new Layout(layoutObject.template);
        finishedLayout.start = `${layout.html.start}<head>${layoutObject.head}</head>${layout.body.start}${layout.template.start}`;
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
    return `<script src="${script}"></script>`;
}

module.exports = BuildLayout;