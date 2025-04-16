<template>
  <div class="track-settings">
    <div class="header-bar">
      <span>Tracks</span>
      <button class="add-btn" @click="addTrack">
        <AddIcon class="icon" />
      </button>
    </div>

    <div class="track-list">
      <ul>
        <li
          v-for="(track, index) in localTracks"
          :key="index"
          :class="{ 'track-item': true, selected: index === currentIndex }"
        >
          <div class="track-name" @click="selectTrack(index)" v-if="editingIndex !== index">
            <span class="name">{{ track.name }}</span>
          </div>

          <div class="track-edit" v-else>
            <input
              v-model="localTracks[index].name"
              class="track-input"
            />
          </div>

          <div class="actions">
            <template v-if="editingIndex === index">
              <button class="exit-btn" @click="exitRename">
                <ExitIcon class="icon" />
              </button>
              <button class="save-btn" @click="saveRename(index)">
                <SaveIcon class="icon" />
              </button>
            </template>
            <template v-else>
              <button class="edit-btn" @click.stop="startEditing(index)">
                <EditIcon class="icon" />
              </button>
              <button class="remove-btn" @click.stop="removeTrack(index)">
                <DeleteIcon class="icon" />
              </button>
            </template>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, watch } from 'vue';
import AddIcon from '@/components/icons/add.vue';
import DeleteIcon from '@/components/icons/delete.vue';
import EditIcon from '@/components/icons/edit.vue';
import SaveIcon from '@/components/icons/save.vue';
import ExitIcon from '@/components/icons/exit.vue';

const props = defineProps<{
  tracks: { name: string }[];
  currentIndex: number;
}>();

const emit = defineEmits([
  'rename-track',
  'select-track',
  'add-track',
  'remove-track',
  'close'
]);

const localTracks = ref(props.tracks.map(t => ({ ...t })));
const editingIndex = ref<number | null>(null);

watch(
  () => props.tracks,
  (newTracks) => {
    localTracks.value = newTracks.map(t => ({ ...t }));
  },
  { deep: true }
);

const saveRename = (index: number) => {
  const trimmed = localTracks.value[index].name.trim();
  if (trimmed) {
    emit('rename-track', { index, newName: trimmed });
    editingIndex.value = null;
  }
};

const exitRename = () => {
  editingIndex.value = null;
};

const selectTrack = (index: number) => {
  emit('select-track', index);
  emit('close'); // auto-close on select
};

const addTrack = () => {
  emit('add-track');
};

const removeTrack = (index: number) => {
  emit('remove-track', index);
};

const startEditing = (index: number) => {
  editingIndex.value = index;
};
</script>
  
<style scoped>
.track-settings {
  padding: 20px;
  width: 100%;
  max-width: calc(100vw - 80px);
  box-sizing: border-box;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.track-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.track-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  gap: 10px;
  cursor: pointer;
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.track-name {
  flex: 1;
  padding: 6px 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.track-edit {
  flex: 1;
}

.name {
  user-select: none;
}

.track-input {
  width: 100%;
  padding: 6px;
  font-size: 16px;
  background: none;
  border: none;
  color: white;
  border-bottom: 1px solid #555;
}

.track-input:focus {
  outline: none;
}

.actions {
  display: flex;
  gap: 6px;
}

.add-btn,
.remove-btn,
.edit-btn,
.save-btn,
.exit-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}

.icon {
  width: 18px;
  height: 18px;
}

.edit-btn,
.save-btn,
.add-btn {
  color: limegreen;
}

.remove-btn,
.exit-btn {
  color: red;
}
</style>  