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
        end: ""
    };

    if (layoutObject) {
        const layout = new Layout.Layout(layoutObject.template);
        finishedLayout.start = `${layout.html.start}<head>${layoutObject.head}<style type="text/css">${layoutObject.css}</style></head>${layout.body.start}${layout.template.start}`;
        finishedLayout.end = `${layout.template.end}${layoutObject.script}${layout.body.end}${layout.html.end}`;    
    } else {
        throw new Error("Missing Layout Object");
    }

    return finishedLayout;
}

module.exports = BuildLayout;