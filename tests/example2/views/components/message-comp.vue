<template>
  <div class="">
      <h1>{{message}}</h1>
  </div>
</template>

<script>
import inner from './inner.vue';
export default {
    props: ['message'],
    components: {
        inner
    }
}
</script>

<style lang="css">
</style>
