<template>
    <div class="spinner">
      <div class="spinner small"></div>  
      <h2>Loading</h2>
    </div>
</template>

<style scoped>
.spinner{
    display: flex;
    flex-direction: column;
    gap: 15px;
    color: white;
}

.spinner.small {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid limegreen;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>