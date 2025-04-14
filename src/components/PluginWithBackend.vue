<script setup lang="ts">
import { provide, onMounted, ref } from 'vue';
import type { Component } from 'vue';
import SushiParameterController from '@/backend/sushi/parameterController';
import { SushiPluginBackend } from '@/backend/sushiPluginBackend';
import { BASE_URL } from '@/backend/tonalflexBackend';

const props = defineProps<{
  component: Component;
  processorId: number;
}>();

console.log('[PluginWithBackend] Mounting component with processorId:', props.processorId);

const controller = new SushiParameterController(BASE_URL + '/sushi');
const backend = new SushiPluginBackend(controller, props.processorId);
const isReady = ref(false);

onMounted(async () => {
  await backend.ready;
  console.log('[PluginWithBackend] Backend ready for processor', props.processorId);
  provide('audio-backend', backend);
  isReady.value = true;
});
</script>

<template>
    <div v-if="!isReady">Loading plugin UI...</div>
    <component v-if="isReady" :is="component" />
</template>
