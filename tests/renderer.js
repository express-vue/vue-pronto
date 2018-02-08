//@ts-check
const test = require("ava");
const path = require("path");
const Pronto = require("../lib");

const vueFile = path.join(__dirname, "example/views/index.vue");

//@ts-ignore
test("String returns with full object", t => {
    const renderer = new Pronto({});
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>",
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        title: "Test",
        template: templateLiteral,
    };

    const expected = `<!DOCTYPE html><html><head><style>.red{color:red}.subcomponent{color:green}.test{color:pink;font-size:20px}</style></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <h2 class="subcomponent">Hello from subcomponent</h2></div> <p>true</p> <div><p class="red">FAKEHTML</p></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul></ul></div></div></div><script>(function () {'use strict';var createApp = function () {return new Vue({data: function(){return {"msg":"Hello world!","messageOuter":"Say Foo","bar":true,"fakehtml":"<p>FAKEHTML</p>"}},components: {foo: {props: {hellodata: {required: true,default: "default"}},data: function(){return {}},components: {subcomponent: {props: {subdata: {required: true,default: "default"}},data: function(){return {}},render: function (){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},staticRenderFns: []}},render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",[_c("h2",[this._v("Hello from "+this._s(this.hellodata))]),this._v(" "),_c("subcomponent",{attrs:{subdata:"subcomponent"}})],1)},staticRenderFns: []},messageComp: {props: ["message"],render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",{},[_c("h1",[this._v(this._s(this.message))])])},staticRenderFns: []},users: {props: ["title","users"],render: function render() {var _vm=this,_h=_vm.$createElement,_c=_vm._self._c||_h;return _c("div",{},[_c("ul",_vm._l(_vm.users,function(user){return _c("li",[_c("a",{staticClass:"test",attrs:{href:"/users/"+user.name}},[_vm._v(_vm._s(user.name))])])}))])},staticRenderFns: []}},mixins: [{methods: {hello: function hello(str) {\n            console.log(str);\n        }}},],render: function render() {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}})],1)},staticRenderFns: []})};if (typeof module !== 'undefined' && module.exports) {module.exports = createApp} else {this.app = createApp()}}).call(this);app.$mount('#app');</script></body></html>`;
    return renderer.RenderToString(vueFile, data, vueOptions)
        .then(rendered => {
            t.is(rendered, expected);
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test("String returns with no object", t => {
    const renderer = new Pronto({});
    const expected = `<!DOCTYPE html><html><head><style>.red{color:red}.subcomponent{color:green}.test{color:pink;font-size:20px}</style></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <h2 class="subcomponent">Hello from subcomponent</h2></div> <p></p> <div></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul></ul></div></div></div><script>(function () {'use strict';var createApp = function () {return new Vue({data: function(){return {"msg":"Hello world!","messageOuter":"Say Foo"}},components: {foo: {props: {hellodata: {required: true,default: "default"}},data: function(){return {}},components: {subcomponent: {props: {subdata: {required: true,default: "default"}},data: function(){return {}},render: function (){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},staticRenderFns: []}},render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",[_c("h2",[this._v("Hello from "+this._s(this.hellodata))]),this._v(" "),_c("subcomponent",{attrs:{subdata:"subcomponent"}})],1)},staticRenderFns: []},messageComp: {props: ["message"],render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",{},[_c("h1",[this._v(this._s(this.message))])])},staticRenderFns: []},users: {props: ["title","users"],render: function render() {var _vm=this,_h=_vm.$createElement,_c=_vm._self._c||_h;return _c("div",{},[_c("ul",_vm._l(_vm.users,function(user){return _c("li",[_c("a",{staticClass:"test",attrs:{href:"/users/"+user.name}},[_vm._v(_vm._s(user.name))])])}))])},staticRenderFns: []}},mixins: [{methods: {hello: function hello(str) {\n            console.log(str);\n        }}},],render: function render() {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}})],1)},staticRenderFns: []})};if (typeof module !== 'undefined' && module.exports) {module.exports = createApp} else {this.app = createApp()}}).call(this);app.$mount('#app');</script></body></html>`;
    return renderer.RenderToString(vueFile, {}, {})
        .then(rendered => {
            t.is(rendered, expected);
        })
        .catch(error => {
            t.fail(error);
        });
});

//@ts-ignore
test.cb("Stream returns with full object", t => {
    const renderer = new Pronto({});
    const data = {
        bar: true,
        fakehtml: "<p class=\"red\">FAKEHTML</p>",
    };
    const templateLiteral = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>{{title}}</title>\n<style>{{css}}</style>\n</head>\n<body>\n<h1>FOOOOO</h1>\n<!--vue-ssr-outlet-->\n</body>\n</html>`;

    const vueOptions = {
        head: {},
        template: templateLiteral,
    };
    const expected = `<!DOCTYPE html><html><head><style>.red{color:red}.subcomponent{color:green}.test{color:pink;font-size:20px}</style></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <h2 class="subcomponent">Hello from subcomponent</h2></div> <p>true</p> <div><p class="red">FAKEHTML</p></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul></ul></div></div></div><script>(function () {'use strict';var createApp = function () {return new Vue({data: function(){return {"msg":"Hello world!","messageOuter":"Say Foo","bar":true,"fakehtml":"<p>FAKEHTML</p>"}},components: {foo: {props: {hellodata: {required: true,default: "default"}},data: function(){return {}},components: {subcomponent: {props: {subdata: {required: true,default: "default"}},data: function(){return {}},render: function (){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},staticRenderFns: []}},render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",[_c("h2",[this._v("Hello from "+this._s(this.hellodata))]),this._v(" "),_c("subcomponent",{attrs:{subdata:"subcomponent"}})],1)},staticRenderFns: []},messageComp: {props: ["message"],render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",{},[_c("h1",[this._v(this._s(this.message))])])},staticRenderFns: []},users: {props: ["title","users"],render: function render() {var _vm=this,_h=_vm.$createElement,_c=_vm._self._c||_h;return _c("div",{},[_c("ul",_vm._l(_vm.users,function(user){return _c("li",[_c("a",{staticClass:"test",attrs:{href:"/users/"+user.name}},[_vm._v(_vm._s(user.name))])])}))])},staticRenderFns: []}},mixins: [{methods: {hello: function hello(str) {\n            console.log(str);\n        }}},],render: function render() {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}})],1)},staticRenderFns: []})};if (typeof module !== 'undefined' && module.exports) {module.exports = createApp} else {this.app = createApp()}}).call(this);app.$mount('#app');</script></body></html>`;
    renderer.RenderToStream(vueFile, data, vueOptions)
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => rendered += chunk);
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
    const renderer = new Pronto({});
    const expected = `<!DOCTYPE html><html><head><style>.red{color:red}.subcomponent{color:green}.test{color:pink;font-size:20px}</style></head><body><div id="app"><div data-server-rendered="true"><h1 class="red">Hello world!</h1> <div><h2>Hello from component</h2> <h2 class="subcomponent">Hello from subcomponent</h2></div> <p></p> <div></div> <h1></h1> <p>Welcome to the  demo. Click a link:</p> <input placeholder="edit me" value="Say Foo"> <button type="button" name="button">Say Foo</button> <div><h1>Say Foo</h1></div> <div><ul></ul></div></div></div><script>(function () {'use strict';var createApp = function () {return new Vue({data: function(){return {"msg":"Hello world!","messageOuter":"Say Foo"}},components: {foo: {props: {hellodata: {required: true,default: "default"}},data: function(){return {}},components: {subcomponent: {props: {subdata: {required: true,default: "default"}},data: function(){return {}},render: function (){var _h=this.$createElement;return(this._self._c||_h)("h2",{staticClass:"subcomponent"},[this._v("Hello from "+this._s(this.subdata))])},staticRenderFns: []}},render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",[_c("h2",[this._v("Hello from "+this._s(this.hellodata))]),this._v(" "),_c("subcomponent",{attrs:{subdata:"subcomponent"}})],1)},staticRenderFns: []},messageComp: {props: ["message"],render: function render() {var _h=this.$createElement,_c=this._self._c||_h;return _c("div",{},[_c("h1",[this._v(this._s(this.message))])])},staticRenderFns: []},users: {props: ["title","users"],render: function render() {var _vm=this,_h=_vm.$createElement,_c=_vm._self._c||_h;return _c("div",{},[_c("ul",_vm._l(_vm.users,function(user){return _c("li",[_c("a",{staticClass:"test",attrs:{href:"/users/"+user.name}},[_vm._v(_vm._s(user.name))])])}))])},staticRenderFns: []}},mixins: [{methods: {hello: function hello(str) {\n            console.log(str);\n        }}},],render: function render() {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('h1',{staticClass:"red"},[_vm._v(_vm._s(_vm.msg))]),_vm._v(" "),_c('foo',{attrs:{"hellodata":"component"}}),_vm._v(" "),_c('p',[_vm._v(_vm._s(_vm.bar))]),_vm._v(" "),_c('div',{domProps:{"innerHTML":_vm._s(_vm.fakehtml)}}),_vm._v(" "),_c('h1',[_vm._v(_vm._s(_vm.title))]),_vm._v(" "),_c('p',[_vm._v("Welcome to the "+_vm._s(_vm.title)+" demo. Click a link:")]),_vm._v(" "),_c('input',{directives:[{name:"model",rawName:"v-model",value:(_vm.messageOuter),expression:"messageOuter"}],attrs:{"placeholder":"edit me"},domProps:{"value":(_vm.messageOuter)},on:{"input":function($event){if($event.target.composing){ return; }_vm.messageOuter=$event.target.value}}}),_vm._v(" "),_c('button',{attrs:{"type":"button","name":"button"},on:{"click":function($event){_vm.hello(_vm.messageOuter)}}},[_vm._v(_vm._s(_vm.messageOuter))]),_vm._v(" "),_c('message-comp',{attrs:{"message":_vm.messageOuter}}),_vm._v(" "),_c('users',{attrs:{"users":_vm.users}})],1)},staticRenderFns: []})};if (typeof module !== 'undefined' && module.exports) {module.exports = createApp} else {this.app = createApp()}}).call(this);app.$mount('#app');</script></body></html>`;
    // @ts-ignore
    renderer.RenderToStream(vueFile, {}, {})
        .then(stream => {
            let rendered = "";
            stream.on("data", chunk => rendered += chunk);
            stream.on("end", () => {
                t.is(rendered, expected);
                t.end();
            });

        })
        .catch(error => {
            t.fail(error);
        });
});
