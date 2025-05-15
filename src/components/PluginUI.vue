<template>
  <div class="plugin-ui-overlay">
    <div class="plugin-ui-bar">
      <button class="btn" @click="handleClose"><closeIcon class="btn-icon" /></button>
    </div>

    <div class="plugin-ui-grid">
      <InputPlugin v-if="currentTrack" :track-id="currentTrack.id" />
      <div
        v-for="plugin in activePlugins"
        :key="plugin.processorId"
        class="plugin-wrapper"
      >
        <div class="plugin-controls">
          <div class="left-spacer"></div>
          <div class="plugin-label"><span>{{ getPluginName(plugin.id) }}</span></div>
          <div class="delete-btn" @click="handleDelete(plugin.instanceId)">
            <deleteIcon class="control-icon"/>
          </div>
        </div>
        <div class="plugin-container">
          <PluginWithBackend
            v-if="plugin.processorId != null && getPluginComponent(plugin.id)"
            :component="getPluginComponent(plugin.id)!"
            :processor-id="plugin.processorId"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from "vue";
import PluginWithBackend from "@/components/PluginWithBackend.vue";
import {
  pluginTracks,
  getPluginComponent,
  getActivePluginsForTrack,
  currentTrackIndex,
  currentTrack,
  sushiTrackRoles,
  getTrackGain,
  getTrackPan,
  setTrackGain,
  setTrackPan,
  getPluginName,
  deletePluginFromChain
} from "@/backend/tonalflexBackend";
import deleteIcon from "@/components/icons/delete.vue";
import closeIcon from '@/components/icons/close.vue';
import InputPlugin from "@/components/modules/InputPlugin.vue";

const inputGain = ref(1);
const trackGain = ref(1);
const trackPan = ref(0);

watch(inputGain, (v) => {
  const preId = sushiTrackRoles.pre.value;
  if (preId != null) setTrackGain(preId, v);
});

watch(trackGain, (v) => {
  const track = pluginTracks.value[currentTrackIndex.value];
  if (track) setTrackGain(track.id, v);
});

watch(trackPan, (v) => {
  const track = pluginTracks.value[currentTrackIndex.value];
  if (track) setTrackPan(track.id, v);
});

const loadTrackSliders = async () => {
  const preId = sushiTrackRoles.pre.value;
  const track = pluginTracks.value[currentTrackIndex.value];

  if (preId != null) inputGain.value = await getTrackGain(preId);
  if (track) {
    trackGain.value = await getTrackGain(track.id);
    trackPan.value = await getTrackPan(track.id);
  }
};

const handleDelete = async (instanceId: string) => {
  const track = pluginTracks.value[currentTrackIndex.value];
  if (!track) return;
  await deletePluginFromChain(track.id, instanceId);
};

onMounted(loadTrackSliders);
watch(currentTrackIndex, loadTrackSliders);

const activePlugins = computed(() => {
  const track = pluginTracks.value[currentTrackIndex.value];
  if (!track) return [];

  console.log("TRACK PLUGINS:", track.plugins);
  console.log("ACTIVE UI MAP:", getActivePluginsForTrack(track.id));

  // Fallback: just return all that have a processorId
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
  max-width: calc(100vw - 60px);
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 20px;
}

.plugin-ui-bar {
  width: 100%;
  float: right;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.btn {
  width: 50px;
  height: 50px;
  background: none;
  border: none;
  float:right;
  justify-content: center;
  cursor: pointer;
}

.btn-icon {
  width: 30px;
  height: 30px;
  color: rgba(255, 255, 255, 0.6);
}

.plugin-ui-grid {
  width:100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  padding: 10px;
}

.plugin-wrapper{
  width: 100%;
  max-width: 450px;
  height: auto;
  margin: 10px;
}

.plugin-controls{
  width: 100%;
  height: 30px;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border-left: 1px solid rgba(73, 73, 73, 0.7);
  border-top: 1px solid rgba(73, 73, 73, 0.7);
  border-right: 1px solid rgba(73, 73, 73, 0.7);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.left-spacer{
  width:33%;
}

.plugin-label{
  width:33%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.delete-btn{
  width:33%;
  display:flex;
  justify-content: end;
}

.control-icon{
  float:right;
  width: 20px;
  height: 20px;
  color:rgba(255, 255, 255, 0.6);
  cursor: pointer;
  margin-right: 5px;
}

.plugin-container {
  width: 100%;
  height: 100%;
  border: 2px solid rgba(73, 73, 73, 0.7);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

</style>
