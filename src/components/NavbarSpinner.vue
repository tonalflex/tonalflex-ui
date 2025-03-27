<template>
  <div class="navbar-spinner">
    <div
      class="spinner-track"
      :style="{
        transform: `translateX(-${(modelValue + 1) * 33.3333}vw)`,
        transition: 'transform 0.3s ease',
      }"
    >
      <div
        v-for="(item, index) in paddedItems"
        :key="index"
        class="spinner-item"
        :class="{
          current: index === modelValue + 1,
          prev: index === modelValue,
          next: index === modelValue + 2,
          phantom: item === null
        }"
        @click="handleClick(index - 1)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  items: string[];
  modelValue: number;
}>();

const emit = defineEmits(['update:modelValue']);

// Create padded list: [null, ...items, null]
const paddedItems = computed(() => [null, ...props.items, null]);

const handleClick = (realIndex: number) => {
  if (
    realIndex >= 0 &&
    realIndex < props.items.length &&
    realIndex !== props.modelValue
  ) {
    emit('update:modelValue', realIndex);
  }
};
</script>

<style scoped>
.navbar-spinner {
  width: 100%;
  height: 50px;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner-track {
  display: flex;
  height: 100%;
  width: fit-content;
}

.spinner-item {
  width: 33.3333vw;
  text-align: center;
  line-height: 50px;
  font-size: 16px;
  font-weight: bold;
  color: #999;
  user-select: none;
  transition: all 0.3s ease;
  opacity: 0.4;
  transform: scale(0.9);
  pointer-events: none;
  flex-shrink: 0;
}

.spinner-item.prev,
.spinner-item.next {
  opacity: 0.6;
  transform: scale(0.95);
  pointer-events: auto;
  cursor: pointer;
}

.spinner-item.current {
  color: white;
  opacity: 1;
  font-size: 20px;
  transform: scale(1.1);
  pointer-events: auto;
}

.spinner-item.phantom {
  opacity: 0;
  pointer-events: none;
}
</style>
