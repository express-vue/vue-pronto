// @ts-checked
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
        prop.required ? this.required = prop.required : null;
        prop.default ? this.default = prop.default : null;
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
    const lastRoute = routes[routes.length-1];
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
 * @param {Object} script 
 * @returns {String}
 */
function routeComponentsToString(script) {
    let componentString = "";
    for (let member in script) {
        componentString += member + ": __" + script[member] + isLastElement(script, member);
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
 * @param {Object} props 
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
        switch (typeof script[member]) {
            case "function":
                if (member === "data") {
                    const dataObj = xss(JSON.stringify(script[member]()));
                    scriptString += `${member}: function(){return ${dataObj}},`;
                } else {
                    scriptString += member + ": " + String(script[member]) + isLastElement(script, member);
                }
                break;
            case "object":
                if (member === "data") {
                    scriptString += member + ": " + xss(JSON.stringify(script[member])) + isLastElement(script, member);
                } else if (member === "routes" || member === "children") {
                    scriptString += member + ": " + routesToString(script[member]) + isLastElement(script, member);
                } else if (member === "components" && script["path"] !== undefined) { // Checks if 'components' is in a route object
                    scriptString += member + ": " + routeComponentsToString(script[member]) + isLastElement(script, member);
                } else if (member === "mixins") {
                    scriptString += member + ": [" + mixinsToString(script[member]) + "],";
                } else if (script[member].constructor === Array) {
                    scriptString += member + ": " + xss(JSON.stringify(script[member])) + isLastElement(script, member);
                } else if (member === "props") {
                    if (script[member][Object.keys(script[member])[0]].type === null) {
                        var propsArray = Object.keys(script[member]);
                        scriptString += member + ": " + xss(JSON.stringify(propsArray)) + isLastElement(script, member);
                    } else {
                        // scriptString += member + ': ' + scriptToString(script[member]) + isLastElement(script, member);
                        const propsString = propsToString(script[member]);
                        scriptString += `${member}: ${propsString},`;
                    }

                } else {
                    scriptString += member + ": " + scriptToString(script[member]) + isLastElement(script, member);
                }
                break;
            default:
                if (member === "component" && script["path"] !== undefined) { // Checks if 'component' is in a route object
                    scriptString += member + ": __" + script[member] + isLastElement(script, member);
                } else {
                    scriptString += member + ": " + JSON.stringify(script[member]) + isLastElement(script, member);
                }
                break;
        }
    }
    let finalScriptString = `{${scriptString}}`;
    return finalScriptString;
}

module.exports.scriptToString = scriptToString;
module.exports.mixinsToString = mixinsToString;
module.exports.routesToString = routesToString;
module.exports.routeComponentsToString = routeComponentsToString;