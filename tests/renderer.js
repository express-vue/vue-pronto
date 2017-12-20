//@ts-check
const test = require("ava");
const path = require("path");
const Pronto = require("../lib");

const vueFile = path.join(__dirname, "example/test2.vue");


//@ts-ignore
test('String returns with full object', t => {
    const renderer = new Pronto({});
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>"
    }
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`
    
    const vueOptions = {
        title: "Test",
        template: templateLiteral
    };
    const resultFull = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>Test</title>\n<style>\n.red {\n  color: #f00;\n}\n</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <h2>Hello from subcomponent</h2></div> <p>true</p> <div><p class="red">FAKEHTML</p></div></div>\n</body>\n</html>`
    return renderer.RenderToString(vueFile, data, vueOptions)
        .then(rendered => {
            t.is(rendered, resultFull);
        })
        .catch(error => {
            t.error(error);
        })
})

//@ts-ignore
test('String returns with no object', t => {
    const renderer = new Pronto({});
    const resultHalf = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title></title>\n<style>\n.red {\n  color: #f00;\n}\n</style>\n</head>\n<body>\n<div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <h2>Hello from subcomponent</h2></div> <p></p> <div></div></div>\n</body>\n</html>`
    return renderer.RenderToString(vueFile, {}, {})
        .then(rendered => {
            t.is(rendered, resultHalf);
        })
        .catch(error => {
            t.error(error);
        })
})