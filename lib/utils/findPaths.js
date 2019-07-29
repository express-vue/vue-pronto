// @ts-check
const path = require("path");
// @ts-ignore
const nodeModules = require("find-node-modules");

/**
 * @param {string | undefined} [rootPath]
 * @returns {string}
 */
function findRootPath(rootPath) {
    if (!rootPath) {
        const currentPath = path.resolve(__dirname);
        const nodeModulesPath = findNodeModules(currentPath);
        rootPath = path.resolve(nodeModulesPath, "../");
    }

    return rootPath;
}
/**
 * @param {String} cwdPath
 * @returns {String}
 */
function findNodeModules(cwdPath) {
    const nodeModulesPath = nodeModules({cwd: cwdPath});
    const nodeModulesPathResolved = path.join(cwdPath, nodeModulesPath[0]);
    return nodeModulesPathResolved;
}

module.exports.findRootPath = findRootPath;
module.exports.findNodeModules = findNodeModules;
