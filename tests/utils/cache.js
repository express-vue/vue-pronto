const test = require("ava");
const {Cache} = require("../../lib/utils");

test("Default Cache", t => {
    const cache = new Cache();
    cache.set("foo", "bar");
    const result = cache.get("foo");
    t.is(result, "bar");
});

test("Default Cache Error", t => {
    const cache = new Cache();
    cache.set("foo", "bar");
    const result = cache.get("foos");
    t.is(result, undefined);
});
