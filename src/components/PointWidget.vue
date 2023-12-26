<template>
  <div>
    <q-input
      outlined
      label="Text"
      v-model="entry.text"
      placeholder=""
      type="textarea"
      autogrow
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
import { useOutlineStore } from "../stores/outline";
const outline = useOutlineStore();
const props = defineProps({
  entryId: {
    type: Number,
    required: true,
  },
});
const entry = outline.entries[props.entryId];
</script>
