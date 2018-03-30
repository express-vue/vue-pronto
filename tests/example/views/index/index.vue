<template>
  <div>
    <h1 class="red">{{msg}}</h1>
    <foo hellodata="component"></foo>
    <p>{{bar}}</p>
    <div v-html="fakehtml"></div>
    <h1>{{title}}</h1>
    <p>Welcome to the {{title}} demo. Click a link:</p>
    <p>import fooTransitionExpand from '@foo/styles-animation/src/components/foo-transition-expand.vue';</p>
    <p>const test = require("foo.vue");</p>
    <p>const bar = require("bar.vue");</p>
    <input v-model="messageOuter" placeholder="edit me">
    <button type="button" name="button" v-on:click="hello(messageOuter)">{{messageOuter}}</button>
    <message-comp :message="messageOuter"></message-comp>
    <users :users="users"></users>
    <simple></simple>
  </div>
</template>
 
<script>
import foo from "../../components/component.vue";
import messageComp from '../../components/message-comp.vue';
import users from '../../components/users.vue';
import helloMixin from '../../mixins/exampleMixin.js';
import simple from 'simple-vue-component-test/simple.vue';
export default {
    data: function () {
        return {
            msg: 'Hello world!',
            messageOuter: 'Say Foo'
        }
    },
    components: {
        foo,
        messageComp,
        users,
        simple
    },
    mixins: [helloMixin],
    methods: {
        toast: function() {
            Vue.toast("fdfdf");
        }
    }
}
</script>
 
<style>
  .red {
    color: #f00;
  }
</style> 
 