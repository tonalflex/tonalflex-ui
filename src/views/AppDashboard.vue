<template>
  <LoadingScreen :message="loadingMessage" v-if="!sessionReady"/>
  <div class="dashboard" v-if="sessionReady">
    <div class="diveder-left">
      <div class="left-panel">
        <LeftPanel @button-clicked="toggleSelectedView" />
      </div>
    </div>
    <div class="divider-right">
      <div class="task-bar" v-if="selectedView !== 'pluginUI'">
        <Taskbar @button-clicked="toggleSelectedView" />
      </div>
      <div class="task-bar-overlay" v-if="selectedView != 'effectmap'">
        <SaveOverlay v-if="selectedView === 'save'" @save="handleSave" />
        <LoadOverlay v-if="selectedView === 'load'" @load="handleLoad" />
        <HelpOverlay v-if="selectedView === 'help'" />
        <SettingsOverlay v-if="selectedView === 'settings'" />
        <Looper v-if="selectedView === 'looper'" />
        <Tuner v-if="selectedView === 'tuner'" />
        <Metronome v-if="selectedView === 'metronome'" />
        <PluginUI
          v-if="selectedView === 'pluginUI'"
          @close-plugin-ui="selectedView = 'effectmap'"
        />
      </div>

      <div class="main-panel">
        <div class="slide-container">
          <EffectMap
            v-if="selectedView === 'effectmap'"
            @update-selected-view="selectedView = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from "vue";
import LoadingScreen from "@/components/modules/LoadingScreen.vue"
import LeftPanel from "@/components/LeftPanel.vue";
import EffectMap from "@/components/main-panel/EffectMap.vue";
import Tuner from "@/components/plugins/Tuner.vue";
import Metronome from "@/components/plugins/Metronome.vue";
import Looper from "@/components/plugins/Looper.vue";
import Taskbar from "@/components/task-bar/TaskBar.vue";
import SaveOverlay from "@/components/task-bar/SaveOverlay.vue";
import LoadOverlay from "@/components/task-bar/LoadOverlay.vue";
import HelpOverlay from "@/components/task-bar/HelpOverlay.vue";
import SettingsOverlay from "@/components/task-bar/SettingsOverlay.vue";
import PluginUI from "@/components/PluginUI.vue";
import {
  initializeTonalflexSession,
  saveNamedSession,
  loadNamedSession,
  restoreFrontendSession,
  loadSessionSnapshot,
  sessionReady,
  loadingMessage,
} from "@/backend/tonalflexBackend";

const isOverlayEnabled = ref(false);
const selectedView = ref<string | null>("effectmap");

const toggleSelectedView = (button: string) => {
  toggleViewVisiblilty();
  selectedView.value = selectedView.value === button ? "effectmap" : button;
};

const toggleViewVisiblilty = () => {
  if (isOverlayEnabled.value === false) {
    isOverlayEnabled.value = true;
  } else {
    isOverlayEnabled.value = false;
  }
};

const handleSave = async (name: string) => {
  const session = loadSessionSnapshot();
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

onBeforeMount(async () => {
  await initializeTonalflexSession();
});
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 60px 1fr;
  width: 100vw;
  height: 100vh;
  font-family: Arial, sans-serif;
  overflow: hidden;
}

.divider-left {
  width: 100%;
  height: 100%;
}

.divider-right {
  width: 100%;
  height: 100%;
}

.left-panel {
  height: 100%;
  width: 60px;
}

.task-bar {
  position: relative;
  width: 100%;
  height: 72px;
}

.task-bar-overlay {
  width: 100%;
  height: calc(100vh - 72px);
}

.main-panel {
  position: relative;
  width: calc(100vw - 60px);
  height: calc(100vh - 72px);
}

.main-panel:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("@/assets/light-logo.png");
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
