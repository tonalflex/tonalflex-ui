<template>
    <div class="plugin-ui-overlay">
      <div class="plugin-ui-bar">
        <button class="plugin-ui-close" @click="handleClose">✖</button>
      </div>
  
      <div class="plugin-ui-grid">
        <div
          v-for="(plugin, index) in activePlugins"
          :key="index"
          class="plugin-container"
        >
          <component :is="getPluginComponent(plugin.id)" />
        </div>
      </div>
    </div>
  </template>
  
<script setup lang="ts">
  import { computed } from 'vue';
  import {
    pluginTracks,
    activeTrackId,
    getPluginComponent,
    filteredPlugins,
    activePluginId,
  } from '@/backend/tonalflexBackend';
  
  const activePlugins = computed(() => {
    if (!activeTrack.value) return [];
        return filteredPlugins(activeTrack.value.plugins).filter(p => p.id && p.id !== '');
    });

  const activeTrack = computed(() => {
  return pluginTracks.value.find(t => t.id === activeTrackId.value) ?? null;
});
  
const handleClose = () => {
  activePluginId.value = null;
  activeTrackId.value = null;
  emit('close-plugin-ui');
};

const emit = defineEmits<{
(e: 'close-plugin-ui'): void;
}>();

  console.log('[PluginUI] Active track ID:', activeTrackId.value);

  </script>
  
  <style scoped>
  .plugin-ui-overlay {
    position: fixed;
    top: 72px;
    left: 80px;
    width: calc(100vw - 80px);
    height: calc(100vh - 72px);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    color: white;
  }
  
  .plugin-ui-bar {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 0 10px;
  }
  
  .plugin-ui-close {
    font-size: 20px;
    color: white;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .plugin-ui-grid {
    flex-grow: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    padding: 1rem;
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
  }
  
  .plugin-container {
  }
  </style>
  