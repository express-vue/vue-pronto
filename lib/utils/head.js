// @ts-check
const deepmerge = require("deepmerge");
/**
 * BuildHead takes the array and splits it up for processing
 * @param {Object} metaObject 
 * @returns {String}
 */
function BuildHead(metaObject = {}) {
    const metaCopy = Object.assign({}, metaObject);
    let finalString = "";
    if (metaCopy.title) {
        finalString += `<title>${metaCopy.title}</title>`;
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
 * @param {Object} itemObject 
 * @returns {String}
 */
function ProcessScriptItem(itemObject) {
    let finalString = "<script ";
    let extras = "";
    if (itemObject.charset) {
        finalString += `charset="${itemObject.charset}"`;
    }
    if (itemObject.type) {
        finalString += `type="${itemObject.type}"`;
    }
    if (itemObject.src) {
        finalString += `src="${itemObject.src}"`;
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
    
    return finalString;
}

/**
 * 
 * @param {Object} itemObject 
 * @returns {String}
 */
function ProcessStyleItem(itemObject) {
    let finalString = "";

    const href = itemObject.style;
    // delete itemObject.style;
    if (!itemObject.type) {
        itemObject.type = "text/css";
    }
    finalString = `<link rel="stylesheet" href="${href}"${KeysToString(itemObject)} />`;
    
    return finalString;
}

/**
 * 
 * @param {Object} itemObject 
 * @returns {String}
 */
function ProcessMetaItem(itemObject) {
    let finalString = "";

    if (itemObject.src) {
        let extras = "";
        // delete itemObject.script;
        if (!itemObject.charset) {
            itemObject.charset = "utf-8";
        }
        if (itemObject.async || itemObject.defer) {
            if (itemObject.async) {
                extras += " async";
                // delete itemObject.async;
            }
            if (itemObject.defer) {
                extras += " defer";
                // delete itemObject.defer;
            }
        }
        finalString = `<script ${KeysToString(itemObject)}${extras} ></script>`;
    
    } if(itemObject.rel) {
        finalString = `<link${KeysToString(itemObject)} />`;
    } else {
        finalString = `<meta${KeysToString(itemObject)} />`;
    }

    return finalString;
}

/**
 * 
 * @param {Object} itemObject 
 * @returns {String}
 */
function KeysToString(itemObject) {
    const keys = Object.keys(itemObject);
    let finalString = "";
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const value = itemObject[key];
        const processedItem = ` ${key}="${value}"`;
        if (processedItem !== undefined) {
            finalString += processedItem;
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
 * @param {Object} newObject 
 * @param {Object} oldObject 
 * @returns {Object}
 */
function MergeHead(newObject = {}, oldObject = {}) {
    //Dupe objects to avoid any changes to original object
    const oldCopy = Object.assign({}, oldObject);
    const newCopy = Object.assign({}, newObject);

    const mergedObject = deepmerge(oldCopy, newCopy, { arrayMerge: concatMerge });
    return mergedObject;
}

module.exports.BuildHead = BuildHead;
module.exports.MergeHead = MergeHead;