// @ts-check
const deepmerge = require("deepmerge");
// @ts-ignore
const jsToString = require("js-to-string");
/**
 * BuildHead takes the array and splits it up for processing
 * @param {object} metaObject
 * @param {object} [data]
 * @returns {String}
 */
function buildHead(metaObject = {}, data) {
    const metaCopy = Object.assign({}, metaObject);
    let finalString = "";
    if (metaCopy.title) {
        finalString += `<title>${metaCopy.title}</title>`;
    }

    if (metaCopy.meta) {
        throw new Error("WARNING - DEPRECATED: It looks like you're using the old meta object, please migrate to the new one");
    }

    if (metaCopy.metas) {
        for (let index = 0; index < metaCopy.metas.length; index++) {
            const headItem = metaCopy.metas[index];
            const processedItem = processMetaItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    if (metaCopy.scripts) {
        for (let index = 0; index < metaCopy.scripts.length; index++) {
            const headItem = metaCopy.scripts[index];
            const processedItem = processScriptItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    if (metaCopy.styles) {
        for (let index = 0; index < metaCopy.styles.length; index++) {
            const headItem = metaCopy.styles[index];
            const processedItem = processStyleItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    if (metaCopy.structuredData) {
        finalString += `<script type="application/ld+json">${JSON.stringify(metaCopy.structuredData)}</script>`;
    }

    if (data) {
        finalString += `<script>window.__INITIAL_STATE__ = ${jsToString(data)}</script>`;
    }

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @returns {String}
 */
function processScriptItem(itemObject) {
    let finalString = "<script";
    let extras = "";
    if (itemObject.srcContents) {
        finalString = itemObject.srcContents;
    } else {
        if (itemObject.charset) {
            finalString += ` charset="${itemObject.charset}"`;
        }
        if (itemObject.type) {
            finalString += ` type="${itemObject.type}"`;
        }
        if (itemObject.src) {
            finalString += ` src="${itemObject.src}"`;
        }
        if (itemObject.async || itemObject.defer) {
            if (itemObject.async) {
                extras += " async";
            }
            if (itemObject.defer) {
                extras += " defer";
            }
            finalString += extras;
        }
        finalString += " ></script>";
    }

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @returns {String}
 */
function processStyleItem(itemObject) {
    let finalString = "";
    let href = itemObject.style || itemObject.src;
    let ignoreKeys = ["style", "src"];

    if (!itemObject.type) {
        itemObject.type = "text/css";
    }
    finalString = `<link rel="stylesheet" href="${href}"${keysToString(itemObject, ignoreKeys)} />`;

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @returns {String}
 */
function processMetaItem(itemObject) {
    let finalString = "";

    if (itemObject.rel) {
        finalString = `<link${keysToString(itemObject)} />`;
    } else {
        finalString = `<meta${keysToString(itemObject)} />`;
    }

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @param {Array<string>} [keysToIgnore]
 * @returns {String}
 */
function keysToString(itemObject, keysToIgnore) {
    if (!keysToIgnore) { keysToIgnore = []; }
    const keys = Object.keys(itemObject);
    let finalString = "";
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const value = itemObject[key];
        if (!keysToIgnore.includes(key)) {
            const processedItem = ` ${key}="${value}"`;
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }

    }
    return finalString;
}

/**
 *
 * @param {*} destinationArray
 * @param {*} sourceArray
 * @returns {*}
 */
function concatMerge(destinationArray, sourceArray) {
    let finalArray = destinationArray.concat(sourceArray);
    return finalArray;
}

/**
 *
 * @param {object} newObject
 * @param {object} oldObject
 * @returns {object}
 */
function mergeHead(newObject = {}, oldObject = {}) {
    //Dupe objects to avoid any changes to original object
    const oldCopy = Object.assign({}, oldObject);
    const newCopy = Object.assign({}, newObject);

    /** * @type {deepmerge.Options} */
    const deepoptions = { arrayMerge: concatMerge };
    const mergedObject = deepmerge(oldCopy, newCopy, deepoptions);
    return mergedObject;
}

module.exports.buildHead = buildHead;
module.exports.mergeHead = mergeHead;
