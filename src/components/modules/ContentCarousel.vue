<!-- src/components/Carousel.vue -->
<template>
  <div
    ref="carouselContainer"
    class="carousel"
    @mousedown="startMouseDrag"
    @touchstart="(e) => startDrag(e.touches[0].clientX)"
    @touchmove="(e) => onDrag(e.touches[0].clientX)"
    @touchend="endDrag"
  >
    <div
      class="carousel-track"
      :style="{
        transform: `translateX(-${carouselOffset}%)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
      }"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="carousel-page"
      >
        <slot :item="item" :index="index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// Define props with unknown[] for items
const props = defineProps<{
  items: unknown[]; // Generic array type, typed by parent
  currentIndex: number;
}>();

const emit = defineEmits<{
  (e: 'update:currentIndex', value: number): void;
}>();

const carouselContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragDelta = ref(0);

const containerWidth = computed(() => {
  return carouselContainer.value?.offsetWidth || window.innerWidth;
});

const carouselOffset = computed(() => {
  const dragPercent = (dragDelta.value / containerWidth.value) * 100;
  return isDragging.value 
    ? props.currentIndex * 100 - dragPercent 
    : props.currentIndex * 100;
});

const startDrag = (x: number) => {
  isDragging.value = true;
  dragStartX.value = x;
};

const onDrag = (x: number) => {
  if (!isDragging.value) return;
  dragDelta.value = x - dragStartX.value;
};

const endDrag = () => {
  isDragging.value = false;
  const threshold = containerWidth.value / 4;
  if (dragDelta.value > threshold && props.currentIndex > 0) {
    emit('update:currentIndex', props.currentIndex - 1);
  } else if (dragDelta.value < -threshold && props.currentIndex < props.items.length - 1) {
    emit('update:currentIndex', props.currentIndex + 1);
  }
  dragDelta.value = 0;
};

const startMouseDrag = (e: MouseEvent) => {
  startDrag(e.clientX);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', endMouseDrag);
};

const onMouseMove = (e: MouseEvent) => {
  onDrag(e.clientX);
};

const endMouseDrag = () => {
  endDrag();
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', endMouseDrag);
};

onMounted(() => {
  carouselContainer.value = document.querySelector('.carousel') as HTMLElement;
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', endMouseDrag);
});
</script>

<style scoped>
.carousel {
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-x;
  cursor: grab;
}

.carousel-track {
  display: flex;
  height: 100%;
  width: calc(100% * var(--track-count));
  will-change: transform;
}

.carousel-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex; /* Enable centering of content */
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
}

:deep(.carousel-track) {
  --track-count: v-bind('items.length');
}
</style>