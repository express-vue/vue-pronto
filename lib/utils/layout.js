// @ts-check
const Layout = require("../models/layout");

/**
 * BuildLayout
 * @param {Object} layoutObject 
 * @returns {String}
 */
function BuildLayout(layoutObject) {
    let finishedLayout = "";
    const layout = new Layout.Layout(layoutObject);
    finishedLayout = `${layout.html.start}<head>{{head}}{{css}}</head>${layout.body.start}${layout.template.start}<!--vue-ssr-outlet-->${layout.template.end}{{script}}${layout.body.end}${layout.html.end}`;

    return finishedLayout;
}

module.exports = BuildLayout;