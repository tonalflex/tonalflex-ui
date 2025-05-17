import { ref, onMounted, onUnmounted } from 'vue';

export function useMobileHeight(threshold = 600) {
  const isMobile = ref(window.innerHeight <= threshold);

  const update = () => {
    isMobile.value = window.innerHeight <= threshold;
  };

  onMounted(() => {
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    update(); // Ensure correct initial value
  });

  onUnmounted(() => {
    window.removeEventListener('resize', update);
    window.removeEventListener('orientationchange', update);
  });

  return isMobile;
}
