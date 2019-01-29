//@ts-check
const test = require("ava");
const path = require("path");
const Pronto = require("../lib").ProntoVueify;

const vueFile = path.join("index/index.vue");
const vueFileWithProps = path.join("index/index-with-props.vue");
const rootPath = path.normalize(path.join(__dirname, "../tests/example/views"));
const babelConfig = {
    "presets": [
        ["env", {
            "targets": {
                "browsers": ["last 2 versions"],
            },
        }],
    ],
};
//@ts-ignore
test("String returns with zero config", t => {
    // @ts-ignore
    const renderer = new Pronto({babel: babelConfig});
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };

    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function _default() {
                return [{ name: "default" }];
            }}},"data":function data() { return {"msg":"Hello world!","messageOuter":"Say Foo","bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}; },"components":{"foo":{"props":{"hellodata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"mixins":[{"methods":{"hello":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.sentence))]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    return renderer
        .RenderToString("tests/example/views/index/index.vue", data, vueOptions)
        .then(rendered => {
            t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with some config", t => {
    // @ts-ignore
    const renderer = new Pronto({
        babel: babelConfig,
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

    const expected = `<!DOCTYPE html lang="no"><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function _default() {
                return [{ name: "default" }];
            }}},"data":function data() { return {"msg":"Hello world!","messageOuter":"Say Foo","bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}; },"components":{"foo":{"props":{"hellodata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"mixins":[{"methods":{"hello":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.sentence))]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    return renderer
        .RenderToString("tests/example/views/index/index.vue", data, vueOptions)
        .then(rendered => {
            t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with full object", async t => {
    // @ts-ignore
    const renderer = new Pronto({ rootPath: rootPath, babel: babelConfig });
    const data = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };

    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function _default() {
                return [{ name: "default" }];
            }}},"data":function data() { return {"msg":"Hello world!","messageOuter":"Say Foo","bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}; },"components":{"foo":{"props":{"hellodata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"mixins":[{"methods":{"hello":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.sentence))]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    try {
        const rendered = await renderer.RenderToString(vueFile, data, vueOptions);
        const one = rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; });
        const two = expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; });
        t.is(one, two);
    } catch (error) {
        t.fail(error);
    }
});

//@ts-ignore
test("String returns with no object", t => {
    // @ts-ignore
    const renderer = new Pronto({ rootPath: rootPath, babel: babelConfig });
    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function _default() {
                return [{ name: "default" }];
            }}},"data":function data() { return {"msg":"Hello world!","messageOuter":"Say Foo"}; },"components":{"foo":{"props":{"hellodata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"mixins":[{"methods":{"hello":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.sentence))]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    return renderer
        .RenderToString(vueFile, {}, {})
        .then(rendered => {
            t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with propsData", t => {
    // @ts-ignore
    const renderer = new Pronto({ rootPath: rootPath, babel: babelConfig });
    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v("import fooTransitionExpand from '@foo/styles-animation/src/components/foo-transition-expand.vue';")]),_vm._v(" "),_c('p',[_vm._v("const test = require(\\"foo.vue\\");")]),_vm._v(" "),_c('p',[_vm._v("const bar = require(\\"bar.vue\\");")]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[],"propsData":{}})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    return renderer
        .RenderToString(vueFileWithProps, {}, {propsData: {}})
        .then(rendered => {
            t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
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
    const renderer = new Pronto({ rootPath: rootPath, data: data, babel: babelConfig });

    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        head: {},
        template: templateLiteral,
    };
    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function _default() {
                return [{ name: "default" }];
            }}},"data":function data() { return {"msg":"Hello world!","messageOuter":"Say Foo","bar":true,"fakehtml":"\\u003Cp class=\\"red\\"\\u003EFAKEHTML\\u003C\\u002Fp\\u003E"}; },"components":{"foo":{"props":{"hellodata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"mixins":[{"methods":{"hello":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.sentence))]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    // @ts-ignore
    renderer
        .RenderToStream(vueFile, {}, vueOptions)
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => (rendered += chunk));
            stream.on("end", () => {
                t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
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
    const renderer = new Pronto({ rootPath: rootPath, babel: babelConfig });
    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function _default() {
                return [{ name: "default" }];
            }}},"data":function data() { return {"msg":"Hello world!","messageOuter":"Say Foo"}; },"components":{"foo":{"props":{"hellodata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"mixins":[{"methods":{"hello":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.sentence))]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    // @ts-ignore
    renderer
        .RenderToStream(vueFile, {}, {})
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => (rendered += chunk));
            stream.on("end", () => {
                t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
                t.end();
            });
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test.cb("Stream returns with full propsData", t => {
    // @ts-ignore
    const propsData = {
        bar: true,
        fakehtml: '<p class="red">FAKEHTML</p>',
    };
    const renderer = new Pronto({ rootPath: rootPath, propsData: propsData, babel: babelConfig });

    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        head: {},
        template: templateLiteral,
    };
    const expected = `<!DOCTYPE html><html><head><script src="https://cdn.jsdelivr.net/npm/vue@latest/dist/vue.min.js" ></script><style>.red{color:red}.subcomponent[data-v-123456":function(str) {
            console.log(str);
        }}}],"components":{"subcomponent":{"props":{"subdata":{"default":"default","type":String,"required":true}},"data":function data() { return {}; },"render":function(){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},"_scopeId":"data-v-123456":function(str) {
            console.log(str);
        }}}],"render":function render () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('p',[_vm._v("import fooTransitionExpand from '@foo/styles-animation/src/components/foo-transition-expand.vue';")]),_vm._v(" "),_c('p',[_vm._v("const test = require(\\"foo.vue\\");")]),_vm._v(" "),_c('p',[_vm._v("const bar = require(\\"bar.vue\\");")]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}}),_vm._v(" "),_c('simple')],1)},"staticRenderFns":[]})};"undefined"!=typeof module&&module.exports?module.exports=createApp:this.app=createApp()}).call(this),app.$mount("#app");</script></body></html>`;
    // @ts-ignore
    renderer
        .RenderToStream(vueFileWithProps, {}, vueOptions)
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => (rendered += chunk));
            stream.on("end", () => {
                t.is(rendered.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }), expected.replace(/([\[|\s|\"])data-v-(.*)([\]|\>|\"])/gm, function(match, p1, p2, p3) { return p1 + "data-v-123456" + p3; }));
                t.end();
            });
        })
        .catch(error => {
            t.fail(error);
        });
});
