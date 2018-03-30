// @ts-check
const jsToString = require("js-to-string");
const fs = require("fs");

class Plugin {
    /**
     * @param {string} name
     * @param {object} options
     */
    constructor(name, options) {
        this.name = name;
        this.options = options;
    }
    toString() {
        const plugin = jsToString(this.name);
        let pluginStr = `Vue.use("${plugin}"`;
        if (this.options && Object.keys(this.options).length > 0) {
            let optionsStr = jsToString(this.options);
            pluginStr += `, ${optionsStr}`;
        }
        pluginStr += `);\n`;
        return pluginStr;
    }
}

module.exports = Plugin;
