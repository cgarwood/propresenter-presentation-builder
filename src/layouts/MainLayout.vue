<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>Pro7 Presentation Builder</q-toolbar-title>

        <div>
          <q-btn
            flat
            icon="mdi-folder-open-outline"
            @click="outline.loadOutline"
          />
          <q-btn
            flat
            icon="mdi-content-save-outline"
            @click="outline.exportOutline"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      side="left"
      id="mainDrawer"
    >
      <q-list>
        <q-item clickable v-close-popup to="/">
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>

          <q-item-section>Home</q-item-section>
        </q-item>

        <q-item clickable v-close-popup to="/editor">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>

          <q-item-section>Outline Editor</q-item-section>
        </q-item>

        <q-item clickable v-close-popup to="/analyze">
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>

          <q-item-section>Presentation Analyzer</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useOutlineStore } from "src/stores/outline";

const outline = useOutlineStore();

const leftDrawerOpen = ref(false);
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function minimize() {
  if (process.env.MODE === "electron") {
    window.myWindowAPI.minimize();
  }
}

function toggleMaximize() {
  if (process.env.MODE === "electron") {
    window.myWindowAPI.toggleMaximize();
  }
}

function closeApp() {
  if (process.env.MODE === "electron") {
    window.myWindowAPI.close();
  }
}
</script>

<style lang="scss" scoped>
#mainDrawer {
  .q-icon {
    color: $grey-7;
  }
}
</style>
