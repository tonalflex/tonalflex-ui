<template>
  <div class="settings-container" v-if="!activeOverlay">
    <div class="bpm-container">
      <bpmController :bpm="bpm" @update:bpm="updateBpm"/> 
    </div>
    <div class="menu">
      <div class="menu-button" @click="selectView('import')"><importIcon class="btn-icon"/><h1>Import Files</h1></div>
      <div class="menu-button" @click="selectView('export')"><exportIcon class="btn-icon"/><h1>Export Files</h1></div>
      <div class="menu-button" @click="selectView('wifi')"><wifi class="btn-icon"/><h1>Wifi</h1></div>
      <div class="menu-button" @click="selectView('midi')"><midi class="btn-icon"/><h1>Midi</h1></div>  
    </div>
  </div>
  <Import
    v-if="selectedView === 'import'"
    @close="closeOverlay"
    @switch="switchOverlay"
  />
  <Export v-if="selectedView === 'export'" 
    @close="closeOverlay"
    @switch="switchOverlay"
  />
  <Midi v-if="selectedView === 'midi'" 
    @close="closeOverlay"
    @switch="switchOverlay"
  />
  <Wifi v-if="selectedView === 'wifi'" 
    @close="closeOverlay"
    @switch="switchOverlay"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import bpmController from "@/components/modules/BpmController.vue"
import { getCurrentBpm, setCurrentBpm } from "@/backend/tonalflexBackend"
import Export from "./settings/Export.vue"
import Import from "./settings/Import.vue"
import Midi from "./settings/Midi.vue"
import Wifi from "./settings/Wifi.vue"
import exportIcon from '@/components/icons/exportIcon.vue';
import importIcon from '@/components/icons/importIcon.vue';
import midi from '@/components/icons/midi.vue';
import wifi from "@/components/icons/wifi.vue"

const bpm = ref(120)
const activeOverlay = ref(false);
const selectedView = ref<string | null>(null)

const selectView = (view: string) => {
  activeOverlay.value = true;
  selectedView.value = selectedView.value === view ? null : view
}

const switchOverlay = (target: string) => {
  selectedView.value = target;
  activeOverlay.value = true;
};

const closeOverlay = () => {
  activeOverlay.value = false;
  selectedView.value = null;
};

onMounted(async () => {
  bpm.value = await getCurrentBpm()
})

const updateBpm = async (newBpm: number) => {
  bpm.value = newBpm
  await setCurrentBpm(newBpm)
}
</script>

<style scoped>

.settings-container{
  width:100%;
  height:100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 40px;
}

.bpm-container{
  overflow:hidden;
}

.menu{
  width: 270px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  justify-content: center;
}

.menu-button{
  position: relative;
  width: 100%;
  height: 50px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
  padding-left: 15px;
}

.menu-button:hover{
  color: white;
}

.btn-icon{
  position: absolute;
  left: 10px;
  width: 30px;
  height: 30px;
}

</style>