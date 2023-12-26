<template>
  <div>
    <div class="row q-col-gutter-sm">
      <q-input
        class="col-6"
        outlined
        label="Reference"
        v-model="entry.reference"
        placeholder=""
        @blur="updateVerse"
      />
      <q-input
        outlined
        label="Translation"
        v-model="entry.translation"
        class="col-3"
        @blur="updateVerse"
      />
      <q-toggle
        v-model="showVerseNumbers"
        label="Verse Numbers"
        class="col-3"
      />
    </div>
    <q-input
      outlined
      dense
      label="Text"
      v-model="verse"
      placeholder=""
      type="textarea"
      autogrow
      disable
      class="q-mt-sm"
    />
    <q-input
      outlined
      dense
      label="Notes"
      v-model="entry.notes"
      placeholder=""
      type="textarea"
      autogrow
      class="q-mt-sm"
    />
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { useOutlineStore } from "../stores/outline";

const outline = useOutlineStore();
const props = defineProps({
  entryId: {
    type: Number,
    required: true,
  },
});
const entry = outline.entries[props.entryId];

const verse = ref("");
const showVerseNumbers = ref(false);

onMounted(() => {
  updateVerse();
});

async function updateVerse() {
  if (entry.reference) {
    let url = `https://lafayettecc.org/bible/?passage=${entry.reference}&version=${entry.translation}&json=on`;
    if (showVerseNumbers.value) url += "&showversenumbers=on";
    const response = await fetch(url);
    const result = await response.json();
    verse.value = "";
    for (let v of result.data.verses) {
      verse.value += v;
    }

    entry.text = verse.value;
  }
}
</script>
