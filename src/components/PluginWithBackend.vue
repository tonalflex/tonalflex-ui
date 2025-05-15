<template>
  <div class="spinner" v-if="!isReady">
    <Spinner/>
  </div>
  <PluginProvider v-else>
    <component :is="component" />
  </PluginProvider>
</template>

<script setup lang="ts">
import { defineComponent, defineProps, h, provide, ref, onMounted } from "vue";
import type { Component } from "vue";
import SushiParameterController from "@/backend/sushi/parameterController";
import { SushiPluginBackend } from "@/backend/sushiPluginBackend";
import { getPluginMetaByComponent, listFilesWrapper } from "@/backend/tonalflexBackend";
import Spinner from "@/components/modules/LoadSpinner.vue"
import { BASE_URL } from "@/backend/baseUrl";
const props = defineProps<{
  component: Component;
  processorId: number;
}>();

const controller = new SushiParameterController(
  BASE_URL + "/sushi"
);
const pluginMeta = getPluginMetaByComponent(props.component);
const backend = new SushiPluginBackend(
  controller,
  props.processorId,
  listFilesWrapper
);

const isReady = ref(false);

onMounted(async () => {
  await backend.ready;
  console.log(
    "[PluginWithBackend] Backend ready for processor",
    props.processorId,
    pluginMeta?.parameters
  );
  isReady.value = true;
});

const PluginProvider = defineComponent({
  setup(_, { slots }) {
    provide("audio-backend", backend);
    return () => h("div", {}, slots.default?.());
  },
});
</script>

<style scoped>

.spinner{
  display:flex;
  justify-content: center;
  align-items: center;
  width:100%;
  height: 100%;
}

</style>