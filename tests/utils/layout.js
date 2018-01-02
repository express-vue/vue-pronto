const test = require("ava");
const Utils = require("../../lib/utils");


test.cb("Layout Default", t => {
    const layout = Utils.BuildLayout();
    console.log(layout);
    t.end();
})

