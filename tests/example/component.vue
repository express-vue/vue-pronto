<template>
  <div>
    <h2>Hello from {{hellodata}}</h2>
  <subcomponent subdata="subcomponent"></subcomponent>
  </div>
  
</template>
 
<script>
  const subcomponent = require('./subcomponent.vue');
  module.exports = {
    props: {
      hellodata: {
        default: "default",
        type: String,
        required: true
      }
    },
    data: function () {
      return {
      }
    },
    components: {
      subcomponent
    }
  }
</script> 