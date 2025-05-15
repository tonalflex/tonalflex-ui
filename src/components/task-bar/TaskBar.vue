<template>
  <div class="task-bar">
    <div class="left-group">
      <button
        class="btn-toggle"
        @click="toggleCurrentTrackMute"
      >
        <SpekaerOn class="mute-icon"  v-if="!isCurrentTrackMuted"/>
        <SpeakerOff class="mute-icon" v-if="isCurrentTrackMuted"/>
        <LedToggle :model-value="isCurrentTrackMuted" :ledImage="GreenLed"/>
      </button>
    </div>
    <div class="right-group">
      <button
        class="btn"
        :class="{ active: selectedButton === 'save' }"
        @click="selectButton('save')"
      >
        <SaveIcon class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'load' }"
        @click="selectButton('load')"
      >
        <LoadIcon class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'help' }"
        @click="selectButton('help')"
      >
        <HelpIcon class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'settings' }"
        @click="selectButton('settings')"
      >
        <SettingsIcon class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import { isCurrentTrackMuted, toggleCurrentTrackMute } from "@/backend/tonalflexBackend";
import SaveIcon from "@/components/icons/save.vue";
import LoadIcon from "@/components/icons/load.vue";
import HelpIcon from "@/components/icons/help.vue";
import SettingsIcon from "@/components/icons/settings.vue";
import GreenLed from "@/assets/green-led.png"
import LedToggle from "@/components/modules/LedToggleController.vue";
import SpekaerOn from "@/components/icons/unmuted.vue"
import SpeakerOff from "@/components/icons/muted.vue"

const props = defineProps<{
  selectedButton?: string;
}>();

const emit = defineEmits<{
  (e: "button-clicked", button: string): void;
}>();

const selectButton = (button: string) => {
  emit("button-clicked", button);
};
</script>

<style scoped>
.task-bar {
  display: flex;
  justify-content: space-between; /* Pushes left-group to left, right-group to right */
  align-items: center;
  width: 100%;
  height: 50px;
  color: white;
  text-align: center;
}

.left-group{
  display: flex;
  height: 72px;
  justify-content: center;
  align-items: center;
  padding-left: 15px;
}

.mute-text{
  color:rgba(255, 255, 255, 0.6);
  margin-right: 8px;
  font-size: 14px;
  font-weight: 600;
  text-transform:uppercase;
}

.btn-toggle{
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  min-width: 70px;
  height: 40px;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
  cursor: pointer;
}

.right-group {
  display: flex;
  height: 72px;
  justify-content: center;
  align-items: center;
  padding: 10px;
  gap: 10px;
}

.logo-container {
  flex: 0 0 auto; /* Prevents the logo from stretching */
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn{
  display:flex;
  justify-content: center;
  align-items: center;
  width:50px;
  height: 50px;
  border:none;
  background:none;
}

.btn:hover{
  cursor: pointer;
}

.btn-icon{
  color:rgba(255, 255, 255, 0.6);
  width:30px;
  height: 30px;
}

.mute-icon{
  color:rgba(255, 255, 255, 0.6);
  width:35px;
  height: 35px;
  margin-right: 15px;
}
</style>
