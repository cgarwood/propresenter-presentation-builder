<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-sm">
      <q-input
        outlined
        label="Title"
        class="q-mb-md col-md-4 col-sm-4 col-xs-12"
        v-model="outline.name"
      />
      <q-input
        outlined
        label="Subtitle"
        class="q-mb-md col-md-8 col-sm-8 col-xs-12"
        v-model="outline.subtitle"
      />
    </div>
    <q-input
      outlined
      label="ProPresenter Template"
      class="q-mb-md"
      readonly
      v-model="outline.templatePath"
      @click="openTemplate"
    />
    <q-list bordered>
      <div v-if="outline.entries.length === 0" class="q-pa-md flex-center">
        <div class="text-h5 text-grey-7" style="text-align: center">
          This outline is empty...
        </div>
        <div class="text-body text-grey-7 q-mt-sm" style="text-align: center">
          Click <b>New Item</b> below to add items to your outline.
        </div>
      </div>
      <Container @drop="onDrop" v-else>
        <Draggable v-for="(entry, index) in outline.entries" :key="index">
          <q-expansion-item
            :expand-separator="true"
            :caption-lines="1"
            :header-class="headerClass(entry)"
            :expand-icon-class="outlineEntryTypes[entry.type].textColor"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon :name="icon(entry)">
                  <q-badge
                    floating
                    rounded
                    color="red-7"
                    style="right: -6px; padding: 2px"
                    v-if="!app.supportedWidgets.includes(entry.type)"
                  >
                    <q-icon name="mdi-exclamation-thick" />
                  </q-badge>
                </q-icon>
                <q-tooltip v-if="!app.supportedWidgets.includes(entry.type)">
                  This widget is not supported by the loaded ProPresenter
                  template.
                </q-tooltip>
              </q-item-section>
              <q-item-section>
                <q-item-label :class="outlineEntryTypes[entry.type].textColor">
                  {{ label(entry) }}
                </q-item-label>
                <q-item-label
                  caption
                  :class="outlineEntryTypes[entry.type].textColor"
                  lines="1"
                >
                  {{ caption(entry) }}
                </q-item-label>
              </q-item-section>
              <q-item-section class="col-shrink">
                <q-btn flat dense icon="mdi-dots-vertical">
                  <q-menu>
                    <q-list>
                      <q-item
                        clickable
                        v-close-popup
                        @click="outline.removeEntry(index)"
                      >
                        <q-item-section>Delete</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </template>
            <Component
              :is="outlineEntryTypes[entry.type].component"
              :entryId="index"
              class="q-pa-md"
            />
          </q-expansion-item>
        </Draggable>
      </Container>
    </q-list>
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-fab color="primary" icon="mdi-plus" label="New Item" direction="up">
        <q-fab-action
          v-for="(type, id) in outlineEntryTypes"
          :key="id"
          @click="outline.addEntry(id)"
          :color="type.color"
          :label="type.label"
          :icon="type.icon"
        />
      </q-fab>
    </q-page-sticky>
    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn
        fab
        icon="mdi-duck"
        label="Generate Presentation"
        @click="buildDocumentFromOutline"
        color="green-7"
        :disable="outline.template === null"
      >
        <q-tooltip v-if="outline.template === null">
          You must first select a ProPresenter template"
        </q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { onMounted } from "vue";
import { v4 as uuidv4 } from "uuid";
import { Container, Draggable } from "vue3-smooth-dnd";
import { useOutlineStore } from "../stores/outline";
import { useAppStore } from "src/stores/app";
import { useSlideBuilder } from "../composables/SlideBuilder";
import { outlineEntryTypes } from "src/const.js";
const outline = useOutlineStore();
const app = useAppStore();

const {
  getPresentationTemplate,
  buildSlideFromTemplate,
  generateFile,
  getSupportedWidgets,
} = useSlideBuilder();

onMounted(async () => {
  outline.$subscribe((mutation) => {
    if (mutation.type == "direct") {
      app.unsavedChanges = true;
    }
  });
});

// Compute properties based on entry type
function caption(entry) {
  if (["point", "quote"].includes(entry.type)) return entry.text;
  if (entry.type == "verse")
    return `${entry.reference ?? ""} ${entry.translation ?? ""}`;
  return "";
}

function label(entry) {
  return outlineEntryTypes[entry.type].label;
}

function icon(entry) {
  return outlineEntryTypes[entry.type].icon;
}

function headerClass(entry) {
  const entryType = outlineEntryTypes[entry.type];
  return [`bg-${entryType.color}`, entryType.textColor];
}

function onDrop(dropResult) {
  outline.entries = applyDrag(outline.entries, dropResult);
}
function applyDrag(arr, dragResult) {
  const { removedIndex, addedIndex, payload } = dragResult;

  if (removedIndex === null && addedIndex === null) return arr;
  const result = [...arr];
  let itemToAdd = payload;

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0];
  }
  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd);
  }
  return result;
}

async function openTemplate() {
  const template = await window.fileApi.openTemplate();
  if (!template) return;

  outline.template = template.data;
  outline.templatePath = template.path;
  app.supportedWidgets = await getSupportedWidgets(outline.template);
}

async function buildDocumentFromOutline() {
  // If no template is set for the outline, prompt to select a template
  if (!outline.template) {
    const template = await window.fileApi.openTemplate();
    outline.template = template.data;
    outline.templatePath = template.path;
  }

  // Get the template for the presentation
  const presentation = await getPresentationTemplate(outline.template);

  // Wipe the cues from the template so we can add our own
  presentation.cues = [];
  presentation.cueGroups = [];

  // Set presentation details
  presentation.name = `${outline.name}${outline.subtitle ? `: ${outline.subtitle}` : ""}`;
  presentation.uuid.string = uuidv4();
  presentation.selectedArrangement.string = uuidv4();

  // Build the slides
  const slides = [];

  // Build the title slide
  slides.push(
    await buildSlideFromTemplate(
      { text: outline.name, subtitle: outline.subtitle },
      "title",
    ),
  );

  for (const entry of outline.entries) {
    // If the loaded template doesn't support the widget, don't attempt to build it
    if (!app.supportedWidgets.includes(entry.type)) continue;

    const slide = await buildSlideFromTemplate(entry, entry.type);

    // Some slide generators will return multiple slides (for example, a long verse will be split into multiple slides)
    // so we have to check if we're getting a single slide or an array of slides
    if (!Array.isArray(slide)) {
      slides.push(slide);
    } else if (slide.length == 1) {
      slides.push(slide[0]);
    } else {
      slides.push(...slide);
    }
  }

  // Add the slides to the presentation
  presentation.cues = slides;

  // Add the slides to the cueGroup
  presentation.cueGroups = [
    {
      group: {
        uuid: { string: uuidv4() },
        name: "Group",
        color: {
          red: 0,
          green: 0,
          blue: 0,
          alpha: 1,
        },
      },
      cueIdentifiers: slides.map((slide) => {
        return { string: slide.uuid.string };
      }),
    },
  ];

  console.log("Final", presentation);
  const buffer = await generateFile(presentation);
  window.fileApi.saveFile(buffer, `${outline.name}`);
}
</script>

<style lang="scss" scoped>
.q-page {
  padding-bottom: 82px;
}
</style>
