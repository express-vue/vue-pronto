const test = require("ava");
const path = require("path");
const Utils = require("../../lib/utils");

test("VueVersion no version", t => {
    const vueVersion = Utils.VueVersion();

    let vuePackageVersion = require("../../package.json").dependencies.vue;
    if (vuePackageVersion.includes("^")) { vuePackageVersion = vuePackageVersion.replace("^", ""); }
    const expected = `https://cdn.jsdelivr.net/npm/vue@${vuePackageVersion}/dist/vue.min.js`;

    t.is(vueVersion.script.src, expected);
});

test("VueVersion with version", t => {
    const vueVersion = Utils.VueVersion("2.2.2");
    const expected = "https://cdn.jsdelivr.net/npm/vue@2.2.2/dist/vue.min.js";
    t.is(vueVersion.script.src, expected);
});

test("VueVersion disabled", t => {
    const vueVersion = Utils.VueVersion({disabled: true});
    t.is(vueVersion.enabled, false);
});
