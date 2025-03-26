<template>

  <div class="side-bar">
    <div class="menu-buttons">
      <button
        class="btn"
        :class="{ active: selectedButton === 'looper' }"
        @click="selectButton('looper')"
      >
        <OhVueIcon name="co-loop" class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'tuner' }"
        @click="selectButton('tuner')"
      >
        <TunerIcon class="btn-icon-custom" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'metronome' }"
        @click="selectButton('metronome')"
      >
        <OhVueIcon name="gi-metronome" class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'effectmap' }"
        @click="selectButton('effectmap')"
      >
        <AmpIcon class="btn-icon-custom" />
      </button>
    </div>
    <div class="volume-headphone">
      <OhVueIcon name="bi-headphones" class="icon" />
      <input
        type="range"
        min="1"
        orient="vertical"
        max="100"
        value="75"
        v-model="volume"
        class="slider"
        @touchstart="lockScroll"
        @touchmove="lockScroll"
        @touchend="unlockScroll"
      />
    </div>
    <div class="volume-master">
      <OhVueIcon name="bi-volume-up" class="icon" />
      <input
        type="range"
        min="1"
        orient="vertical"
        max="100"
        value="75"
        v-model="masterVolume"
        class="slider"
        @touchstart="lockScroll"
        @touchmove="lockScroll"
        @touchend="unlockScroll"
      />
    </div>
  </div>

</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { BiHeadphones } from "oh-vue-icons/icons";
import { BiVolumeUp } from "oh-vue-icons/icons";
import { FaUserAlt } from "oh-vue-icons/icons";
import { GiMetronome } from "oh-vue-icons/icons";
import { OiRepoForked } from "oh-vue-icons/icons";
import TunerIcon from '@/components/icons/tuner.vue'
import AmpIcon from '@/components/icons/amplifier-icon.vue'
import { CoLoop } from "oh-vue-icons/icons";
import SystemController from "@/stores/sushi/systemController";

// Register the icon
addIcons(BiHeadphones);
addIcons(BiVolumeUp);
addIcons(FaUserAlt);
addIcons(GiMetronome);
addIcons(OiRepoForked);
addIcons(CoLoop)

export default defineComponent({
  name: "LeftPanel",
  props: {
    selectedButton: String
  },
  setup(_, { emit }) {
    const volume = ref(75);
    const masterVolume = ref(75);

    const selectButton = (button: string) => {
      emit("button-clicked", button); // Emit event with button name
    };

    // Prevents scrolling while allowing touch input
    const lockScroll = (event: TouchEvent) => {
      if (event.cancelable) {
        event.stopPropagation(); // Stops event bubbling
        document.body.style.overflow = "hidden"; // Prevents page scrolling
      }
    };

    // Re-enable scrolling when the touch ends
    const unlockScroll = () => {
      document.body.style.overflow = ""; // Restores scrolling
    };

    return { volume, masterVolume, selectButton, lockScroll, unlockScroll };
  },
  components: {
    OhVueIcon,
    TunerIcon,
    AmpIcon,
  },
  methods: {
    // for debugging
    async fetchSystemInfo() {
      const baseUrl = "http://192.168.132.108:8081/sushi";
      const systemController = new SystemController(baseUrl);

      try {
        console.log("Fetching Sushi System Info...");
        const version = await systemController.getSushiVersion();
        console.log("Sushi Version:", version);

        const buildInfo = await systemController.getBuildInfo();
        console.log("Sushi Build Info:", buildInfo);

        const inputChannels = await systemController.getInputAudioChannelCount();
        console.log("Input Audio Channels:", inputChannels);

        const outputChannels = await systemController.getOutputAudioChannelCount();
        console.log("Output Audio Channels:", outputChannels);
      } catch (err) {
        console.error("Failed to fetch system info:", err);
      }
    },
  },
});
</script>

<style scoped>
.side-bar{
  display: grid;
  grid-template-columns: 80px;
  grid-template-rows: 3fr 3fr 3fr;
  height: 100vh;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(51, 51, 51, 0.2)
}

.menu-buttons{
  display: grid;
  gap: 15px;
  padding: 15px;
  justify-content: center;

}

.btn{
  display:flex;
  justify-content: center;
  align-items: center;
  width:40px;
  height: 40px;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
}

.btn:hover {
  cursor: pointer;
}

.btn-icon{
  width:30px;
  height: 30px;
  color:rgba(255, 255, 255, 0.6);
}

.btn-icon-custom{
  width:20px;
  height: 20px;
  color:rgba(255, 255, 255, 0.6);
}

.icon {
  width: 40px;
  height: 40px;
  color:rgba(255, 255, 255, 0.6);
}

.volume-headphone{
  display: grid;
  grid-template-rows: auto 1fr;
  justify-content: center;
  align-items: start;
}

.volume-master{
  display: grid;
  grid-template-rows: auto 1fr;
  justify-content: center;
  align-items: start;
}

.slider{
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width:10px;
  background-color:rgb(36, 36, 36);
  border: 1px solid rgba(142, 142, 142, 0.3);
  height: 95%;
  justify-self: center;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 35px;
  height: 70px;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
}

.slider::-moz-range-thumb {
  width: 35px;
  height: 70px;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
}

.slider:hover {
  cursor: pointer;
}

</style>
