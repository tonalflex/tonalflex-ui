<template>
  <div class="dashboard">
    <div class="diveder-left">
      <div class="left-panel">
        <LeftPanel @button-clicked="toggleSelectedButton" />
      </div>
    </div>
    <div class="divider-right">
      <div class="task-bar">
        <Taskbar @button-clicked="toggleSelectedButton" />
      </div>
      <div class="task-bar-overlay" v-if="selectedButton != 'effectmap'">
        <SaveOverlay v-if="selectedButton === 'save'" @save="handleSave" />
        <LoadOverlay v-if="selectedButton === 'load'" @load="handleLoad" />
        <HelpOverlay v-if="selectedButton === 'help'"/>
        <SettingsOverlay v-if="selectedButton === 'settings'" />
        <Looper v-if="selectedButton === 'looper'" />
        <Tuner v-if="selectedButton === 'tuner'" />
        <Metronome v-if="selectedButton === 'metronome'" />
      </div>
      <div class="main-panel">
        <div class="slide-container">
          <EffectMap v-if="selectedButton === 'effectmap'" @update-plugins="updatePlugins" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import LeftPanel from '@/components/LeftPanel.vue';
import EffectMap from '@/components/main-panel/EffectMap.vue';
import Tuner from '@/components/plugins/Tuner.vue';
import Metronome from '@/components/plugins/Metronome.vue';
import Looper from '@/components/plugins/Looper.vue';
import Taskbar from '@/components/task-bar/TaskBar.vue';
import SaveOverlay from '@/components/task-bar/save-overlay.vue';
import LoadOverlay from '@/components/task-bar/load-overlay.vue';
import HelpOverlay from '@/components/task-bar/help-overlay.vue';
import SettingsOverlay from '@/components/task-bar/settings-overlay.vue';
import {
  initializeTonalflexSession,
  saveNamedSession,
  loadNamedSession,
  restoreFrontendSession,
  loadFrontendSession
} from '@/backend/tonalflexBackend';

const isOverlayEnabled = ref(false);
const selectedButton = ref<string | null>("effectmap");
const selectedPlugins = ref<{ id: number; name: string }[]>([]);

const updatePlugins = (plugins: { id: number; name: string }[]) => {
  selectedPlugins.value = plugins;
};

const toggleSelectedButton = (button: string) => {
  toggleOverlayVisiblilty();
  selectedButton.value = selectedButton.value === button ? "effectmap" : button;
};

const toggleOverlayVisiblilty = () => {
  if(isOverlayEnabled.value === false){
    isOverlayEnabled.value = true;
  }else {
    isOverlayEnabled.value = false;
  }
}

const handleSave = async (name: string) => {
  const session = loadFrontendSession();
  if (session) {
    await saveNamedSession(name, JSON.stringify(session));
  }
};

const handleLoad = async (name: string) => {
  const json = await loadNamedSession(name);
  if (json) {
    const data = JSON.parse(json);
    await restoreFrontendSession(data);
  }
};

onMounted(async () => {
  await initializeTonalflexSession();
});
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 80px 1fr;
  width: 100vw;
  height: 100vh;
  font-family: Arial, sans-serif;
  overflow: hidden;
}

.divider-left{
  width: 100%;
  height: 100%;
}

.divider-right{
  width: 100%;
  height: 100%;
}

.left-panel {
  height: 100%;
  width: 80px;
}

.task-bar {
  position: relative;
  width: 100%;
  height: 72px;
}

.task-bar-overlay{
  width: 100%;
  height: calc(100vh - 72px);
}

.main-panel {
  position: relative;
  width: 100%;
  height: calc(100vh - 72px);
}

.main-panel:before {
  content: "";
  position: absolute;
  top: 0;
  left:0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/light-logo.png');
  background-size: 80% auto;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.1;
}

.slide-container {
  width: 100%;
  height: 100%;
}
</style>
