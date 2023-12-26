<template>
  <q-page class="flex flex-center">
    <div style="text-align: center">
      <h2 style="text-align: center">Generate a ProPresenter Presentation</h2>
      <p>
        This tool will help you generate a themed ProPresenter presentation from
        a plain text outline.
      </p>
      <div class="q-gutter-md">
        <q-btn
          color="primary"
          label="New Outline"
          icon="mdi-file-document-plus-outline"
          @click="$router.push('/editor')"
        />
        <q-btn
          icon="mdi-folder-open-outline"
          color="secondary"
          label="Load Outline"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "IndexPage",
});
</script>
