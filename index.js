const express = require('express')
const app = express()
const path = require("path");
const renderer = require("./renderer");

app.get('/', function (req, res) {
    const vuefile = path.join(__dirname, "test2.vue")
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>"
    }
    renderer.renderToString(vuefile, data).then(html => {
        res.send(html);
    }).catch(error => {
        res.send(error);
    })
  
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})