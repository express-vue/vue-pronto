const express = require('express');
const app = express();
const path = require("path");
const ExpressVue = require("./express");

const evrOptions = {
    rootPath: path.normalize(__dirname),
    head: {
        title: "Test",
        scripts: [
            { src: 'https://unpkg.com/vue@2.4.4/dist/vue.js' }
        ]
    }
}

const ev = ExpressVue.init(evrOptions);
app.use(ev);

app.get('/', function (req, res) {
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>"
    }

    const vueOptions = {
        head: {
            title: "Test2",
            meta: [
                {property: 'og:title',content: "pageTitle"},
                {name: 'twitter:title',content: "pageTitle"}, 
                {name: 'viewport',content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'}
            ],
            structuredData: {
                '@context': 'http://schema.org',
                '@type': 'Organization',
                'url': 'http://www.your-company-site.com',
                'contactPoint': [{
                    '@type': 'ContactPoint',
                    'telephone': '+1-401-555-1212',
                    'contactType': 'customer service'
                }]
            }
        }
    };
    res.renderVue("test2.vue", data, vueOptions); 
})

app.get('/example2', function (req, res) {
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>"
    }

    const vueOptions = {
        head: {
            title: "Test",
            scripts: [
                { src: 'https://unpkg.com/vue@2.4.4/dist/vue.js' }
            ]
        },
        layout: {
        }
    };
    res.renderVue("example2/views/index.vue", data, vueOptions); 
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})