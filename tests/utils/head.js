const test = require("ava");
const Utils = require("../../lib/utils");

test.cb("General Head", t => {
    const head = {
        metas: [
            { name: "application-name", content: "Name of my application" },
            { name: "description", content: "A description of the page", id: "desc" },
            { name: "twitter:title", content: "Content Title" },
            { property: "fb:app_id", content: "123456789" },
            { property: "og:title", content: "Content Title" },
            { rel: "icon", type: "image/png", href: "/assets/favicons/favicon-32x32.png", sizes: "32x32" },
        ],
        scripts: [
            { src: "/assets/scripts/hammer.min.js" },
            { src: "/assets/scripts/vue-touch.min.js", charset: "utf-8" },
        ],
        styles: [
            { style: "/assets/rendered/style.css" },
            { style: "/assets/rendered/style.css", type: "text/css" },
        ],
    };
    const expected = `<meta name="application-name" content="Name of my application" /><meta name="description" content="A description of the page" id="desc" /><meta name="twitter:title" content="Content Title" /><meta property="fb:app_id" content="123456789" /><meta property="og:title" content="Content Title" /><link rel="icon" type="image/png" href="/assets/favicons/favicon-32x32.png" sizes="32x32" /><script src="/assets/scripts/hammer.min.js" ></script><script charset="utf-8" src="/assets/scripts/vue-touch.min.js" ></script><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" /><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" />`;
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
});

test.cb("Script Head", t => {
    const head = {
        scripts: [
            { src: "/assets/scripts/hammer.min.js" },
            { src: "/assets/scripts/hammer.min.js", type: "text/javascript" },
            { src: "/assets/scripts/vue-touch.min.js", charset: "utf-8" },
            { src: "/assets/scripts/hammer.min.js", async: true },
            { src: "/assets/scripts/hammer.min.js", defer: true },
            { src: "/assets/scripts/hammer.min.js", defer: true, async: true },
        ],
    };
    const expected = `<script src="/assets/scripts/hammer.min.js" ></script><script type="text/javascript" src="/assets/scripts/hammer.min.js" ></script><script charset="utf-8" src="/assets/scripts/vue-touch.min.js" ></script><script src="/assets/scripts/hammer.min.js" async ></script><script src="/assets/scripts/hammer.min.js" defer ></script><script src="/assets/scripts/hammer.min.js" async defer ></script>`;
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
});

test.cb("Style Head", t => {
    const head = {
        styles: [
            { style: "/assets/rendered/style.css" },
            { style: "/assets/rendered/style.css", type: "text/css" },
            { src: "/assets/rendered/style.css" },
            { src: "/assets/rendered/style.css", type: "text/css" },
        ],
    };
    const expected = `<link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" /><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" /><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" /><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" />`;
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
});

test.cb("Head Title", t => {
    const head = {
        title: "Test Title",
    };
    const expected = `<title>Test Title</title>`;
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
});

test.cb("Structured Data", t => {
    const head = {
        structuredData: {
            "@context": "http://schema.org",
            "@type": "Organization",
            "url": "http://www.your-company-site.com",
            "contactPoint": [{
                "@type": "ContactPoint",
                "telephone": "+1-401-555-1212",
                "contactType": "customer service",
            }],
        },
    };
    const expected = `<script type="application/ld+json">{"@context":"http://schema.org","@type":"Organization","url":"http://www.your-company-site.com","contactPoint":[{"@type":"ContactPoint","telephone":"+1-401-555-1212","contactType":"customer service"}]}</script>`;
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
});

test.cb("Meta Error", t => {
    const head = {
        meta: [
            { src: "/assets/scripts/hammer.min.js" },
        ],
    };

    const error = t.throws(() => {
        Utils.BuildHead(head);
    }, Error);
    const expected = "WARNING - DEPRECATED: It looks like you're using the old meta object, please migrate to the new one";
    t.is(error.message, expected);
    t.end();
});
