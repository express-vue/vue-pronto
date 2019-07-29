const fs = require("fs");

/**
 * @param {string | Buffer | URL | number} filePath
 * @param {string | Buffer | DataView} fileContent
 */
module.exports.writeFile = async function(filePath, fileContent) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * @param {string | Buffer | URL | number} filePath
 * @returns {Promise<string>}
 */
module.exports.readFile = async function(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

/**
 * @param {string | Buffer | URL} filePath
 * @param {number} [mode="fs.constants.F.OK"]
 */
module.exports.access = async function(filePath, mode) {
    if (!mode) {
        mode = fs.constants.F_OK;
    }
    return new Promise((resolve, reject) => {
        fs.access(filePath, mode, error => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};

/**
 * @param {string | Buffer | URL} filePath
 * @returns {Promise<boolean>}
 */
module.exports.statIsDirectory = async function(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (error, stats) => {
            if (error) {
                reject(error);
            } else {
                if (stats.isDirectory()) {
                    resolve(true);
                } else {
                    reject(new Error("Is not a directory"));
                }
            }
        });
    });
};
