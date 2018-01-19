<template>
  <div>
    <h1 class="red">{{msg}}</h1>
    <foo hellodata="component"></foo>
    <p>{{bar}}</p>
    <div v-html="fakehtml"></div>
    <h1>{{title}}</h1>
    <p>Welcome to the {{title}} demo. Click a link:</p>
    
    <input v-model="messageOuter" placeholder="edit me">
    <button type="button" name="button" v-on:click="hello(messageOuter)">{{messageOuter}}</button>
    <message-comp :message="messageOuter"></message-comp>
    <users :users="users"></users>
  </div>
</template>
 
<script>
import foo from "../components/component.vue";
import messageComp from '../components/message-comp.vue';
import users from '../components/users.vue';
import exampleMixin from '../mixins/exampleMixin.js';
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
        users
    },
    mixins: [exampleMixin]
}
</script>
 
<style>
  .red {
    color: #f00;
  }
</style> 
 