const test = require("ava");
const path = require("path");
const {findRootPath, findNodeModules} = require("../../lib/utils");

test("FindRootPath no root", t => {
    const rootPath = findRootPath();
    const expected = path.resolve(__dirname, "../../");
    t.is(rootPath, expected);
});

test("FindRootPath with root", t => {
    const rootPath = findRootPath(__dirname);
    const expected = path.resolve(__dirname);
    t.is(rootPath, expected);
});

test("FindNodeModules", t => {
    const nodeModulesPath = findNodeModules(__dirname);
    const expected = path.resolve(__dirname, "../../node_modules");
    t.is(nodeModulesPath, expected);
});
