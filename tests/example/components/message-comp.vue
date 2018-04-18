<template>
  <div class="">
      <h1>{{message}}</h1>
      <p>{{destructure}}</p>
  </div>
</template>

<script>
export default {
    props: ['message'],
    computed: {
        destructure: function() {

            for (const [a, b] of Object.entries({a: "b"})) {
                
            }
        }
    }
}
</script>
