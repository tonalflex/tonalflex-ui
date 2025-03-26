<template>
  <div class="nav-bar">
    <div class="on-left">
      <OhVueIcon name="co-chevron-left" class="icon" /><span>Account</span>
    </div>
    <div class="current">
      <span>Effect Map</span>
    </div>
    <div class="on-right">
      <span>Chorus</span><OhVueIcon name="co-chevron-right" class="icon" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { OhVueIcon, addIcons } from "oh-vue-icons";
import { CoChevronLeft } from "oh-vue-icons/icons";
import { CoChevronRight } from "oh-vue-icons/icons";

addIcons(CoChevronLeft);
addIcons(CoChevronRight);

export default defineComponent({
  name: "navBar",
  components: { OhVueIcon },

});
</script>

<style scoped>
.nav-bar{
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* Left, Center, Right */
  align-items: center;
  width: 100%;
  color: red;
  text-align: center;
}

.on-left{
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Align to the left */
  gap: 8px; /* Space between icon and text */
}

.current{
  font-weight: bold;
  text-align: center;
  text-decoration: underline;
}

.on-right{
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Align to the right */
  gap: 8px; /* Space between text and icon */
}

.icon {
  font-size: 16px; /* Adjust icon size */
}
</style>
