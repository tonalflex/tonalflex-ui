<template>
  <div class="input-plugin-container">
    <div class="task-bar">
      <span class="label">Input / Track</span>
    </div>
    <div class="slider-section">
      <SliderControl
        label="Input"
        v-model="inputGain"
        :knobImage="Knob"
        :frames="101"
        :range="[0, 1]"
      />
      <SliderControl
        label="Gain"
        v-model="trackGain"
        :knobImage="Knob"
        :frames="101"
        :range="[0, 1]"
      />
      <SliderControl
        label="Pan"
        v-model="trackPan"
        :knobImage="PanKnob"
        :frames="101"
        :range="[-1, 1]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import SliderControl from "@/components/modules/SliderController.vue";
import Knob from "@/assets/knob-101.png";
import PanKnob from "@/assets/pan-knob-101.png";
import { getTrackGain, setTrackGain, getTrackPan, setTrackPan, sushiTrackRoles } from "@/backend/tonalflexBackend";

const props = defineProps<{
  trackId: number;
}>();

const inputGain = ref(1);
const trackGain = ref(1);
const trackPan = ref(0);

watch(inputGain, (v) => {
  const preId = sushiTrackRoles.pre.value;
  if (preId != null) setTrackGain(preId, v);
});



watch(trackGain, (v) => {
  setTrackGain(props.trackId, v);
});

watch(trackPan, (v) => {
  setTrackPan(props.trackId, v);
});

onMounted(async () => {
  const preId = sushiTrackRoles.pre.value;
  if (preId != null) inputGain.value = await getTrackGain(preId);
  trackGain.value = await getTrackGain(props.trackId);
  trackPan.value = await getTrackPan(props.trackId);
});
</script>

<style scoped>

.input-plugin-container{
  width: 100%;
  max-width: 450px;
  height: auto;
  background:
    radial-gradient(ellipse at top, #e66465, transparent),
    radial-gradient(ellipse at bottom, #4d9f0c, transparent);
  border-radius: 8px;
  user-select: none;
}

.task-bar{
  width: 100%;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border-left: 1px solid rgba(73, 73, 73, 0.7);
  border-top: 1px solid rgba(73, 73, 73, 0.7);
  border-right: 1px solid rgba(73, 73, 73, 0.7);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.slider-section{
  width: 100%;
  height:100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 3%;
  padding: 20px;
  border: 2px solid rgba(73, 73, 73, 0.7);
  overflow: hidden;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

</style>