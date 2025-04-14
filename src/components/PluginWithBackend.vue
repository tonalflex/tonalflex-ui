<script setup lang="ts">
import { defineComponent, defineProps, h, provide, ref } from 'vue';
import type { Component } from 'vue';
import SushiParameterController from '@/backend/sushi/parameterController';
import { SushiPluginBackend } from '@/backend/sushiPluginBackend';
import { BASE_URL } from '@/backend/tonalflexBackend';

const props = defineProps<{
  component: Component;
  processorId: number;
}>();

const controller = new SushiParameterController(BASE_URL + '/sushi');
const backend = new SushiPluginBackend(controller, props.processorId);

const isReady = ref(false);

// wait for backend to be ready before rendering
await backend.ready;
console.log('[PluginWithBackend] Backend ready for processor', props.processorId);
isReady.value = true;

const PluginProvider = defineComponent({
  setup(_, { slots }) {
    provide('audio-backend', backend);
    return () => h('div', {}, slots.default?.());
  }
});
</script>

<template>
  <div v-if="!isReady">Loading plugin UI...</div>
  <PluginProvider v-else>
    <component :is="component" />
  </PluginProvider>
</template>
