<template>
    <div class="overlay">
        <div class="button-section">
            <button class="btn" @click="$emit('switch', 'import')"><importIcon class="btn-icon"/></button>
            <button class="btn" @click="$emit('switch', 'export')"><exportIcon class="btn-icon"/></button>
            <button class="btn" @click="$emit('switch', 'wifi')"><wifi class="btn-icon"/></button>
            <button class="btn" @click="$emit('close')"><close class="btn-icon"/></button>
        </div>
        <div class="file-section">
            <FileExplorer mode="import" @file-selected="handleImportFile" />
        </div>
    </div>
</template>
  
<script setup lang="ts">
    import FileExplorer from '@/components/modules/FileExplorer.vue';
    import close from '@/components/icons/close.vue';
    import exportIcon from '@/components/icons/exportIcon.vue';
    import importIcon from '@/components/icons/importIcon.vue';
    import wifi from '@/components/icons/wifi.vue';
  

    defineEmits<{
        (e: 'close'): void;
        (e: 'switch', target: string): void;
    }>();
</script>
  
<style scoped>
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
</style>
  