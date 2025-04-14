<!-- src/components/EffectMap.vue -->
<template>
  <div class="effect-map-wrapper">
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
            <TrackList
              title="Tracks"
              :listLimit="5"
              :items="trackListItems"
              :currentIndex="currentTrackIndex"
              @rename-item="({ index, newName }) => renameTrack(index, newName)"
              @remove-item="deleteTrackByIndex"
              @select-item="selectTrack"
              @close="showTrackSettings = false"
              @add-item="showNextTrack"
            />
          </div>
        </DropDown>
      </div>
    </CloseOnOutsideClick>

    <Carousel
      :items="visibleTracks"
      v-model:current-index="currentTrackIndex"
      v-if="!isPluginOverlayVisible"
      class="charter-container"
    >
      <template #default="slotProps">
        <div class="grid-container" v-if="slotProps.item">
          <div class="effect-map">
            <div class="direction-label in-btn">
              <button class="box-btn-in-out">
                <div class="btn-glass-border">
                  <CableIcon class="cable-icon" />
                </div>
              </button>
            </div>
            <div class="line"></div>
            <div
              v-for="(plugin, index) in plugins"
              :key="index"
              class="button-wrapper"
              @dragover.prevent
              @drop="onDrop($event, index)"
            >
            
            <button
              class="box-btn"
              :class="{ selected: plugin.id !== '' }"
              @click="plugin.id === '' ? openPluginSelectionForSlot(index) : handlePluginClick(plugin.id)" 
              @dragstart="onDragStart($event, index)"
              draggable="true"
            >
                <div class="btn-glass-border">
                  <img v-if="plugin.id" :src="getPluginImage(plugin.id)" class="plugin-image" />
                  <OhVueIcon v-else name="co-plus" class="btn-icon" />
                </div>
              </button>
              <div class="line"></div>
            </div>

            <div class="direction-label out-btn">
              <button class="box-btn-in-out">
                <div class="btn-glass-border">
                  <SpeakerIcon class="speaker-icon" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </template>
    </Carousel>

    <div v-if="pluginOverlayVisible" class="plugin-selection-overlay">
      <div class="plugin-selection-content">
        <button class="plugin-selection-close-btn" @click="closePluginSelection">✖</button>
        <h2>Select a Plugin</h2>

        <div class="plugin-grid">
          <div
            class="plugin-card"
            v-for="effect in availableEffects"
            :key="effect.id"
            @click="confirmPluginSelection(effect.id)"
          >
            <img
              :src="effect.image"
              :alt="effect.name"
              class="plugin-card-image"
            />
            <h3 class="plugin-card-title">{{ effect.name }}</h3>
            <p class="plugin-card-description">{{ effect.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { CoPlus } from 'oh-vue-icons/icons';
import CableIcon from '@/components/icons/cable-icon.vue';
import SpeakerIcon from '@/components/icons/speaker-icon.vue';
import NavbarSpinner from '@/components/modules/NavbarSpinner.vue';
import Carousel from '@/components/modules/ContentCarousel.vue';
import DropDown from '@/components/modules/DropDown.vue';
import TrackList from '@/components/modules/List.vue';
import CloseOnOutsideClick from '@/components/modules/CloseOnOutsideClick.vue';
import {
  visibleTracks,
  currentTrackIndex,
  trackNames,
  showNextTrack,
  renameTrack,
  deleteTrackByIndex,
  trackListItems,
  userPluginList,
  updatePluginSlot,
  rebuildPluginChain,
  getPluginImage,
  selectPluginOnTrack,
} from '@/backend/tonalflexBackend';

const activeTrack = computed(() => visibleTracks.value[currentTrackIndex.value]);
const plugins = computed(() => activeTrack.value?.plugins ?? []);

const pluginOverlayVisible = ref(false);
const selectedSlotIndex = ref<number | null>(null);
const dragIndex = ref<number | null>(null);
const activePluginId = ref<string | null>(null);
const showTrackSettings = ref(false);
const availableEffects = computed(() => userPluginList.value);
const isPluginOverlayVisible = ref(false);

addIcons(CoPlus);

const emit = defineEmits<{
  (e: 'update-selected-view', value: string): void;
}>();

const handlePluginClick = (pluginId: string) => {
  const track = visibleTracks.value[currentTrackIndex.value];
  selectPluginOnTrack(track.id, pluginId);
  emit('update-selected-view', 'pluginUI');
};

const openPluginSelectionForSlot = (index: number) => {
  selectedSlotIndex.value = index;
  pluginOverlayVisible.value = true;
};

const confirmPluginSelection = async (pluginId: string) => {
  const track = visibleTracks.value[currentTrackIndex.value];
  if (selectedSlotIndex.value !== null) {
    await updatePluginSlot(track.id, selectedSlotIndex.value, pluginId);
    selectedSlotIndex.value = null;
    pluginOverlayVisible.value = false;
    activePluginId.value = pluginId;
  }
};

const closePluginSelection = () => {
  pluginOverlayVisible.value = false;
  selectedSlotIndex.value = null;
};

const onDragStart = (event: DragEvent, index: number) => {
  dragIndex.value = index;
  event.dataTransfer!.setData('text/plain', index.toString());
};

const onDrop = async (event: DragEvent, targetIndex: number) => {
  event.preventDefault();
  if (dragIndex.value === null || dragIndex.value === targetIndex) return;

  const track = visibleTracks.value[currentTrackIndex.value];
  const dragged = track.plugins.splice(dragIndex.value, 1)[0];
  track.plugins.splice(targetIndex, 0, dragged);
  dragIndex.value = null;
  await rebuildPluginChain(track.id, track.plugins);
};

const selectTrack = (index: number) => {
  currentTrackIndex.value = index;
};

const openTrackSettings = () => {
  showTrackSettings.value = !showTrackSettings.value;
};
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
  margin-top:5px;
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
  overflow:hidden;
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
  padding: 10px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.charter-container {
  display: flex;
  position: relative;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  overflow: auto;
  height: calc(100vh - 122px); /* Account for navbar height */
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

.in-btn{
  margin-top: 50px;
}

.out-btn{
  padding-bottom: 50px;
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
  width: 1px;
  height: 75px;
  background-color: rgba(39, 161, 28, 0.3);
  box-shadow: 0px 0px 3px rgba(6, 231, 36, 0.8);
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
  box-shadow: 0px 0px 5px rgb(110, 110, 110);
  background-color: rgba(47, 44, 44, 0.05);
  overflow: hidden;
}

.box-btn-in-out {
  display: flex;
  width: 150px;
  height: 100px;
  border: none;
  justify-content: center;
  align-items: center;
  border-radius: 15px;
  box-shadow: 0px 0px 5px rgba(14, 190, 14, 0.4);
  background-color: rgba(51, 255, 0, 0.05);

  overflow: hidden;
  color:limegreen;
  cursor: pointer;
}

.btn-glass-border{
  display: flex;
  justify-content: center;
  align-items: center;
  position:relative;
  width:86%;
  height:100%;
  background: rgba(126, 126, 126, 0.0);
  box-shadow: 0 0 15px rgba(124, 223, 124, 0.07);
}

.box-btn.selected {
  box-shadow: 0px 0px 5px rgba(14, 190, 14, 0.4);
  background-color: rgba(51, 255, 0, 0.05);
}

.box-btn:hover:not(.grayed-out) {
  cursor: pointer;
}

.btn-icon {
  width: 60px;
  height: 60px;
  color: rgba(126, 126, 126, 0.9);
}

.plugin-image{
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.plugin-selection-overlay {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 132px;
  left: 80px;
  width: calc(100vw - 80px);
  height: calc(100vh - 132px);
  background: rgba(20, 20, 20, 1);
  overflow: auto;
}

.plugin-selection-content {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  color: white;
}

.plugin-selection-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: white;
}

.plugin-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  padding: 1rem 0;
}

.plugin-card {
  width: 300px;
  height: auto;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.plugin-card:hover {
  transform: translateY(-4px);
}

.plugin-card-image {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

.plugin-card-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
}

.plugin-card-description {
  font-size: 0.9rem;
  color: white;
  text-align: center;
  flex-grow: 1;
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