<template>
  <div class="toggle">
    <div
      v-if="ledImage"
      class="led-sprite"
      :style="{
        backgroundImage: `url('${ledImage}')`,
        backgroundPosition: `0px ${!modelValue ? `-${ledFrameHeight}px` : '0px'}`,
        backgroundSize: '100% auto'
      }"
    ></div> 
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  modelValue: boolean;
  ledImage?: string; 
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const frameHeight = 50;
const ledFrameHeight = 20;

function onChange(e: Event) {
  const target = e.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}

function toggle() {
  emit("update:modelValue", !props.modelValue);
}
</script>

<style scoped>
.toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Toggle background sprite */
.toggle-sprite {
  width: 50px; /* one frame width */
  height: 50px; /* one frame height */
  background-repeat: no-repeat;
  background-size: 100% auto;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  outline: none;
}

.led-sprite {
  width: 20px;
  height: 20px;
  background-repeat: no-repeat;
  background-size: 100% auto;
}

/* Fallback checkbox input */
.toggle-input {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

/* Label text under toggle */
.label-text {
  width: 50px;
  font-size: 0.65rem;
  font-weight: 500;
  text-align:center;
}
</style>