<template>
    <div class="save-container">
      <SavesList
        :items="sessions"
        :currentIndex="selectedIndex"
        title="Saved Sessions"
        @rename-item="handleRename"
        @remove-item="handleDelete"
        @select-item="selectSession"
        @add-item="handleSave"
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import SavesList from '@/components/modules/List.vue';
  import {
    listSavedSessions,
    saveNamedSession,
    deleteSavedSession,
    loadSessionSnapshot,
  } from '@/backend/tonalflexBackend';
  
  const rawSessions = ref<string[]>([]);
  const selectedIndex = ref<number>(-1);
  
  const sessions = computed(() => rawSessions.value.map(name => ({ name })));
  
  const fetchSessions = async () => {
    rawSessions.value = await listSavedSessions();
  };
  
  const handleSave = async () => {
    const name = prompt("Enter a name for the session:");
    if (name) {
      const session = await loadSessionSnapshot();
      console.log('[DEBUG] Snapshot data before save:', session);
      if (session) {
        await saveNamedSession(name, JSON.stringify(session));
        await fetchSessions();
      }
    }
  };
  
  const handleDelete = async (index: number) => {
    const name = rawSessions.value[index];
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await deleteSavedSession(name);
      await fetchSessions();
    }
  };
  
  const handleRename = async ({ index, newName }: { index: number; newName: string }) => {
    const oldName = rawSessions.value[index];
    const session = await loadSessionSnapshot();
    if (session && oldName !== newName) {
      await saveNamedSession(newName, JSON.stringify(session));
      await deleteSavedSession(oldName);
      await fetchSessions();
    }
  };
  
  const selectSession = (index: number) => {
    selectedIndex.value = index;
  };
  
  onMounted(fetchSessions);
  </script>
  
  <style scoped>
  .save-container {
    z-index: 9999;
  }
  </style>
  