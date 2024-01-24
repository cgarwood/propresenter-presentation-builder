import { defineStore } from "pinia";
import { useAppStore } from "./app";

export const useOutlineStore = defineStore("outline", {
  state: () => ({
    name: "New Outline",
    entries: [],
    template: null,
    templatePath: null,
  }),
  actions: {
    addEntry(type) {
      this.entries.push({ type });
    },
    removeEntry(index) {
      this.entries.splice(index, 1);
    },
    async exportOutline() {
      const data = JSON.stringify(this.$state);
      const result = await window.fileApi.saveOutline(
        data,
        `${this.name}.json`,
      );
      if (result) {
        const app = useAppStore();
        app.unsavedChanges = false;
      }
      return result;
    },

    async loadOutline() {
      const result = await window.fileApi.openOutline();
      if (!result) return false;

      this.$patch(JSON.parse(result.data));
      return true;
    },

    async newOutline() {
      const store = useOutlineStore();
      const app = useAppStore();
      store.$reset();
      app.unsavedChanges = false;
    },
  },
});
