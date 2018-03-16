// @ts-check

/**
 * @typedef VueVersionReturnType
 * @prop {Boolean} enabled
 * @prop {Object} [script]
 */

/**
 * Set VueVersion
 * @param {(String|Object)} vueVersion
 * @returns {VueVersionReturnType}
 */
function VueVersion(vueVersion) {
    let VueVersionReturnObject = {
        enabled: true,
    };
    if (!vueVersion) {
        // @ts-ignore
        vueVersion = "latest";
    }

    switch (typeof vueVersion) {
        case "string":
            if (process.env.VUE_DEV && process.env.VUE_DEV === "true") {
                VueVersionReturnObject.script = {src: `https://cdn.jsdelivr.net/npm/vue@${vueVersion}/dist/vue.js`};
            } else {
                VueVersionReturnObject.script = {src: `https://cdn.jsdelivr.net/npm/vue@${vueVersion}/dist/vue.min.js`};
            }
            VueVersionReturnObject.enabled = true;
            break;
        case "object":
            if (vueVersion.disabled) {
                VueVersionReturnObject.enabled = false;
            }
            break;
    }
    return VueVersionReturnObject;
}

module.exports = VueVersion;
