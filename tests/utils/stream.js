const test = require("ava");
const {StreamUtils} = require("../../lib/utils");

const htmlStream = new StreamUtils("foo", "bar");

test("it should have a head", t => {
    t.is(htmlStream.head , "foo");
});

test("it should have a tail", t => {
    t.is(htmlStream.tail, "bar");
});

test.cb("it should end", t => {
    htmlStream._transform(Buffer.from("qux"), "utf-8", () => {
        t.pass();
        t.end();
    });
});
