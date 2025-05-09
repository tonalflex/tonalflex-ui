<template>
  <div class="overlay">
    <div class="button-section">
      <button class="btn" @click="$emit('switch', 'export')"><exportIcon class="btn-icon" /></button>
      <button class="btn" @click="$emit('switch', 'midi')"><midi class="btn-icon" /></button>
      <button class="btn" @click="$emit('switch', 'wifi')"><wifi class="btn-icon" /></button>
      <button class="btn" @click="$emit('close')"><close class="btn-icon" /></button>
    </div>

    <div class="file-section">
      <FileExplorer
        mode="import"
        :files="fileLists[currentFolder]"
        :allowedExtensions="allowedExtensions"
        @folder-changed="selectFolder"
        @file-selected="importFile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { listFilesWrapper, uploadToFolder } from '@/backend/tonalflexBackend';
import FileExplorer from '@/components/modules/FileExplorer.vue';
import close from '@/components/icons/close.vue';
import exportIcon from '@/components/icons/exportIcon.vue';
import midi from '@/components/icons/midi.vue';
import wifi from '@/components/icons/wifi.vue';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'switch', target: string): void;
}>();

const fileLists = ref<Record<'NAM' | 'IR', string[]>>({
  NAM: [],
  IR: []
});
const currentFolder = ref<'NAM' | 'IR'>('NAM');

const folderMap = {
  NAM: '/home/mind/NAM',
  IR: '/home/mind/IR'
};

const allowedExtensions = computed(() =>
  currentFolder.value === 'NAM' ? ['.nam'] : ['.wav']
);

const fetchFileList = async (folder: 'NAM' | 'IR') => {
  const files = await listFilesWrapper(folderMap[folder]);
  fileLists.value[folder] = files;
};

const selectFolder = async (folder: string) => {
  if (folder !== 'NAM' && folder !== 'IR') return;
  currentFolder.value = folder;
  if (fileLists.value[folder].length === 0) {
    await fetchFileList(folder);
  }
};

const importFile = async (files: File[]) => {
  const folderPath = folderMap[currentFolder.value];

  for (const file of files) {
    try {
      await uploadToFolder(folderPath, file);
      console.log(`Imported ${file.name} to ${currentFolder.value}`);
    } catch (err) {
      console.error('Failed to import file:', file.name, err);
    }
  }

  await fetchFileList(currentFolder.value);
};

onMounted(() => {
  selectFolder(currentFolder.value);
});
</script>

<style scoped>
.overlay {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.button-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
  gap: 10px;
}

.btn {
  width: 50px;
  height: 50px;
  background: none;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.btn-icon {
  width: 30px;
  height: 30px;
  color: rgba(255, 255, 255, 0.6);
}

.file-section {
  flex: 1;
  display: flex;
  justify-content: center;
}
</style>
