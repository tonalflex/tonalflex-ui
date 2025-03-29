<template>
  <div ref="wrapper" class="outside-wrapper">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const wrapper = ref<HTMLElement | null>(null);

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const handleClickOutside = (e: MouseEvent | TouchEvent) => {
  if (!props.modelValue || !wrapper.value) return;

  const isOutside = !wrapper.value.contains(e.target as Node);
  if (isOutside) {
    emit('update:modelValue', false);
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('touchstart', handleClickOutside);
});
</script>

<style scoped>
.outside-wrapper {
  position: relative;
}
</style>
