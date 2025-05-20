<template>
  <div class="side-bar">
    <div class="menu-buttons">
      <div class="group-1">
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
      </div>
      <div class="group-2">
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
          @click="fetchSystemInfo"
        >
          <AmpIcon class="btn-icon-custom" />
        </button>
      </div>
    </div>
    <div class="volume-headphone" v-if="!isMobile">
      <OhVueIcon name="bi-headphones" class="icon" />
      <div class="slider-wrapper">
        <div class="peak-meter">
          <div class="meter-fill" :style="{ height: `${peakL * 100}%` }" />
        </div>
        <input
          type="range"
          min="1"
          orient="vertical"
          max="100"
          :style="{
            background: getSliderFill(currentSliderValue),
          }"
          v-model="currentSliderValue"
          class="slider"
          @touchstart="lockScroll"
          @touchmove="lockScroll"
          @touchend="unlockScroll"
        />
        <div class="peak-meter">
          <div class="meter-fill" :style="{ height: `${peakR * 100}%` }" />
        </div>
      </div>
    </div>
    <div class="volume-master">
      <OhVueIcon
        :name="isMobile && currentSlider === 'headphones' ? 'bi-headphones' : 'bi-volume-up'"
        class="icon"
        @click="isMobile && toggleSlider()"
      />
      <div class="slider-wrapper">
        <div class="peak-meter">
          <div class="meter-fill" :style="{ height: `${peakL * 100}%` }" />
        </div>
        <input
          type="range"
          min="1"
          orient="vertical"
          max="100"
          :style="{
             background: getSliderFill(currentSliderValue),
          }"
          v-model="currentSliderValue"
          class="slider"
          @touchstart="lockScroll"
          @touchmove="lockScroll"
          @touchend="unlockScroll"
        />
        <div class="peak-meter">
          <div class="meter-fill" :style="{ height: `${peakR * 100}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed} from "vue";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
  BiHeadphones,
  BiVolumeUp,
  FaUserAlt,
  GiMetronome,
  OiRepoForked,
  CoLoop,
} from "oh-vue-icons/icons";
import TunerIcon from "@/components/icons/tuner.vue";
import AmpIcon from "@/components/icons/amplifier-icon.vue";
import { useMobileHeight} from "@/backend/utils/useMobileHeight"
import { getTrackGain, setTrackGain, sushiTrackRoles, subscribeToPeakLevel } from "@/backend/tonalflexBackend";
//import SystemController from '@/backend/sushi/systemController';
//import audioRoutingController from '@/backend/sushi/audioRoutingController'
import audiooGraphController from "@/backend/sushi/audioGraphController";
import parameterController from "@/backend/sushi/parameterController";
//import { ParameterController } from '@/proto/sushi/sushi_rpc';
// import { cvInputLevel } from '@/stores/tonalflex/functions';

// Register icons
addIcons(
  BiHeadphones,
  BiVolumeUp,
  FaUserAlt,
  GiMetronome,
  OiRepoForked,
  CoLoop
);

// Props
defineProps<{
  selectedButton?: string;
}>();

// Emits
const emit = defineEmits<{
  (e: "button-clicked", button: string): void;
}>();

const isMobile = useMobileHeight(); 

const currentSlider = ref<'master' | 'headphones'>('master');
const toggleSlider = () => {
  currentSlider.value = currentSlider.value === 'master' ? 'headphones' : 'master';
};

// State
const volume = ref(50);
const masterVolume = ref(0);
const peakL = ref(0);
const peakR = ref(0);

const currentSliderValue = computed({
  get: () =>
    currentSlider.value === 'headphones'
      ? masterVolume.value // set to masterVolume for now as we only have one input.
      : masterVolume.value,
  set: (val: number) => {
    if (isMobile.value && currentSlider.value === 'headphones') {
      volume.value = val;
    } else {
      masterVolume.value = val;
    }
  }
});

watch(masterVolume, (v) => {
  const postId = sushiTrackRoles.post.value;
  if (postId != null) {
    const gain = v / 100; // normalize
    setTrackGain(postId, gain);
  }
});

onMounted(async () => {
const postId = sushiTrackRoles.post.value;
if (postId != null) {
  const gain = await getTrackGain(postId);
  masterVolume.value = Math.round(gain * 100);
  const left = await subscribeToPeakLevel(0);
  const right = await subscribeToPeakLevel(1);
  watch(left, (v) => (peakL.value = v));
  watch(right, (v) => (peakR.value = v));
}
});

// Events
const selectButton = (button: string) => {
  emit("button-clicked", button);
};

// Prevent scrolling on touch
const lockScroll = (event: TouchEvent) => {
  if (event.cancelable) {
    event.stopPropagation();
    document.body.style.overflow = "hidden";
  }
};

const unlockScroll = () => {
  document.body.style.overflow = "";
};

const getSliderFill = (value: number): string => {
  const percent = Math.max(0, Math.min(100, value));
  return `linear-gradient(to top,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.5) ${percent}%,
    transparent ${percent}%,
    transparent 100%
  )`;
};

// Debug method (optional for dev tools/testing)
const fetchSystemInfo = async () => {
  const baseUrl = "http://elk-pi.local:8081/sushi";
  const audioGraphCtrl = new audiooGraphController(baseUrl);
  const parameterCtrl = new parameterController(baseUrl);

  console.log("Fetching Sushi System Info...");

  const tracks = await audioGraphCtrl.getAllTracks();
  console.log("tracks: ", tracks);

  const processorId = 10;
  //const testValue = 0.86;

 
  // Fetch all parameters for the processor
  const paramList = await parameterCtrl.getProcessorParameters(processorId);
  console.log("param list:", paramList);
  
};
</script>

<style scoped>
.side-bar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(51, 51, 51, 0.2);
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.group-1,
.group-2{
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
}

.btn:hover {
  cursor: pointer;
}

.btn-icon {
  width: 30px;
  height: 30px;
  color: rgba(255, 255, 255, 0.6);
}

.btn-icon-custom {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.icon {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.6);
}

.volume-headphone,
.volume-master {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5px;
  overflow: hidden;
}

.slider-wrapper {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 18px;
}

.peak-meter {
  width: 2px;
  background-color: rgba(51, 51, 51, 0.2);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.meter-fill {
  width: 100%;
  background: linear-gradient(to bottom, red, lime);
  transition: height 0.1s ease;
}

.slider {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width: 10px;
  border-left: 1px solid rgba(142, 142, 142, 0.3);
  border-right: 1px solid rgba(142, 142, 142, 0.3);
  border-bottom: 1px solid rgba(142, 142, 142, 0.3);
  justify-self: center;
  transition: background 0.1s ease;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
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

/* -------- MOBILE RESPONSIVE -------- */
@media (max-height: 600px) {

  .icon{
    cursor: pointer;
  }
}
</style>
