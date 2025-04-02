<template>
  <div class="dashboard">
    <div class="left-panel">
      <LeftPanel @button-clicked="toggleSelectedButton" />
    </div>
    <div class="task-bar">
      <Taskbar @button-clicked="toggleSelectedButton" />
      <div class="nav-overlay">
        <SaveOverlay v-if="selectedButton === 'save'" :session="session" @save="handleSave" />
        <LoadOverlay v-if="selectedButton === 'load'" @load="handleLoad" />
        <HelpOverlay v-if="selectedButton === 'help'" />
        <SettingsOverlay v-if="selectedButton === 'settings'" />
      </div>
    </div>
    <div class="main-panel">
      <div class="slide-container">
        <PluginPanel v-if="isPluginsEnabled" :activePlugins="selectedPlugins" />
        <Looper v-if="selectedButton === 'looper'" />
        <Tuner v-if="selectedButton === 'tuner'" />
        <Metronome v-if="selectedButton === 'metronome'" />
        <EffectMap v-if="selectedButton === 'effectmap' && sessionReady" :session="session" @update-plugins="updatePlugins" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTonalFlexSession } from '@/composables/useTonalFlexSession';
import LeftPanel from '@/components/LeftPanel.vue';
import EffectMap from '@/components/main-panel/EffectMap.vue';
import Tuner from '@/components/plugins/Tuner.vue';
import Metronome from '@/components/plugins/Metronome.vue';
import Looper from '@/components/plugins/Looper.vue';
import PluginPanel from '@/components/PluginPanel.vue';
import Taskbar from '@/components/task-bar/TaskBar.vue';
import SaveOverlay from '@/components/task-bar/save-overlay.vue';
import LoadOverlay from '@/components/task-bar/load-overlay.vue';
import HelpOverlay from '@/components/task-bar/help-overlay.vue';
import SettingsOverlay from '@/components/task-bar/settings-overlay.vue';
import { saveNamedSession, loadNamedSession, restoreFrontendSession } from '@/stores/tonalflex/functions';

const { session, sessionReady, initialize } = useTonalFlexSession();
const selectedButton = ref<string | null>("effectmap");
const isPluginsEnabled = true;
const selectedPlugins = ref<{ id: number; name: string }[]>([]);

const updatePlugins = (plugins: { id: number; name: string }[]) => {
  selectedPlugins.value = plugins;
};

const toggleSelectedButton = (button: string) => {
  selectedButton.value = selectedButton.value === button ? "effectmap" : button;
};

const handleSave = async (name: string) => {
  if (session.value) {
    await saveNamedSession(name, JSON.stringify(session.value));
  }
};

const handleLoad = async (name: string) => {
  const json = await loadNamedSession(name);
  if (json) {
    const data = JSON.parse(json);
    await restoreFrontendSession(data);
    session.value = data;
  }
};

onMounted(() => {
  initialize();
});
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 80px 1fr;
  width: 100vw;
  height: 100vh;
  font-family: Arial, sans-serif;
  color: #1c1c1c;
}

.left-panel {
  position: fixed;
  height: 100vh;
  width: 80px;
}

.task-bar {
  position: fixed;
  left: 80px;
  width: calc(100vw - 80px);
  height: 72px;
}

.nav-overlay {
  position: fixed;
  left: 80px;
  top: 72px;
  width: calc(100vw - 80px);
  height: calc(100vh - 72px);
  color: white;
}

.main-panel {
  position: relative;
  left: 80px;
  top: 72px;
  width: calc(100vw - 80px);
  height: calc(100vh - 72px);
}

.main-panel:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
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
