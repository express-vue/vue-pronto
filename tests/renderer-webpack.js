//@ts-check
const test = require("ava");
const path = require("path");
const Pronto = require("../lib").ProntoWebpack;
const fs = require("fs");
const vueFile = path.join("index/index-webpack.vue");
const pagesPath = path.normalize(path.join(__dirname, "../tests/example/views"));
const expectedPath = path.join(__dirname, "expected");
//@ts-ignore
test("String returns with zero config", async t => {
    // @ts-ignore
    const renderer = new Pronto({pagesPath: pagesPath});
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };
    const expectedFile = path.join(expectedPath, "string-zero-config.html");
    const expected = fs.readFileSync(expectedFile).toString();
    return renderer
        .RenderToString("index/index-webpack.vue", data, vueOptions)
        .then(rendered => {
            t.is(rendered, expected);
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with some config", async t => {
    // @ts-ignore
    const renderer = new Pronto({
        pagesPath: pagesPath,
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
    const expectedFile = path.join(expectedPath, "string-some-config.html");
    const expected = fs.readFileSync(expectedFile).toString();
    return renderer
        .RenderToString("index/index-webpack.vue", data, vueOptions)
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
    const renderer = new Pronto({ pagesPath: pagesPath, data: {globalData: true}});
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };
    const expectedFile = path.join(expectedPath, "string-full-config.html");
    const expected = fs.readFileSync(expectedFile).toString();
    try {
        const rendered = await renderer.RenderToString(vueFile, data, vueOptions);
        t.is(rendered, expected);
    } catch (error) {
        t.fail(error);
    }
});

//@ts-ignore
test("String returns with no object", async t => {
    // @ts-ignore
    const renderer = new Pronto({ pagesPath: pagesPath});
    const expectedFile = path.join(expectedPath, "string-zero-object.html");
    const expected = fs.readFileSync(expectedFile).toString();
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
    const renderer = new Pronto({ pagesPath: pagesPath, data: {globalData: true} });

    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        head: {},
        template: templateLiteral,
    };
    const expectedFile = path.join(expectedPath, "stream-full-object.html");
    const expected = fs.readFileSync(expectedFile).toString();
    // @ts-ignore
    renderer
        // @ts-ignore
        .RenderToStream(vueFile, data, vueOptions)
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
    const renderer = new Pronto({ pagesPath: pagesPath });
    const expectedFile = path.join(expectedPath, "stream-no-object.html");
    const expected = fs.readFileSync(expectedFile).toString();
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

// @ts-ignore
test("Bootstrap prerenders", async t => {
    process.env.VUE_DEV = "false";
    const renderer = new Pronto({ pagesPath: pagesPath });
    const result = await renderer.Bootstrap();
    t.is(result, true);
});

// @ts-ignore
test("Bootstrap does not prerender", async t => {
    process.env.VUE_DEV = "true";
    const renderer = new Pronto({ pagesPath: pagesPath });
    const result = await renderer.Bootstrap();
    t.is(result, false);
});
