<template>
  <div>
    <p>Welcome to the demo. Click a link:</p>
    <p>{{msg}}</p>
  </div>
</template>
 
<script>
// import foo from "../../components/component.vue";
// import messageComp from '../../components/message-comp.vue';
// import users from '../../components/users.vue';
// import helloMixin from '../../mixins/exampleMixin.js';
// import simple from 'simple-vue-component-test/simple.vue';
export default {
    data: function () {
        return {
            msg: 'Hello world!',
            messageOuter: 'Say Foo'
        }
    }
}
</script>

 