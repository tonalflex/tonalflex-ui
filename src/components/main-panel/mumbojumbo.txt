<!-- src/components/EffectMap.vue -->
<template>
  <div class="effect-map-wrapper">
    <div class="navbar-section">
      <Navbar
        :items="trackNames"
        :selected-index="currentTrackIndex"
        @remove-item="removeTrack"
        @select-item="selectTrack"
      />
    </div>
    <div class="charter-container">
      <div class="grid-container">
        <div class="effect-map">
          <div class="direction-label">
            <CableIcon class="cable-icon" />
          </div>
          <div class="line"></div>

          <div
            v-for="(plugin, index) in currentPluginChain"
            :key="plugin.slotId"
            class="button-wrapper"
            @dragover.prevent
            @drop="onDrop($event, index)"
          >
            <button
              class="box-btn"
              :class="{ 'selected': plugin.id !== null }"
              @click="handlePluginClick(index)"
              @dragstart="onDragStart($event, index)"
              draggable="true"
            >
              <img v-if="plugin.id" :src="getPluginImage(plugin.id)" class="plugin-image" />
              <OhVueIcon v-else name="co-plus" class="btn-icon" />
            </button>
            <div class="line"></div>
          </div>

          <div class="direction-label">
            <SpeakerIcon class="speaker-icon" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPluginSelection" class="plugin-selection-overlay">
      <div class="plugin-selection-content">
        <button class="plugin-selection-close-btn" @click="closePluginSelection">✖</button>
        <h2>Select a Plugin</h2>
        <div class="plugin-list">
          <button
            v-for="effect in availableEffects"
            :key="effect.id"
            @click="selectEffect(effect.id)"
            class="plugin-item"
          >
            <img :src="effect.image" :alt="effect.name" class="plugin-selection-image" />
            <span class="plugin-label">{{ effect.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPlugin" class="plugin-overlay">
      <div class="plugin-wrapper">
        <div class="plugin-task-bar">
          <button class="plugin-close-btn" @click="closePlugin">✖</button>
        </div>
        <component :is="getPluginComponent(selectedPluginId)" />
      </div>
    </div>

    <button class="add-track-btn" @click="addTrack">Add New Track</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Navbar from '@/components/main-panel/Navbar.vue';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { CoPlus } from 'oh-vue-icons/icons';
import CableIcon from '@/components/icons/cable-icon.vue';
import SpeakerIcon from '@/components/icons/speaker-icon.vue';
import NeuralAmpImg from '@/components/plugins/thumbnails/neuralamp.png';
import { defineAsyncComponent } from 'vue';

// placeholders for now!
import { fetchChannels, addChannel, removeChannel  } from '@/stores/tonalflex/functions';

addIcons(CoPlus);

interface Plugin {
  id: string | null;
  slotId: number;
}

interface Track {
  name: string;
  plugins: Plugin[];
}

// Reactive state
const tracks = ref<Track[]>([]);
const currentTrackIndex = ref(0);
const availableEffects = ref([
  { id: 'reverb', name: 'Reverb', image: '/images/reverb.png' },
  { id: 'delay', name: 'Delay', image: '/images/delay.png' },
  { id: 'distortion', name: 'Distortion', image: '/images/distortion.png' },
  { id: 'chorus', name: 'Chorus', image: '/images/chorus.png' },
  { id: 'neuralamp', name: 'Neural Amp', image: NeuralAmpImg },
]);
const pluginComponents = {
  neuralamp: defineAsyncComponent(() => import('@/components/plugins/NeuralAmp.vue')),
};
const showPluginSelection = ref(false);
const showPlugin = ref(false);
const currentIndex = ref<number | null>(null);
const dragIndex = ref<number | null>(null);
const selectedPluginId = ref<string | null>(null);

// Computed properties
const trackNames = computed(() => tracks.value.map((track) => track.name));
const currentPluginChain = computed(() => tracks.value[currentTrackIndex.value]?.plugins || []);

// Fetch channels from Sushi
const fetchChannelsFromSushi = async () => {
  try {
    const channels = await fetchChannels(); 
    tracks.value = channels.length > 0
      ? channels
      : [{ name: 'Track 1', plugins: [{ id: null, slotId: 1 }] }];
  } catch (error) {
    console.error('Failed to fetch channels from Sushi:', error);
    tracks.value = [{ name: 'Track 1', plugins: [{ id: null, slotId: 1 }] }];
  }
};

// Add a new track
const addTrack = async () => {
  const newTrackName = `Track ${tracks.value.length + 1}`;
  try {
    await addChannel(newTrackName);
    tracks.value.push({
      name: newTrackName,
      plugins: [{ id: null, slotId: 1 }],
    });
  } catch (error) {
    console.error('Failed to add track to Sushi:', error);
    // Fallback: Add locally
    tracks.value.push({
      name: newTrackName,
      plugins: [{ id: null, slotId: 1 }],
    });
  }
};

// Remove a track
const removeTrack = async (index: number) => {
  try {
    await removeChannel(index); // Your gRPC function
    tracks.value.splice(index, 1);
    if (currentTrackIndex.value >= tracks.value.length) {
      currentTrackIndex.value = tracks.value.length - 1;
    }
  } catch (error) {
    console.error('Failed to remove track from Sushi:', error);
    // Fallback: Remove locally
    tracks.value.splice(index, 1);
    if (currentTrackIndex.value >= tracks.value.length) {
      currentTrackIndex.value = tracks.value.length - 1;
    }
  }
};

// Select a track
const selectTrack = (index: number) => {
  currentTrackIndex.value = index;
};

// Plugin handling
const getPluginImage = (pluginId: string | null) => {
  if (!pluginId) return '';
  const effect = availableEffects.value.find((e) => e.id === pluginId);
  return effect ? effect.image : '';
};

const getPluginComponent = (pluginId: string | null) => {
  if (!pluginId || !(pluginId in pluginComponents)) return null;
  return pluginComponents[pluginId as keyof typeof pluginComponents];
};

const handlePluginClick = (index: number) => {
  if (currentPluginChain.value[index].id) {
    selectedPluginId.value = currentPluginChain.value[index].id;
    showPlugin.value = true;
  } else {
    currentIndex.value = index;
    showPluginSelection.value = true;
  }
};

const selectEffect = (effectId: string) => {
  if (currentIndex.value !== null) {
    currentPluginChain.value[currentIndex.value].id = effectId;
    if (currentIndex.value === currentPluginChain.value.length - 1) {
      currentPluginChain.value.push({
        id: null,
        slotId: currentPluginChain.value.length + 1,
      });
    }
  }
  showPluginSelection.value = false;
};

const closePluginSelection = () => {
  showPluginSelection.value = false;
};

const closePlugin = () => {
  showPlugin.value = false;
  selectedPluginId.value = null;
};

const onDragStart = (event: DragEvent, index: number) => {
  dragIndex.value = index;
  event.dataTransfer!.setData('text/plain', index.toString());
};

const onDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault();
  if (dragIndex.value === null || dragIndex.value === targetIndex) return;

  const draggedPlugin = currentPluginChain.value[dragIndex.value];
  currentPluginChain.value.splice(dragIndex.value, 1);
  currentPluginChain.value.splice(targetIndex, 0, draggedPlugin);
  dragIndex.value = null;
};

// Lifecycle
onMounted(() => {
  fetchChannelsFromSushi();
});
</script>

<style scoped>
.effect-map-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
}

