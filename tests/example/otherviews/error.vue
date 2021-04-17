<template>
  <div>
    <h1 class="blue">{{msg}}</h1>
    <foo hellodata="component"></foo>
  </div>
</template>
 
<script>
import foo from "../components/copy/component.vue";
export default {
    data: function () {
        return {
            msg: 'Hello world!',
            messageOuter: 'Say Foo'
        }
    },
    components: {
        foo
    }
}
</script>
 
<style>
  .blue {
    color: #00f;
  }
</style> 
 