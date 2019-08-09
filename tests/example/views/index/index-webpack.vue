<template>
  <div>
    <h1 class="red">{{msg}}</h1>
    <foo hellodata="component"></foo>
    <p>{{bar}}</p>
    <div v-html="fakehtml"></div>
    <h1>{{title}}</h1>
    <p>Welcome to the {{title}} demo. Click a link:</p>
    <p>{{sentence}}</p>
    <input v-model="messageOuter" placeholder="edit me">
    <button type="button" name="button" v-on:click="hello(messageOuter)">{{messageOuter}}</button>
    <message-comp :message="messageOuter"></message-comp>
    <users :users="users"></users>
    <simple></simple>
  </div>
</template>

<script>
import axios from "axios";
import foo from "../../components/component.vue";
import messageComp from '../../components/message-comp.vue';
import users from '../../components/users.vue';
import helloMixin from '../../mixins/exampleMixin.js';
import simple from 'simple-vue-component-test/simple.vue';
export default {
    props: {
        title: {
            type: String,
            default: ""
        },
        users: {
            type: Array,
            default: function() {
                return [{name: "default"}];
            }
        }
    },
    data: function () {
        return {
            bar: false,
            sentence: '',
            fakehtml: '',
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
    mixins: [helloMixin]
}
</script>

<style>
  .red {
    color: #f00;
  }
</style>
