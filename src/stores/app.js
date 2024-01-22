import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    // What widgets are supported by the currently loaded template?
    supportedWidgets: [],

    // Have there been changes since the outline was saved?
    unsavedChanges: false,
  }),
});
