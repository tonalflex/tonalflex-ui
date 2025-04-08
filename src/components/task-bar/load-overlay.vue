<template>
    <div class="load-container">
      <SavesList
        :items="sessions"
        :currentIndex="selectedIndex"
        title="Load Session"
        @select-item="handleSelect"
        @remove-item="handleDelete"
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import SavesList from '@/components/modules/List.vue';
  import {
    listSavedSessions,
    loadNamedSession,
    deleteSavedSession,
    restoreFrontendSession,
  } from '@/backend/tonalflexBackend';
  
  const rawSessions = ref<string[]>([]);
  const selectedIndex = ref<number>(-1);
  
  const sessions = computed(() =>
    rawSessions.value.map((name) => ({ name }))
  );
  
  const fetchSessions = async () => {
    rawSessions.value = await listSavedSessions();
  };
  
  const handleSelect = async (index: number) => {
    const name = rawSessions.value[index];
    const json = await loadNamedSession(name);
    if (json) {
      const parsed = JSON.parse(json);
      await restoreFrontendSession(parsed);
      selectedIndex.value = index;
    }
  };
  
  const handleDelete = async (index: number) => {
    const name = rawSessions.value[index];
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteSavedSession(name);
      await fetchSessions();
    }
  };
  
  onMounted(fetchSessions);
  </script>

<style scoped>
.load-container {
  z-index: 9999;
}
</style>