const express = require('express');
const app = express();
const path = require("path");
const renderer = require("./express");

const evrOptions = {
    rootPath: path.normalize(__dirname)
}

const evr = renderer.init(evrOptions);
app.use(evr);

app.get('/', function (req, res) {
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>"
    }

    const vueOptions = {
        head: {
            title: "Test",
            meta: [
                { script: 'https://unpkg.com/vue@2.4.4/dist/vue.js' }
            ]
        },
        layout: {
        }
    };
    res.renderVue("test2.vue", data, vueOptions); 
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})