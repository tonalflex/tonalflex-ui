<!-- src/components/EffectMap.vue -->
<template>
  <div class="effect-map-wrapper">
    <!-- Synced Navbar Slider showing prev/active/next -->
    <CloseOnOutsideClick v-model="showTrackSettings">
    <div class="navbar-section" ref="navbarRef">
      <div class="nav-bar">
        <NavbarSpinner
          :items="trackNames"
          v-model="currentTrackIndex"
          :emit-on-current-click="true"
          @current-click="openTrackSettings"
        />
      </div>

      <DropDown :visible="showTrackSettings">
        <div class="track-settings-section" ref="dropdownRef">
          <TrackSettings
            :tracks="tracks"
            :currentIndex="currentTrackIndex"
            @add-track="addTrack"
            @remove-track="removeTrack"
            @rename-track="({ index, newName }) => tracks[index].name = newName"
            @select-track="selectTrack"
            @close="showTrackSettings = false"
          />
        </div>
      </DropDown>
    </div>
  </CloseOnOutsideClick>
    <!-- Carousel Component -->
    <Carousel
      :items="tracks"
      v-model:current-index="currentTrackIndex"
      class="charter-container"
    >
      <template #default="{ item: track, index }">
        <div class="grid-container">
          <div class="effect-map">
            <div class="direction-label">
              <CableIcon class="cable-icon" />
            </div>
            <div class="line"></div>

            <div
              v-for="(plugin, index) in track.plugins"
              :key="plugin.slotId"
              class="button-wrapper"
              @dragover.prevent
              @drop="onDrop($event, index)"
            >
              <button
                class="box-btn"
                :class="{ selected: plugin.id !== null }"
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
      </template>
    </Carousel>

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { CoPlus } from 'oh-vue-icons/icons';
import CableIcon from '@/components/icons/cable-icon.vue';
import SpeakerIcon from '@/components/icons/speaker-icon.vue';
import { defineAsyncComponent } from 'vue';
import NavbarSpinner from '@/components/modules/NavbarSpinner.vue';
import Carousel from '@/components/modules/ContentCarousel.vue';
import TrackSettings from '@/components/main-panel/TrackSettings.vue';
import DropDown from '@/components/modules/DropDown.vue';
import CloseOnOutsideClick from '@/components/modules/CloseOnOutsideClick.vue';

import {
  initializeTonalflexSession,
  saveSessionSnapshot,
  createTrackAndRouteToMain,
  removeChannel,
  addPluginToTrackByName
} from '@/stores/tonalflex/functions';

import { pluginList } from '@/components/plugins/pluginIndex';

addIcons(CoPlus);

interface Plugin {
  id: string | null;
  slotId: number;
}

interface Track {
  name: string;
  plugins: Plugin[];
}

const tracks = ref<Track[]>([]);
const currentTrackIndex = ref(0);
const showPluginSelection = ref(false);
const showPlugin = ref(false);
const currentIndex = ref<number | null>(null);
const dragIndex = ref<number | null>(null);
const selectedPluginId = ref<string | null>(null);
const showTrackSettings = ref(false);

const trackNames = computed(() => tracks.value.map((track) => track.name));
const currentPluginChain = computed(() => tracks.value[currentTrackIndex.value]?.plugins || []);
const availableEffects = ref(pluginList);

const fetchInitialState = async () => {
  await initializeTonalflexSession();

  const saved = localStorage.getItem('tonalflex_session');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed?.tracks) {
      tracks.value = parsed.tracks;
    }
  }
};

const addTrack = async () => {
  const newTrackName = `Track ${tracks.value.length + 1}`;
  await createTrackAndRouteToMain(newTrackName);
  tracks.value.push({
    name: newTrackName,
    plugins: [{ id: null, slotId: 1 }],
  });
  await saveSessionSnapshot();
};

const removeTrack = async (index: number) => {
  await removeChannel(index);
  tracks.value.splice(index, 1);
  if (currentTrackIndex.value >= tracks.value.length) {
    currentTrackIndex.value = tracks.value.length - 1;
  }
  await saveSessionSnapshot();
};

const selectTrack = (index: number) => {
  currentTrackIndex.value = index;
};

const getPluginImage = (pluginId: string | null) => {
  const effect = pluginList.find((e) => e.id === pluginId);
  return effect ? effect.image : '';
};

const getPluginComponent = (pluginId: string | null) => {
  // Extend if more plugin UIs are added
  return pluginId === 'neuralamp'
    ? defineAsyncComponent(() => import('@/components/plugins/NeuralAmp.vue'))
    : null;
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

const selectEffect = async (effectId: string) => {
  if (currentIndex.value !== null) {
    const track = tracks.value[currentTrackIndex.value];
    track.plugins[currentIndex.value].id = effectId;
    await addPluginToTrackByName(track.name, effectId);

    if (currentIndex.value === track.plugins.length - 1) {
      track.plugins.push({ id: null, slotId: track.plugins.length + 1 });
    }
    await saveSessionSnapshot();
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
  saveSessionSnapshot();
};

const openTrackSettings = () => {
  showTrackSettings.value = !showTrackSettings.value;
};

onMounted(() => {
  fetchInitialState();
});
</script>

<style scoped>
.effect-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.navbar-section {
  width: 100%;
  position: relative;
}

.navbar-section::before,
.navbar-section::after {
  content: '';
  position: absolute;
  left: 2%;
  right: 2%;
  height: 2px;
  background: #888;
  border-radius: 50% / 100%;
}

.navbar-section::before {
  top: -2px;
  transform: translateY(-50%);
}

.navbar-section::after {
  bottom: -2px;
  transform: translateY(50%);
}

.nav-bar{
  width: 100%;
  height: 50px;
}

.track-settings-section{
  width: 100%;
  color: white;
  z-index: 5;
  padding: 10px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.charter-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100% - 50px); /* Account for navbar height */
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