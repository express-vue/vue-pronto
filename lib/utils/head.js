// @ts-check
const deepmerge = require("deepmerge");
/**
 * BuildHead takes the array and splits it up for processing
 * @param {object} metaObject
 * @returns {String}
 */
function BuildHead(metaObject = {}) {
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
            const processedItem = ProcessMetaItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    if (metaCopy.scripts) {
        for (let index = 0; index < metaCopy.scripts.length; index++) {
            const headItem = metaCopy.scripts[index];
            const processedItem = ProcessScriptItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    if (metaCopy.styles) {
        for (let index = 0; index < metaCopy.styles.length; index++) {
            const headItem = metaCopy.styles[index];
            const processedItem = ProcessStyleItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    if (metaCopy.structuredData) {
        finalString += `<script type="application/ld+json">${JSON.stringify(metaCopy.structuredData)}</script>`;
    }

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @returns {String}
 */
function ProcessScriptItem(itemObject) {
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
function ProcessStyleItem(itemObject) {
    let finalString = "";
    let href = itemObject.style || itemObject.src;
    let ignoreKeys = ["style", "src"];

    if (!itemObject.type) {
        itemObject.type = "text/css";
    }
    finalString = `<link rel="stylesheet" href="${href}"${KeysToString(itemObject, ignoreKeys)} />`;

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @returns {String}
 */
function ProcessMetaItem(itemObject) {
    let finalString = "";

    if (itemObject.rel) {
        finalString = `<link${KeysToString(itemObject)} />`;
    } else {
        finalString = `<meta${KeysToString(itemObject)} />`;
    }

    return finalString;
}

/**
 *
 * @param {object} itemObject
 * @param {Array<string>} [keysToIgnore]
 * @returns {String}
 */
function KeysToString(itemObject, keysToIgnore) {
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
function MergeHead(newObject = {}, oldObject = {}) {
    //Dupe objects to avoid any changes to original object
    const oldCopy = Object.assign({}, oldObject);
    const newCopy = Object.assign({}, newObject);

    /** * @type {deepmerge.Options} */
    const deepoptions = { arrayMerge: concatMerge };
    const mergedObject = deepmerge(oldCopy, newCopy, deepoptions);
    return mergedObject;
}

module.exports.BuildHead = BuildHead;
module.exports.MergeHead = MergeHead;
