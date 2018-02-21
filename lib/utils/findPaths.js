// @ts-check
const path = require("path");
// @ts-ignore
const findNodeModules = require("find-node-modules");

/**
 * @param {String} rootPath
 * @returns {String}
 */
function FindRootPath(rootPath) {
    if (!rootPath) {
        const currentPath = path.resolve(__dirname);
        const nodeModulesPath = FindNodeModules(currentPath);
        rootPath = path.resolve(nodeModulesPath, "../");
    }

    return rootPath;
}
/**
 * @param {String} cwdPath
 * @returns {String}
 */
function FindNodeModules(cwdPath) {
    const nodeModulesPath = findNodeModules({cwd: cwdPath});
    const nodeModulesPathResolved = path.join(cwdPath, nodeModulesPath[0]);
    return nodeModulesPathResolved;
}

module.exports.FindRootPath = FindRootPath;
module.exports.FindNodeModules = FindNodeModules;
