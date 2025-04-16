<template>
  <div class="task-bar">
    <div class="divider-group"></div>
    <div class="right-group">
      <button
        class="btn"
        :class="{ active: selectedButton === 'save' }"
        @click="selectButton('save')"
      >
        <SaveIcon class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'load' }"
        @click="selectButton('load')"
      >
        <LoadIcon class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'help' }"
        @click="selectButton('help')"
      >
        <HelpIcon class="btn-icon" />
      </button>
      <button
        class="btn"
        :class="{ active: selectedButton === 'settings' }"
        @click="selectButton('settings')"
      >
        <SettingsIcon class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import SaveIcon from "@/components/icons/save.vue"
import LoadIcon from "@/components/icons/load.vue"
import HelpIcon from "@/components/icons/help.vue"
import SettingsIcon from "@/components/icons/settings.vue"

export default defineComponent({
  name: "LeftPanel",
  props: {
    selectedButton: String
  },
  setup(_, { emit }) {

    const selectButton = (button: string) => {
      emit("button-clicked", button); // Emit event with button name
    };

    return { selectButton };
  },
  components: {
    SaveIcon,
    LoadIcon,
    HelpIcon,
    SettingsIcon,
  },
});
</script>

<style scoped>
.task-bar {
  display: flex;
  justify-content: space-between; /* Pushes left-group to left, right-group to right */
  align-items: center;
  width: 100%;
  height: 50px;
  color: white;
  text-align: center;
}

.right-group {
  display: flex;
  height: 72px;
  justify-content: center;
  align-items: center;
  padding: 10px;
  gap: 10px;
}

.logo-container {
  flex: 0 0 auto; /* Prevents the logo from stretching */
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn{
  display:flex;
  justify-content: center;
  align-items: center;
  width:50px;
  height: 50px;
  border:none;
  background:none;
  /*
  background: linear-gradient(to bottom, #444, #222);
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(142, 142, 142, 0.3);
  border-radius: 6px;
  */
}

.btn:hover{
  cursor: pointer;
}

.btn-icon{
  color:rgba(255, 255, 255, 0.6);
  width:30px;
  height: 30px;
}
</style>
