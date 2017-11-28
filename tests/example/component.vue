<template>
  <h2>Hello from {{hellodata}}</h2>
</template>
 
<script>
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
    }
  }
</script> 