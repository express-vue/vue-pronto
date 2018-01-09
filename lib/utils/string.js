// @ts-check
const xss = require("xss");

class PropClass {
    /**
     *
     * @param {*} prop
     * @property {*} type
     * @property {Boolean} required
     * @property {*} default
     */
    constructor(prop) {
        this.required = prop.required ? prop.required : null;
        this.default = prop.default ? prop.default : null;
    }
}

/**
 *
 * @param {Object | *} script
 * @param {String} currentElement
 * @returns {String}
 */
function isLastElement(script, currentElement) {
    const elementArray = Object.keys(script);
    const lastElement = elementArray[elementArray.length - 1];

    if (currentElement === lastElement) {
        return "";
    } else {
        return ",";
    }
}

/**
 *
 * @param {Object[]} routes
 * @returns {String}
 */
function routesToString(routes) {
    let routeString = "";
    const lastRoute = routes[routes.length - 1];
    routes.forEach(route => {
        if (route !== lastRoute) {
            routeString += scriptToString(route) + ",";
        } else {
            routeString += scriptToString(route);
        }
    });
    return `[${routeString}]`;
}

/**
 *
 * @param {object} script
 * @returns {String}
 */
function routeComponentsToString(script) {
    let componentString = "";
    for (const member in script) {
        if (script.hasOwnProperty(member)) {
            const element = script[member];
            componentString += member + ": __" + element + isLastElement(script, member);
        }
    }
    return `{${componentString}}`;
}

/**
 *
 * @param {Object[]} mixins
 * @returns {String}
 */
function mixinsToString(mixins) {
    var mixinString = "";
    for (var mixin of mixins) {
        mixinString += `${scriptToString(mixin)},`;
    }
    return mixinString;
}

/**
 *
 * @param {object} props
 * @returns {String}
 */
function propsToString(props) {
    let propString = "";
    if (props[Object.keys(props)[0]].type === null) {
        var propsArray = Object.keys(props);
        propString = xss(JSON.stringify(propsArray));
    } else {
        let tempProp = {};
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var element = new PropClass(props[prop]);
                tempProp[prop] = element;
            }
        }
        propString = scriptToString(tempProp);
    }
    return propString;
}

/**
 * @constructor
 * @param {Object | *} script
 * @returns {String}
 */
function scriptToString(script) {
    let scriptString = "";
    for (let member in script) {
        if (script.hasOwnProperty(member)) {
            const element = script[member];
            switch (typeof element) {
                case "function":
                    if (member === "data") {
                        const dataObj = xss(JSON.stringify(element()));
                        scriptString += `${member}: function(){return ${dataObj}},`;
                    } else {
                        scriptString += member + ": " + String(element) + isLastElement(script, member);
                    }
                    break;
                case "object":
                    if (member === "data") {
                        scriptString += member + ": " + xss(JSON.stringify(element)) + isLastElement(script, member);
                    } else if (member === "routes" || member === "children") {
                        scriptString += member + ": " + routesToString(element) + isLastElement(script, member);
                    } else if (member === "components" && script.path !== undefined) { // Checks if 'components' is in a route object
                        scriptString += member + ": " + routeComponentsToString(element) + isLastElement(script, member);
                    } else if (member === "mixins") {
                        scriptString += member + ": [" + mixinsToString(element) + "],";
                    } else if (element.constructor === Array) {
                        scriptString += member + ": " + xss(JSON.stringify(element)) + isLastElement(script, member);
                    } else if (member === "props") {
                        if (element[Object.keys(element)[0]].type === null) {
                            var propsArray = Object.keys(element);
                            scriptString += member + ": " + xss(JSON.stringify(propsArray)) + isLastElement(script, member);
                        } else {
                            // scriptString += member + ': ' + scriptToString(element) + isLastElement(script, member);
                            const propsString = propsToString(element);
                            scriptString += `${member}: ${propsString},`;
                        }

                    } else {
                        scriptString += member + ": " + scriptToString(element) + isLastElement(script, member);
                    }
                    break;
                default:
                    if (member === "component" && script.path !== undefined) { // Checks if 'component' is in a route object
                        scriptString += member + ": __" + element + isLastElement(script, member);
                    } else {
                        scriptString += member + ": " + JSON.stringify(element) + isLastElement(script, member);
                    }
                    break;
            }
        }
    }
    let finalScriptString = `{${scriptString}}`;
    return finalScriptString;
}

module.exports.scriptToString = scriptToString;
module.exports.mixinsToString = mixinsToString;
module.exports.routesToString = routesToString;
module.exports.routeComponentsToString = routeComponentsToString;
