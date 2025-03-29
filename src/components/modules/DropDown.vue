<template>
    <transition
      name="dropdown"
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      @before-leave="beforeLeave"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div v-show="visible" class="dropdown-content">
        <slot />
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    visible: boolean;
  }>();
  
  const maxHeight = 'calc(100vh - 100px)'; // Adjust max-height depending on your needs.
  
  const beforeEnter = (el: Element) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = '0';
    htmlEl.style.opacity = '0';
    htmlEl.style.overflow = 'hidden';
  };
  
  const enter = (el: Element) => {
    const htmlEl = el as HTMLElement;
    const scrollHeight = htmlEl.scrollHeight;
    const cappedHeight = Math.min(scrollHeight, window.innerHeight - 100);
    htmlEl.style.transition = 'height 0.3s ease, opacity 0.3s ease';
    htmlEl.style.height = `${cappedHeight}px`;
    htmlEl.style.opacity = '1';
  };
  
  const afterEnter = (el: Element) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = 'auto';
    htmlEl.style.maxHeight = maxHeight;
    htmlEl.style.overflow = 'auto';
  };
  
  const beforeLeave = (el: Element) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.maxHeight = maxHeight;
    htmlEl.style.overflow = 'hidden';
    htmlEl.style.height = `${htmlEl.scrollHeight}px`;
    htmlEl.style.opacity = '1';
  };
  
  const leave = (el: Element) => {
    const htmlEl = el as HTMLElement;
    // Force reflow
    void htmlEl.offsetHeight;
    htmlEl.style.transition = 'height 0.2s ease, opacity 0.3s ease'; // Adjust transition depending on your needs.
    htmlEl.style.height = '0';
    htmlEl.style.opacity = '0';
  };
  
  const afterLeave = (el: Element) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.height = '';
    htmlEl.style.opacity = '';
    htmlEl.style.overflow = '';
    htmlEl.style.transition = '';
  };
  </script>
  
  <style scoped>
  .dropdown-content {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
  </style>
  