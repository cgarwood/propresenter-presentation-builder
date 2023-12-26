import { defineStore } from "pinia";

export const useOutlineStore = defineStore("outline", {
  state: () => ({
    name: "New Outline",
    entries: [
      {
        type: "point",
        text: "This is a point slide",
        notes: "",
      },
      {
        type: "verse",
        reference: "John 3:16",
        translation: "NIV",
        notes: "",
      },
    ],
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
  },
});
