<script setup lang="ts">
// import { RouterView } from 'vue-router';
import DashBoard from '@/views/AppDashboard.vue'
</script>

<template>
  <div id="app">
    <DashBoard />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #131313
}
</style>
