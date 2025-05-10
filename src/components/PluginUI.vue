<template>
  <div class="plugin-ui-overlay">
    <div class="plugin-ui-bar">
      <button class="plugin-ui-close" @click="handleClose">✖</button>
    </div>

    <div class="plugin-ui-grid">
      <div
        v-for="plugin in activePlugins"
        :key="plugin.processorId"
        class="plugin-container"
      >
        <PluginWithBackend
          v-if="plugin.processorId != null && getPluginComponent(plugin.id)"
          :component="getPluginComponent(plugin.id)!"
          :processor-id="plugin.processorId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import PluginWithBackend from "@/components/PluginWithBackend.vue";
import {
  pluginTracks,
  getPluginComponent,
  getActivePluginsForTrack,
  currentTrackIndex,
} from "@/backend/tonalflexBackend";

const activePlugins = computed(() => {
  const track = pluginTracks.value[currentTrackIndex.value];
  if (!track) return [];

  console.log("TRACK PLUGINS:", track.plugins);
  console.log("ACTIVE UI MAP:", getActivePluginsForTrack(track.id));

  // Fallback test: just return all that have a processorId
  return track.plugins.filter((p) => p.processorId != null);
});

const handleClose = () => {
  emit("close-plugin-ui");
};

const emit = defineEmits<{
  (e: "close-plugin-ui"): void;
}>();

watch(activePlugins, (val) => {
  console.log(
    "[PluginUI] activePlugins changed:",
    val.map((p) => p.processorId)
  );
});
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
  color: white;
  overflow-y: auto;
}

.plugin-ui-bar {
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color:blue;
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
  width:100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  overflow-y: auto;
}

.plugin-container {
  width: 100%;
  max-width: 450px;
  height: 100%;
  overflow-y: auto;
  border: 2px solid white;
  border-radius: 12px;
}
</style>
