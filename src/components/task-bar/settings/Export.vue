
<template>
<!-- 
    <div class="overlay">
      <div class="button-section">
        <button class="btn" @click="$emit('switch', 'import')"><importIcon class="btn-icon" /></button>
        <button class="btn" @click="$emit('switch', 'midi')"><midi class="btn-icon" /></button>
        <button class="btn" @click="$emit('switch', 'wifi')"><wifi class="btn-icon" /></button>
        <button class="btn" @click="$emit('close')"><close class="btn-icon" /></button>
      </div>
  
      <div class="file-section">
        <FileExplorer
          mode="import"
          :files="fileLists[currentFolder]"
          @folder-changed="selectFolder"
          @file-selected="(f) => console.log('Importing:', f.name)"
        />
      </div>
    </div>
   -->   
  </template>

  <script setup lang="ts">
  /*
  import { ref, onMounted } from 'vue';
  import { listFilesWrapper } from '@/backend/tonalflexBackend';
  import FileExplorer from '@/components/modules/FileExplorer.vue';
  import close from '@/components/icons/close.vue';
  import importIcon from '@/components/icons/importIcon.vue';
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
  
  const folderMap: Record<'NAM' | 'IR', string> = {
    NAM: '/home/mind/NAM',
    IR: '/home/mind/IR'
  };
  
  const fetchFileList = async (folderKey: 'NAM' | 'IR') => {
    const folderPath = folderMap[folderKey];
    const files = await listFilesWrapper(folderPath);
    fileLists.value[folderKey] = files;
  };
  
  const selectFolder = async (folder: string) => {
      if (folder !== 'NAM' && folder !== 'IR') return; // optional safety check
  
      currentFolder.value = folder;
      if (fileLists.value[folder].length === 0) {
          await fetchFileList(folder);
      }
  };
  
  onMounted(() => {
    selectFolder(currentFolder.value);
  });
  */
  </script>
    
  <style scoped>
  /*
      .overlay{
          width: 100%;
          height: 100%;
          display: flex;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          flex-direction: column;
      }
  
      .button-section{
          width: 100%;
          display:flex;
          justify-content: right;
          align-items: center;
          padding: 10px;
          gap: 10px;
      }
  
      .btn {
          display:flex;
          justify-content: center;
          align-items: center;
          width:50px;
          height: 50px;
          border:none;
          background:none;
          cursor: pointer;
      }
  
      .btn-icon{
          color:rgba(255, 255, 255, 0.6);
          width:30px;
          height: 30px;
      }
  
      .file-section{
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
      }
*/
</style>
    