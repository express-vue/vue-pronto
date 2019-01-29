//@ts-check
const test = require("ava");
const path = require("path");
const Pronto = require("../lib").ProntoWebpack;

const vueFile = path.join("index/index-webpack.vue");
const vueFileWithProps = path.join("index/index-with-props.vue");
const rootPath = path.normalize(path.join(__dirname, "../tests/example/views"));

//@ts-ignore
test("String returns with zero config", t => {
    // @ts-ignore
    const renderer = new Pronto();
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };

    const expected = `<!DOCTYPE html><html><head><script>window.__INITIAL_STATE__ = {"bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}</script></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <button type="button" name="button">component</button> <h2 class="subcomponent" data-v-2fafd565>Hello from subcomponent</h2></div> <p>true</p> <div><p class="red">FAKEHTML</p></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <p></p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul><li><a href="/users/default" class="test">default</a></li></ul></div> <div><p class="simple">Hello From Component in node_modules</p></div></div></div><script src="/expressvue/bundles/index-webpack.vue.client.js"></script></body></html>`;
    return renderer
        .RenderToString("tests/example/views/index/index-webpack.vue", data, vueOptions)
        .then(rendered => {
            t.is(rendered, expected);
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with some config", t => {
    // @ts-ignore
    const renderer = new Pronto({
        template: {
            html: {
                start: '<!DOCTYPE html lang="no"><html>',
            },
            body: {
                start: '<body id="foo">',
            },
        },
    });
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };

    const vueOptions = {
        title: "Test",
    };

    const expected = `<!DOCTYPE html lang="no"><html><head><script>window.__INITIAL_STATE__ = {"bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}</script></head><body id="foo"><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <button type="button" name="button">component</button> <h2 class="subcomponent" data-v-2fafd565>Hello from subcomponent</h2></div> <p>true</p> <div><p class="red">FAKEHTML</p></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <p></p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul><li><a href="/users/default" class="test">default</a></li></ul></div> <div><p class="simple">Hello From Component in node_modules</p></div></div></div><script src="/expressvue/bundles/index-webpack.vue.client.js"></script></body></html>`;
    return renderer
        .RenderToString("tests/example/views/index/index-webpack.vue", data, vueOptions)
        .then(rendered => {
            t.is(rendered, expected);
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with full object", async t => {
    // @ts-ignore
    const renderer = new Pronto({ rootPath: rootPath});
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };

    const expected = `<!DOCTYPE html><html><head><script>window.__INITIAL_STATE__ = {"bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}</script></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <button type="button" name="button">component</button> <h2 class="subcomponent" data-v-2fafd565>Hello from subcomponent</h2></div> <p>true</p> <div><p class="red">FAKEHTML</p></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <p></p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul><li><a href="/users/default" class="test">default</a></li></ul></div> <div><p class="simple">Hello From Component in node_modules</p></div></div></div><script src="/expressvue/bundles/index-webpack.vue.client.js"></script></body></html>`;
    try {
        const rendered = await renderer.RenderToString(vueFile, data, vueOptions);
        t.is(rendered, expected);
    } catch (error) {
        t.fail(error);
    }
});

//@ts-ignore
test("String returns with no object", t => {
    // @ts-ignore
    const renderer = new Pronto({ rootPath: rootPath});
    const expected = `<!DOCTYPE html><html><head><script>window.__INITIAL_STATE__ = {}</script></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <button type="button" name="button">component</button> <h2 class="subcomponent" data-v-2fafd565>Hello from subcomponent</h2></div> <p></p> <div></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <p></p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul><li><a href="/users/default" class="test">default</a></li></ul></div> <div><p class="simple">Hello From Component in node_modules</p></div></div></div><script src="/expressvue/bundles/index-webpack.vue.client.js"></script></body></html>`;
    return renderer
        .RenderToString(vueFile, {}, {})
        .then(rendered => {
            t.is(rendered, expected);
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test.cb("Stream returns with full object", t => {
    // @ts-ignore
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const renderer = new Pronto({ rootPath: rootPath, data: data });

    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        head: {},
        template: templateLiteral,
    };
    const expected = `<!DOCTYPE html><html><head><script>window.__INITIAL_STATE__ = {}</script></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <button type="button" name="button">component</button> <h2 class="subcomponent" data-v-2fafd565>Hello from subcomponent</h2></div> <p></p> <div></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <p></p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul><li><a href="/users/default" class="test">default</a></li></ul></div> <div><p class="simple">Hello From Component in node_modules</p></div></div></div><script src="/expressvue/bundles/index-webpack.vue.client.js"></script></body></html>`;
    // @ts-ignore
    renderer
        // @ts-ignore
        .RenderToStream(vueFile, {}, vueOptions)
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => (rendered += chunk));
            stream.on("end", () => {
                t.is(rendered, expected);
                t.end();
            });
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test.cb("Stream returns with no object", t => {
    // @ts-ignore
    const renderer = new Pronto({ rootPath: rootPath });
    const expected = `<!DOCTYPE html><html><head><script>window.__INITIAL_STATE__ = {}</script></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <button type="button" name="button">component</button> <h2 class="subcomponent" data-v-2fafd565>Hello from subcomponent</h2></div> <p></p> <div></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <p></p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul><li><a href="/users/default" class="test">default</a></li></ul></div> <div><p class="simple">Hello From Component in node_modules</p></div></div></div><script src="/expressvue/bundles/index-webpack.vue.client.js"></script></body></html>`;
    // @ts-ignore
    renderer
        // @ts-ignore
        .RenderToStream(vueFile, {}, {})
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => (rendered += chunk));
            stream.on("end", () => {
                t.is(rendered, expected);
                t.end();
            });
        })
        .catch(error => {
            t.fail(error);
        });
});
