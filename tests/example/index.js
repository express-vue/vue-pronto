const express = require("express");
const app = express();
const path = require("path");
const ExpressVue = require("./express");
const axios = require("axios").default;

const evrOptions = {
    rootPath: path.normalize(path.join(__dirname, "views")),
    data: {
        foo: true,
    },
    head: {
        title: "Test",
    },
};

const ev = ExpressVue.init(evrOptions);
app.use(ev);

app.get("/", function(req, res) {
    axios.get("http://loremricksum.com/api/?paragraphs=4&quotes=1")
        .then(result => {
            const sentence = `one
            two
            three
            four five`;
            const data = {
                bar: true,
                quotes: result.data.data,
                sentence: sentence,
                fakehtml: "<p class=\"red\">FAKEHTML</p>",
            };

            const vueOptions = {
                plugins: [
                    { name: "vue-easy-toast", options: {} },
                ],
                head: {
                    title: "Test2",
                    metas: [
                        {property: "og:title", content: "pageTitle"},
                        {name: "twitter:title", content: "pageTitle"},
                        {name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"},
                    ],
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
                },
            };
            res.renderVue("index/index.vue", data, vueOptions);
        });
});

app.get("/example2", function(req, res) {
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>",
    };

    const vueOptions = {
        head: {
            title: "Test",
            scripts: [
                { src: "https://unpkg.com/vue@2.4.4/dist/vue.js" },
            ],
        },
        layout: {
        },
    };
    res.renderVue("../example2/views/index.vue", data, vueOptions);
});

app.listen(3000, function() {
    // tslint:disable-next-line:no-console
    console.log("Example app listening on port 3000!");
});
