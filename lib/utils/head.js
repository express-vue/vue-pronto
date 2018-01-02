// @ts-check

/**
 * BuildHead takes the array and splits it up for processing
 * @param {Object} metaObject 
 * @returns {String}
 */
function BuildHead(metaObject = {}) {
    let finalString = "";
    if (metaObject.title) {
        finalString += `<title>${metaObject.title}</title>`;
    }

    if (metaObject.meta) {
        for (let index = 0; index < metaObject.meta.length; index++) {
            const headItem = metaObject.meta[index];
            const processedItem = ProcessItem(headItem);
            if (processedItem !== undefined) {
                finalString += processedItem;
            }
        }
    }

    return finalString;
}

/**
 * 
 * @param {Object} itemObject 
 * @returns {String}
 */
function ProcessItem(itemObject) {
    let finalString = "";

    if (itemObject.script) {
        const src = itemObject.script;
        let extras = "";
        delete itemObject.script;
        if (!itemObject.charset) {
            itemObject.charset = "utf-8";
        }
        if (itemObject.async || itemObject.defer) {
            if (itemObject.async) {
                extras += " async";
                delete itemObject.async;
            }
            if (itemObject.defer) {
                extras += " defer";
                delete itemObject.defer;
            }
        }
        finalString = `<script src="${src}"${KeysToString(itemObject)}${extras} />`;
    } else if(itemObject.style) {
        const href = itemObject.style;
        delete itemObject.style;
        if (!itemObject.type) {
            itemObject.type = "text/css";
        }
        finalString = `<link rel="stylesheet" href="${href}"${KeysToString(itemObject)} />`;
    } else if(itemObject.rel) {
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

module.exports = BuildHead;