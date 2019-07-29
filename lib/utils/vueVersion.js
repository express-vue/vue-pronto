// @ts-check

/**
 * @typedef vueVersionReturnType
 * @prop {Boolean} enabled
 * @prop {Object} [script]
 */

/**
 * Set VueVersion
 * @param {(String|Object)} version
 * @returns {vueVersionReturnType}
 */
module.exports = function(version) {
    /** @type vueVersionReturnType */
    let vueVersionReturnObject = {
        enabled: true,
    };
    if (!version) {
        // @ts-ignore
        version = "latest";
    }

    switch (typeof version) {
        case "string":
            if (process.env.VUE_DEV && process.env.VUE_DEV === "true") {
                vueVersionReturnObject.script = {src: `https://cdn.jsdelivr.net/npm/vue@${version}/dist/vue.js`};
            } else {
                vueVersionReturnObject.script = {src: `https://cdn.jsdelivr.net/npm/vue@${version}/dist/vue.min.js`};
            }
            vueVersionReturnObject.enabled = true;
            break;
        case "object":
            if (version.disabled) {
                vueVersionReturnObject.enabled = false;
            }
            break;
    }
    return vueVersionReturnObject;
};
