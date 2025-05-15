<template>
  <div class="screen-container">
    <div class="loading-screen">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <div class="spinner"></div>
      <p>{{message}}</p>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  message: string;
}>();

</script>

<style scoped>
.screen-container{
  width:100vw;
  height: 100vh;
  background-color: #131313;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #131313;
}

.logo {
  width: 50vw;
  max-width: 600px;
  height: auto;
  margin-bottom: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 6px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

p {
  font-size: 1.5em;
  color: #ffffff;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

