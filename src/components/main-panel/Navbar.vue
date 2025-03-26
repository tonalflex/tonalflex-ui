<!-- src/components/NavbarCarousel.vue -->
<template>
    <div class="carousel-container">
      <div
        class="carousel"
        ref="carousel"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @scroll="updateScrollState"
      >
        <div
          class="carousel-item"
          v-for="(item, index) in items"
          :key="index"
          :class="{ 'selected': selectedIndex === index }"
          @click="selectItem(index)"
        >
          {{ item }}
          <button class="remove-btn" @click.stop="removeItem(index)">✕</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  // Props
  defineProps({
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
    selectedIndex: {
      type: Number,
      default: 0,
    },
  });
  
  // Emits
  const emit = defineEmits(['remove-item', 'select-item']);
  
  // Reactive data
  const carousel = ref(null);
  const atStart = ref(true);
  const atEnd = ref(false);
  const isDragging = ref(false);
  const startX = ref(0);
  const scrollLeftStart = ref(0);
  
  // Methods
  const scrollLeft = () => {
    carousel.value.scrollBy({ left: -200, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    carousel.value.scrollBy({ left: 200, behavior: 'smooth' });
  };
  
  const updateScrollState = () => {
    const el = carousel.value;
    atStart.value = el.scrollLeft === 0;
    atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
  };
  
  const startDrag = (event) => {
    isDragging.value = true;
    startX.value = event.pageX || event.touches[0].pageX;
    scrollLeftStart.value = carousel.value.scrollLeft;
  
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  };
  
  const drag = (event) => {
    if (!isDragging.value) return;
    event.preventDefault();
    const x = event.pageX || event.touches[0].pageX;
    const distance = startX.value - x;
    carousel.value.scrollLeft = scrollLeftStart.value + distance;
  };
  
  const stopDrag = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  };
  
  const removeItem = (index) => {
    emit('remove-item', index);
  };
  
  const selectItem = (index) => {
    emit('select-item', index);
  };
  
  // Lifecycle
  onMounted(() => {
    updateScrollState();
  });
  </script>
  
  <style scoped>
  .carousel-container {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  
  .carousel {
    display: flex;
    overflow-x: auto;
    scroll-behavior: smooth;
    white-space: nowrap;
    padding: 10px 0;
    -webkit-overflow-scrolling: touch;
    user-select: none;
  }
  
  .carousel::-webkit-scrollbar {
    display: none;
  }
  
  .carousel {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .carousel-item {
    flex: 0 0 auto;
    padding: 10px 20px;
    background-color: #f0f0f0;
    margin-right: 10px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 100px;
  }
  
  .carousel-item:hover {
    background-color: #e0e0e0;
  }
  
  .carousel-item.selected {
    background-color: #4caf50;
    color: white;
  }
  
  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    z-index: 10;
  }
  
  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .left {
    left: 0;
  }
  
  .right {
    right: 0;
  }
  
  .remove-btn {
    margin-left: 10px;
    background: none;
    border: none;
    color: red;
    cursor: pointer;
    font-size: 16px;
  }
  
  .remove-btn:hover {
    color: darkred;
  }
  </style>