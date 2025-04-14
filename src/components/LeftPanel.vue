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
       
        @click="fetchSystemInfo"
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
        :style="{
          background: getGradientFill(cvInputLevel)
        }"
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
        :style="{
          background: getGradientFill(cvInputLevel)
        }"
        v-model="masterVolume"
        class="slider"
        @touchstart="lockScroll"
        @touchmove="lockScroll"
        @touchend="unlockScroll"
      />
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { BiHeadphones, BiVolumeUp, FaUserAlt, GiMetronome, OiRepoForked, CoLoop } from 'oh-vue-icons/icons';
import TunerIcon from '@/components/icons/tuner.vue';
import AmpIcon from '@/components/icons/amplifier-icon.vue';
import SystemController from '@/backend/sushi/systemController';
import audioRoutingController from '@/backend/sushi/audioRoutingController'
import audiooGraphController from '@/backend/sushi/audioGraphController'
import parameterController from '@/backend/sushi/parameterController'
import { ParameterController } from '@/proto/sushi/sushi_rpc';
// import { cvInputLevel } from '@/stores/tonalflex/functions';

// Register icons
addIcons(BiHeadphones, BiVolumeUp, FaUserAlt, GiMetronome, OiRepoForked, CoLoop);

// Props
defineProps<{
  selectedButton?: string;
}>();

// Emits
const emit = defineEmits<{
  (e: 'button-clicked', button: string): void;
}>();

// State
const volume = ref(50);
const masterVolume = ref(50);

// Events
const selectButton = (button: string) => {
  emit('button-clicked', button);
};

// Prevent scrolling on touch
const lockScroll = (event: TouchEvent) => {
  if (event.cancelable) {
    event.stopPropagation();
    document.body.style.overflow = 'hidden';
  }
};

const unlockScroll = () => {
  document.body.style.overflow = '';
};

const cvInputLevel = ref(0.9);

const getGradientFill = (level: number): string => {
  const clampedLevel = Math.max(0, Math.min(1, level)); // Ensure 0-1 range
  const levelPercent = clampedLevel * 100;

  return `linear-gradient(to top, 
    #00FF00 0%,          /* Pure green at bottom */
    #FF0000 100%         /* Pure red at top */
  )`;
};

// Debug method (optional for dev tools/testing)
const fetchSystemInfo = async () => {
  const baseUrl = 'http://elk-pi.local:8081/sushi';
  const audioGraphCtrl = new audiooGraphController(baseUrl);
  const parameterCtrl = new parameterController(baseUrl);

  try {
    console.log('Fetching Sushi System Info...');
    //const version = await systemController.getSushiVersion();
    //console.log('Sushi Version:', version);

    //const buildInfo = await systemController.getBuildInfo();
    //console.log('Sushi Build Info:', buildInfo);

    //const inputChannels = await systemController.getInputAudioChannelCount();
    //console.log('Input Audio Channels:', inputChannels);

    //const outputChannels = await systemController.getOutputAudioChannelCount();
    //onsole.log('Output Audio Channels:', outputChannels);

    //const inputChan = await audioRoutingCtrl.getAllInputConnections();
    //console.log("input:", inputChan);

    //const outputChan = await audioRoutingCtrl.getAllOutputConnections();
    //console.log("input:", outputChan);

    const processes = await audioGraphCtrl.getAllProcessors();
    console.log("processes: ", processes);

    const tracks = await audioGraphCtrl.getAllTracks();
    console.log("tracks: ", tracks);

    const param = await parameterCtrl.getProcessorParameters(28);
    console.log("parameter: ", param);

    // debug for re adding send!
    const processorId = 28; // e.g., Track1_send

    const props = await parameterCtrl.getProcessorProperties(processorId);
    console.log('[Props]', props);

    const destinationProp = props.properties.find(p =>
      p.name === 'destination_name' || p.name === 'destination' || p.name === 'dest_track'
    );

    if (!destinationProp) {
      console.warn('Destination property not found');
    } else {
      const value = await parameterCtrl.getPropertyValue({
        processorId,
        propertyId: destinationProp.id
      });
      console.log(`Destination property value for processor ${processorId}:`, value);
    }
    //const trackProcessors = await audioGraphCtrl.getTrackProcessors(2);
    //console.log("processors on track: ", trackProcessors);

    //const trackParams = await parameterCtrl.getTrackParameters(0);
    //console.log("track Parameters: ", trackParams);
  } catch (err) {
    console.error('Failed to fetch system info:', err);
  }
};
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
  border-left: 1px solid rgba(142, 142, 142, 0.3);
  border-right: 1px solid rgba(142, 142, 142, 0.3);
  border-bottom: 1px solid rgba(142, 142, 142, 0.3);
  height: 95%;
  justify-self: center;
  transition: background 0.1s ease;
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
