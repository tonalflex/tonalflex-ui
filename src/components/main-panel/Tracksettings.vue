<template>
  <div class="track-settings">
    <!-- Top bar with Add Icon -->
    <div class="header-bar">
      <span>Tracks</span>
      <button class="add-btn" @click="addTrack">
        <AddIcon class="icon" />
      </button>
    </div>

    <!-- List of all tracks including current -->
    <div class="track-list">
      <ul>
        <li
          v-for="(track, index) in localTracks"
          :key="index"
          :class="{ 'track-item': true, selected: index === currentIndex }"
        >
          <template v-if="editingIndex === index">
            <input
              v-model="localTracks[index].name"
              class="track-input"
            />
            <div class="actions">
                <button class="exit-btn left-line">
                    <ExitIcon class="icon" @click="exitRename" />
                </button>
              <button class="save-btn">
                <SaveIcon class="icon" @click="saveRename" />
              </button>
            </div>
          </template>
          <template v-else>
            <span @click="selectTrack(index)">
              {{ track.name }}
            </span>
            <div class="actions">
              <button class="edit-btn left-line" @click.stop="startEditing(index)">
                <EditIcon class="icon" />
              </button>
              <button class="remove-btn" @click.stop="removeTrack(index)">
                <DeleteIcon class="icon" />
              </button>
            </div>
          </template>
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
    import SaveIcon from '@/components/icons/save.vue'
    import ExitIcon from '@/components/icons/exit.vue'

    const props = defineProps<{
    tracks: { name: string }[];
    currentIndex: number;
    }>();

    const emit = defineEmits(['rename-track', 'select-track', 'add-track', 'remove-track']);
    const localTracks = ref(props.tracks.map(t => ({ ...t })));
    const editingIndex = ref<number | null>(null);

    watch(
    () => props.tracks,
    (newTracks) => {
        localTracks.value = newTracks.map(t => ({ ...t }));
    },
    { deep: true }
    );

    const saveRename = () => {
    const trimmed = localTracks.value[props.currentIndex].name.trim();
    if (trimmed) {
        emit('rename-track', {
        index: props.currentIndex,
        newName: trimmed,
        });
        editingIndex.value = null;
    }
    };

    const exitRename = () => {
        editingIndex.value = null;
    }

    const selectTrack = (index: number) => {
    emit('select-track', index);
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
  position: relative;
}

/* New top header bar */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

/* Icon-style button in header */
.add-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  transition: transform 0.2s ease;
}

.add-btn:hover {
  transform: scale(1.1);
}

.icon {
  width: 15px;
  height: 15px;
}

.current-track {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: white;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  border: none;
}

.track-input {
    max-width: 50%;
    padding: 8px;
    font-size: 16px;
    border: none;
    background: none;
    color: white;
    flex: 1;
}

.track-input:focus, input:focus{
    outline: none;
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
  cursor: pointer;
}

.track-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.add-btn,
.remove-btn,
.exit-btn,
.save-btn,
.edit-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;

}

.left-line{
    padding-right: 30px;
}

.add-btn,
.edit-btn,
.exit-btn,
.save-btn,
.add-btn{
    color: limegreen;
}

.exit-btn,
.remove-btn {
  color: red;
}

.edit-btn {
  color: limegreen;
}

/* Slide down animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.dropdown-enter-to,
.dropdown-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>
  