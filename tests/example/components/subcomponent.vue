<template>
  <h2 class="subcomponent">Hello from {{subdata}}</h2>
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

<style scoped>
.subcomponent {
    color: green;
}
h2 {
  font-size: 40px;
}
</style>
