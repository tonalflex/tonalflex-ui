<template>
  <div class="navbar-spinner" ref="containerRef">
    <div
      class="spinner-track"
      :style="{
        transform: `translateX(-${(modelValue) * itemWidth}px)`,
        transition: 'transform 0.3s ease'
      }"
    >
      <!-- Phantom item -->
      <div class="phantom-item" :style="{ width: itemWidth + 'px' }" />

      <!-- Real items -->
      <div
        v-for="(item, index) in items"
        :key="index"
        class="spinner-item"
        :style="{ width: itemWidth + 'px' }"
        :class="{
          current: index === modelValue,
          prev: index === modelValue - 1,
          next: index === modelValue + 1
        }"
        @click="handleClick(index)"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
  items: string[];
  modelValue: number;
  emitOnCurrentClick?: boolean; 
}>();

const emit = defineEmits(['update:modelValue', 'current-click']);
const containerRef = ref<HTMLElement | null>(null);
const itemWidth = ref(0);

const calculateItemWidth = () => {
  if (containerRef.value) {
    itemWidth.value = containerRef.value.offsetWidth / 3;
  }
};

onMounted(() => {
  calculateItemWidth();
  window.addEventListener('resize', calculateItemWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateItemWidth);
});

// Optional: Watch if container size might change from parent layout shifting
watch(containerRef, calculateItemWidth);

const handleClick = (index: number) => {
  if (index === props.modelValue && props.emitOnCurrentClick) {
    emit('current-click');
  } else if (index !== props.modelValue) {
    emit('update:modelValue', index);
  }
};
</script>

<style scoped>
.navbar-spinner {
  width: 100%;
  height: 50px;
  overflow: hidden;
  position: relative;
}

.spinner-track {
  display: flex;
  height: 100%;
  width: fit-content;
  transition: transform 0.3s ease;
}

.spinner-item,
.phantom-item {
  text-align: center;
  line-height: 50px;
  font-weight: bold;
  font-size: 16px;
  color: #aaa;
  user-select: none;
  flex-shrink: 0;
  transition: all 0.3s ease;
  opacity: 0.4;
  transform: scale(0.9);
  pointer-events: none;
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
  font-size: 20px;
  transform: scale(1.1);
  opacity: 1;
  pointer-events: auto;
  cursor: pointer;
}
</style>
