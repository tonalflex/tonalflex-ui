<template>
  <div class="bpm-container">
    <button class="arrow" @click="decrease">
      <LeftArrow />
    </button>
    <span class="bpm-display">{{ bpm }} BPM</span>
    <button class="arrow" @click="increase">
      <RightArrow />
    </button>
  </div>
</template>

<script setup lang="ts">
import LeftArrow from "@/components/icons/left-arrow.vue"
import RightArrow from "@/components/icons/right-arrow.vue"

const props = defineProps<{
  bpm: number
}>()

const emit = defineEmits<{
  (e: 'update:bpm', value: number): void
}>()

const increase = () => emit('update:bpm', props.bpm + 1)
const decrease = () => emit('update:bpm', Math.max(1, props.bpm - 1))
</script>

<style scoped>
.bpm-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  font-size: 2rem;
  color: white;
}

.arrow {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color:limegreen;
}

.bpm-display {
  text-align: center;
  padding-left:10px;
  padding-right:10px;
  color: white;
  font-size: 20px;
  transform: scale(1.1);
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
  user-select: none;
}
</style>
