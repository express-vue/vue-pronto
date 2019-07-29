const test = require("ava");
const {vueVersion} = require("../../lib/utils");

test("VueVersion no version", t => {
    const version = vueVersion();

    let vuePackageVersion = "latest";
    const expected = `https://cdn.jsdelivr.net/npm/vue@${vuePackageVersion}/dist/vue.min.js`;

    t.is(version.script.src, expected);
});

test("VueVersion with version", t => {
    const version = vueVersion("2.2.2");
    const expected = "https://cdn.jsdelivr.net/npm/vue@2.2.2/dist/vue.min.js";
    t.is(version.script.src, expected);
});

test("VueVersion disabled", t => {
    const version = vueVersion({disabled: true});
    t.is(version.enabled, false);
});
