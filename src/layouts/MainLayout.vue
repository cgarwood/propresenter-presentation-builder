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
          <q-btn flat icon="mdi-note-plus-outline" @click="newOutline">
            <q-tooltip>New Outline</q-tooltip>
          </q-btn>
          <q-btn flat icon="mdi-folder-open-outline" @click="loadOutline">
            <q-tooltip>Open Outline</q-tooltip>
          </q-btn>
          <q-btn
            flat
            icon="mdi-content-save-outline"
            @click="outline.exportOutline"
          >
            <q-tooltip>Save Outline</q-tooltip>
            <q-badge
              color="red"
              rounded
              floating
              v-if="app.unsavedChanges"
              style="right: 11px; top: 4px"
            />
          </q-btn>
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
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useOutlineStore } from "src/stores/outline";
import { useAppStore } from "src/stores/app";

const outline = useOutlineStore();
const app = useAppStore();
const $q = useQuasar();
const router = useRouter();

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

function loadOutline() {
  const result = outline.loadOutline();
  if (result) {
    router.push("/editor");
  }
}

function newOutline() {
  if (app.unsavedChanges) {
    $q.dialog({
      title: "Unsaved Changes",
      message:
        "Would you like to start a new outline without saving your current changes?",
      cancel: true,
      persistent: true,
      ok: {
        label: "Discard Changes",
        color: "negative",
        flat: true,
      },
      cancel: "Save Changes",
    })
      .onOk(async () => {
        outline.newOutline();
        router.push("/editor");
      })
      .onCancel(async () => {
        const result = await outline.exportOutline();
        if (result) outline.newOutline();
        return;
      })
      .onDismiss(() => {
        return;
      });
  } else {
    outline.newOutline();
    router.push("/editor");
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
