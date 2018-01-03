<template>
  <h2>Hello from {{subdata}}</h2>
</template>
 
<script>
  module.exports = {
    props: {
      subdata: {
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