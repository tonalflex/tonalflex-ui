<template>
  <div class="plugin-panel">
    <div v-if="isDesktop" class="plugin-container desktop">
      <PluginCard v-for="plugin in activePlugins" :key="plugin.id" :plugin="plugin" />
    </div>
    <div v-else class="plugin-container mobile">
      <swiper :modules="[SwiperPagination, SwiperNavigation]" :pagination="{ clickable: true }" :navigation="true">
        <swiper-slide v-for="plugin in activePlugins" :key="plugin.id">
          <PluginCard :plugin="plugin" />
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import PluginCard from '@/components/PluginCard.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination as SwiperPagination, Navigation as SwiperNavigation } from 'swiper/modules';

defineProps<{ activePlugins: { id: number; name: string }[] }>();

const windowWidth = ref(window.innerWidth);

const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener('resize', updateWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});

const isDesktop = computed(() => windowWidth.value > 1024);
</script>

<style scoped>
.plugin-panel {
  width: 100%;
}

.plugin-container.desktop {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.plugin-container.mobile {
  width: 100%;
}
</style>
