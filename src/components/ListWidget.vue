<template>
  <div>
    <q-input
      outlined
      label="Title"
      v-model="entry.text"
      placeholder=""
      type="textarea"
      class="q-mt-sm"
      autogrow
    />
    <form>
      <q-input
        outlined
        label="List Item"
        v-model="entry.items[index]"
        placeholder=""
        class="q-mt-xs"
        v-for="(item, index) in entry.items"
        @keydown.enter.prevent="addItem"
        :key="index"
        ref="itemRefs"
        type="text"
        dense
        autogrow
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            icon="mdi-delete-forever"
            text-color="grey-7"
            @click="
              entry.items.length > 1
                ? entry.items.splice(index, 1)
                : (entry.items[0] = '')
            "
          />
        </template>
      </q-input>
    </form>
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
import { onMounted, nextTick } from "vue";
import { useOutlineStore } from "../stores/outline";
const outline = useOutlineStore();
const props = defineProps({
  entryId: {
    type: Number,
    required: true,
  },
});
const entry = outline.entries[props.entryId];

onMounted(() => {
  if (!entry.items || entry.items.length === 0) {
    entry.items = [""];
  }
});

async function addItem(e) {
  entry.items.push("");

  //Focus the next textarea
  await nextTick();
  const inputs = Array.from(e.target.form.querySelectorAll("textarea"));
  const index = inputs.indexOf(e.target);

  if (index < inputs.length) {
    inputs[index + 1].focus();
  }
}
</script>
