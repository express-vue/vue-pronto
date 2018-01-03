<style>
  .red {
    color: #f00;
  }
</style> 
 
<template>
  <div>
    <h1 class="red">{{msg}}</h1>
    <foo hellodata="component"></foo>
    <p>{{bar}}</p>
    <div v-html="fakehtml"></div>
  </div>
</template>
 
<script>
  import foo from "./components/component.vue";
  export default {
    data: function () {
      return {
        msg: 'Hello world!'
      }
    },
    components: {
      foo
    }
  }
</script> 