<template>
  <div>
    <q-input
      outlined
      label="Callout 1 Title"
      v-model="entry.callout1title"
      placeholder=""
      type="textarea"
      class="q-mt-sm"
      autogrow
    />
    <q-input
      outlined
      label="Callout 1 Description"
      v-model="entry.callout1text"
      placeholder=""
      type="textarea"
      class="q-mt-xs"
      autogrow
    />
    <q-input
      outlined
      label="Callout 2 Title"
      v-model="entry.callout2title"
      placeholder=""
      type="textarea"
      class="q-mt-md"
      autogrow
    />
    <q-input
      outlined
      label="Callout 2 Description"
      v-model="entry.callout2text"
      placeholder=""
      type="textarea"
      class="q-mt-xs"
      autogrow
    />
    <q-input
      outlined
      label="Callout 3 Title"
      v-model="entry.callout3title"
      placeholder=""
      type="textarea"
      class="q-mt-md"
      autogrow
    />
    <q-input
      outlined
      label="Callout 3 Description"
      v-model="entry.callout3text"
      placeholder=""
      type="textarea"
      class="q-mt-xs"
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
      class="q-mt-md"
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
