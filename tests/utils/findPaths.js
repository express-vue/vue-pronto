const test = require("ava");
const path = require("path");
const Utils = require("../../lib/utils");

test("FindRootPath no root", t => {
    const rootPath = Utils.FindRootPath();
    const expected = path.resolve(__dirname, "../../");
    t.is(rootPath, expected);
});

test("FindRootPath with root", t => {
    const rootPath = Utils.FindRootPath(__dirname);
    const expected = path.resolve(__dirname);
    t.is(rootPath, expected);
});

test("FindNodeModules", t => {
    const nodeModulesPath = Utils.FindNodeModules(__dirname);
    const expected = path.resolve(__dirname, "../../node_modules");
    t.is(nodeModulesPath, expected);
});
