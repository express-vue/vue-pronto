const test = require("ava");
const Utils = require("../../lib/utils");

test.cb("Layout Default", t => {
    const context = {
        head: "",
        css: "",
        script: "",
    };
    const layout = Utils.BuildLayout(context);
    const expected = {
        start: '<!DOCTYPE html><html><head><style></style></head><body><div id="app">',
        end: "</div><script>(function () {'use strict';var createApp = function () {return new Vue()};if (typeof module !== 'undefined' && module.exports) {module.exports = createApp} else {this.app = createApp()}}).call(this);app.$mount('#app');</script></body></html>",
    };
    t.deepEqual(layout, expected);
    t.end();
});
