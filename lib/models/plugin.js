// @ts-check
const jsToString = require("js-to-string");
const fs = require("fs");
const path = require("path");
const changeCase = require("change-case");

class Plugin {
    /**
     * @param {object} plugin
     */
    constructor(plugin) {
        this.name = plugin.name;
        this.options = plugin.options;
        this.include = plugin.include || true;
    }
    /**
     * @param {string} nodeModulesPath
     * @returns {string}
     */
    processPlugin(nodeModulesPath) {
        let plugin = "";
        if (this.include) {
            const packagePath = path.join(nodeModulesPath, this.name);
            const packageJson = require(`${packagePath}/package.json`);
            const pluginPath = path.join(packagePath, packageJson.main);
            const pluginStr = fs.readFileSync(pluginPath).toString();
            const pluginMatches = /(?:module.exports=)(.*)(?:})/gm.exec(pluginStr);
            plugin = pluginStr;

        } else {
            plugin = jsToString(this.name);
        }
        return plugin;
    }
    /**
     * @param {string} nodeModulesPath
     */
    toString(nodeModulesPath) {
        const plugin = this.processPlugin(nodeModulesPath);
        const pluginName = changeCase.camelCase(this.name);
        let pluginStr = `var ${pluginName} = ${plugin};
        Vue.use(${pluginName}`;
        if (this.options && Object.keys(this.options).length > 0) {
            let optionsStr = jsToString(this.options);
            pluginStr += `, ${optionsStr}`;
        }
        pluginStr += `);\n`;
        return pluginStr;
    }
}

module.exports = Plugin;