.navbar-section {
  width: 100%;
  height: 50px;
}

.charter-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 72px);
}

.grid-container {
  display: flex;
  flex-grow: 1;
}

.effect-map {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

.direction-label {
  color: rgba(39, 161, 28, 0.7);
}

.cable-icon {
  width: 50px;
  height: 50px;
  margin-right: 5px;
}

.speaker-icon {
  width: 40px;
  height: 40px;
  margin-top: 10px;
}

.line {
  width: 2px;
  height: 75px;
  background-color: rgba(39, 161, 28, 0.7);
  box-shadow: 1px 1px 5px rgb(6, 231, 36);
  border-radius: 12px;
}

.button-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
}

.box-btn {
  display: flex;
  width: 200px;
  height: 150px;
  border: none;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  box-shadow: 0px 0px 7px rgb(110, 110, 110);
  border: 2px solid rgb(110, 110, 110);
  background-color: rgba(47, 44, 44, 0.1);
  overflow: hidden;
}

.box-btn.selected {
  box-shadow: 0px 0px 10px rgb(37, 211, 28);
  background-color: rgba(16, 111, 16, 0.3);
  border: 1px solid rgb(37, 211, 28);
}

.box-btn:hover:not(.grayed-out) {
  cursor: pointer;
}

.btn-icon {
  width: 60px;
  height: 60px;
  color: rgba(126, 126, 126, 0.9);
}

.plugin-selection-overlay {
  position: fixed;
  top: 72px;
  left: 80px;
  width: calc(100vw - 80px);
  height: calc(100vh - 72px);
  background: rgba(126, 126, 126, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.plugin-selection-content {
  background: white;
  color: black;
  padding: 20px;
  border-radius: 10px;
  width: 350px;
  text-align: center;
  position: relative;
}

.plugin-selection-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.plugin-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.plugin-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  text-align: center;
}

.plugin-image {
  width: 220px;
  height: 200px;
  border-radius: 20px;
  object-fit: cover;
}

.plugin-label {
  margin-top: 5px;
  font-size: 14px;
  color: black;
}

.plugin-overlay {
  position: fixed;
  top: 72px;
  left: 80px;
  width: calc(100vw - 80px);
  height: calc(100vh - 75px);
  background: #131313;
  display: flex;
  justify-content: center;
  align-items: center;
}

.plugin-wrapper {
  width: 100%;
  height: 100%;
  color: white;
}

.plugin-task-bar {
  width: 100%;
  height: 50px;
  background: rgba(126, 126, 126, 0.5);
}

.plugin-close-btn {
  float: right;
  width: 50px;
  height: 50px;
  color: white;
  border: none;
  background: none;
}

.add-track-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.add-track-btn:hover {
  background-color: #45a049;
}
</style>