const fs = require("fs");

/**
 * @param {string | Buffer | URL | number} filePath
 * @param {string | Buffer | DataView} fileContent
 */
async function asyncWrite(filePath, fileContent) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * @param {string | Buffer | URL} filePath
 * @param {number} [mode="fs.constants.F.OK"]
 */
async function asyncAccess(filePath, mode) {
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
}

module.exports = {
    asyncWrite,
    asyncAccess,
};
