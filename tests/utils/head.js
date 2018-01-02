const test = require("ava");
const Utils = require("../lib/utils");


test.cb('General Head', t => {
    const head = {
        meta: [
            { name: 'application-name', content: 'Name of my application' },
            { name: 'description', content: 'A description of the page', id: 'desc' },
            { name: 'twitter:title', content: 'Content Title' },
            { property: 'fb:app_id', content: '123456789' },
            { property: 'og:title', content: 'Content Title' },
            { script: '/assets/scripts/hammer.min.js' },
            { script: '/assets/scripts/vue-touch.min.js', charset: 'utf-8' },
            { style: '/assets/rendered/style.css' },
            { style: '/assets/rendered/style.css', type: 'text/css' },
            { rel: 'icon', type: 'image/png', href: '/assets/favicons/favicon-32x32.png', sizes: '32x32' }
        ]
    } 
    const expected = `<meta name="application-name" content="Name of my application" /><meta name="description" content="A description of the page" id="desc" /><meta name="twitter:title" content="Content Title" /><meta property="fb:app_id" content="123456789" /><meta property="og:title" content="Content Title" /><script src="/assets/scripts/hammer.min.js" charset="utf-8" /><script src="/assets/scripts/vue-touch.min.js" charset="utf-8" /><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" /><link rel="stylesheet" href="/assets/rendered/style.css" type="text/css" /><link rel="icon" type="image/png" href="/assets/favicons/favicon-32x32.png" sizes="32x32" />`
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
})

test.cb('Script Head', t => {
    const head = {
        meta: [
            { script: '/assets/scripts/hammer.min.js' },
            { script: '/assets/scripts/vue-touch.min.js', charset: 'utf-8' },
            { script: '/assets/scripts/hammer.min.js', async: true },
            { script: '/assets/scripts/hammer.min.js', defer: true },
            { script: '/assets/scripts/hammer.min.js', defer: true, async: true },
        ]
    }
    const expected = `<script src="/assets/scripts/hammer.min.js" charset="utf-8" /><script src="/assets/scripts/vue-touch.min.js" charset="utf-8" /><script src="/assets/scripts/hammer.min.js" charset="utf-8" async /><script src="/assets/scripts/hammer.min.js" charset="utf-8" defer /><script src="/assets/scripts/hammer.min.js" charset="utf-8" async defer />`
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end()
})

test.cb('Head Title', t => {
    const head = {
        title: "Test Title"
    }
    const expected = `<title>Test Title</title>`;
    const result = Utils.BuildHead(head);
    t.is(result, expected);
    t.end();
});