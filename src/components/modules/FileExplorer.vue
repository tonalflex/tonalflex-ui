<template>
  <div class="file-explorer">
    <div class="folder-select">
      <label>Browse Folder:</label>
      <select v-model="currentFolder">
        <option v-for="folder in availableFolders" :key="folder" :value="folder">{{ folder }}</option>
      </select>
    </div>

    <div class="file-list">
      <div v-if="files.length === 0" class="empty-placeholder">No files found</div>
      <div v-else v-for="file in files" :key="file" class="file-item">{{ file }}</div>
    </div>

    <button class="file-action" @click="triggerFileChooser">
      {{ props.mode === 'import' ? 'Import File' : 'Export File' }}
    </button>

		<input
			type="file"
			ref="fileInput"
			style="display: none"
			multiple
			:accept="props.allowedExtensions?.join(',')"
			@change="handleFileSelected"
		/>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  mode: 'import' | 'export';
  files: string[];
  allowedExtensions?: string[];
}>();

const emit = defineEmits<{
  (e: 'file-selected', files: File[]): void;
  (e: 'folder-changed', folder: string): void;
}>();

const availableFolders = ['NAM', 'IR'];
const currentFolder = ref('NAM');

watch(currentFolder, (folder) => {
  emit('folder-changed', folder);
});

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileChooser = () => {
  fileInput.value?.click();
};

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);

  const validFiles = props.allowedExtensions
    ? files.filter(file => {
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        return props.allowedExtensions!.includes(ext);
      })
    : files;

  if (validFiles.length === 0) {
    alert(`Invalid file type. Allowed: ${props.allowedExtensions?.join(', ')}`);
    return;
  }

  emit('file-selected', validFiles);
};
</script>

<style scoped>
.file-explorer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  overflow-y: auto;
}

.folder-select {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-list {
  width: 90%;
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #555;
  background: #1e1e1e;
  padding: 0.5rem;
}

.file-item {
  padding: 4px;
  border-bottom: 1px solid #333;
  color: white;
}

.file-action {
  padding: 0.5rem 1rem;
  background: #333;
  color: white;
  border: 1px solid #888;
  border-radius: 4px;
  cursor: pointer;
}
</style>
