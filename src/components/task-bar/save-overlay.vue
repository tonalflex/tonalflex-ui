<template>
<h2>Save overlay</h2>
<button @button-clicked="handleSaveClick">SAVE</button>
</template>

<script setup lang="ts">
import { useTonalFlexSession } from '@/composables/useTonalFlexSession';

const { save } = useTonalFlexSession();

const handleSaveClick = async () => {
  await save();
};
</script>