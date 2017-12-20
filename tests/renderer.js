//@ts-check
const test = require("ava");
const path = require("path");
const Renderer = require("../lib");

const renderer = new Renderer({});

const vueFile = path.join(__dirname, "example/test.vue");
const data = {
    bar: true,
    fakehtml: "<p class=\"red\">FAKEHTML</p>"
}
const templateLiteral = `<!DOCTYPE html>
<html lang="en">
    <head>
        <title>{{title}}</title>
        <style>{{css}}</style>
    </head>
    <body>
        <h1>FOOOOO</h1>
        <!--vue-ssr-outlet-->
    </body>
</html>`
const vueOptions = {
    title: "Test",
    template: templateLiteral
};

const result = `<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Test</title>
        <style>
.red {
  color: #f00;
}
</style>
    </head>
    <body>
        <h1>FOOOOO</h1>
        <h1 data-server-rendered="true" class="red">Hello world!</h1>
    </body>
</html>`

//@ts-ignore
test('String returns with full object', t => {
    return renderer.RenderToString(vueFile, data, vueOptions)
        .then(rendered => {

            t.is(rendered, result);
        })
        .catch(error => {
            t.error(error);
        })
})
