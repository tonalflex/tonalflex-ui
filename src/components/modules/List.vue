<template>
    <div class="list-settings">
      <div class="header-bar">
        <span>{{ title }}</span>
        <button class="add-btn" @click="addItem" :disabled="isAtLimit">
          <AddIcon class="icon" />
        </button>
      </div>
  
      <div class="item-list">
        <ul>
          <li
            v-for="(item, index) in localItems"
            :key="index"
            :class="{ 'list-item': true, selected: index === currentIndex }"
          >
            <div class="item-name" @click="selectItem(index)" v-if="editingIndex !== index">
              <span class="name">{{ item.name }}</span>
            </div>
  
            <div class="item-edit" v-else>
              <input
                v-model="localItems[index].name"
                class="item-input"
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
                <button class="remove-btn" @click.stop="removeItem(index)">
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
  import { ref, watch, computed } from 'vue';
  import AddIcon from '@/components/icons/add.vue';
  import DeleteIcon from '@/components/icons/delete.vue';
  import EditIcon from '@/components/icons/edit.vue';
  import SaveIcon from '@/components/icons/save.vue';
  import ExitIcon from '@/components/icons/exit.vue';
  
  const props = defineProps<{
    items: { name: string }[];
    currentIndex: number;
    title: string;
    listLimit?: number;
  }>();
  
  const emit = defineEmits([
    'rename-item',
    'select-item',
    'add-item',
    'remove-item',
    'close'
  ]);
  
  const localItems = ref(props.items.map(t => ({ ...t })));
  const editingIndex = ref<number | null>(null);
  
  watch(
    () => props.items,
    (newItems) => {
      localItems.value = newItems.map(t => ({ ...t }));
    },
    { deep: true }
  );
  
  const saveRename = (index: number) => {
    const trimmed = localItems.value[index].name.trim();
    if (trimmed) {
      emit('rename-item', { index, newName: trimmed });
      editingIndex.value = null;
    }
  };
  
  const exitRename = () => {
    editingIndex.value = null;
  };
  
  const selectItem = (index: number) => {
    emit('select-item', index);
    emit('close'); // auto-close on select
  };
  
  const addItem = () => {
    emit('add-item');
  };
  
  const removeItem = (index: number) => {
    emit('remove-item', index);
  };
  
  const startEditing = (index: number) => {
    editingIndex.value = index;
  };

  const isAtLimit = computed(() => {
    return props.listLimit !== undefined && props.items.length >= props.listLimit;
  });
  </script>
  
  <style scoped>
  .list-settings {
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
  
  .item-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    gap: 10px;
    cursor: pointer;
  }
  
  .list-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .item-name {
    flex: 1;
    padding: 6px 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  
  .item-edit {
    flex: 1;
  }
  
  .name {
    user-select: none;
  }
  
  .item-input {
    width: 100%;
    padding: 6px;
    font-size: 16px;
    background: none;
    border: none;
    color: white;
    border-bottom: 1px solid #555;
  }
  
  .item-input:focus {
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
  
  .add-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .icon {
    width: 18px;
    height: 18px;
  }
  
  .edit-btn,
  .save-btn,
  .add-btn {
    color: white;
  }
  
  .remove-btn,
  .exit-btn {
    color: rgba(255, 255, 255, 0.6);
  }
  </style>
  