<template>
  <q-page class="q-pa-md">
    <q-input outlined label="Title" class="q-mb-md" v-model="outline.name" />
    <q-input
      outlined
      label="ProPresenter Template"
      class="q-mb-md"
      readonly
      v-model="outline.templatePath"
      @click="openTemplate"
    />
    <q-list bordered v-for="(entry, index) in outline.entries" :key="index">
      <q-expansion-item
        :expand-separator="true"
        :caption-lines="1"
        :header-class="headerClass(entry)"
        :expand-icon-class="outlineEntryTypes[entry.type].textColor"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-icon :name="icon(entry)" />
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
        </template>
        <Component
          :is="outlineEntryTypes[entry.type].component"
          :entryId="index"
          class="q-pa-md"
        />
      </q-expansion-item>
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
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { v4 as uuidv4 } from "uuid";
import { useOutlineStore } from "../stores/outline";
import { useSlideBuilder } from "../composables/SlideBuilder";
import { outlineEntryTypes } from "src/const.js";
const outline = useOutlineStore();
const { getPresentationTemplate, buildSlideFromTemplate, generateFile } =
  useSlideBuilder();

// Compute properties based on entry type
function caption(entry) {
  if (entry.type == "point") return entry.text;
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

async function openTemplate() {
  const template = await window.fileApi.openTemplate();
  if (!template) return;

  outline.template = template.data;
  outline.templatePath = template.path;
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
  console.log("Presentation", { ...presentation });

  // Wipe the cues from the template so we can add our own
  presentation.cues = [];
  presentation.cueGroups = [];

  // Set presentation details
  presentation.name = outline.name;
  presentation.uuid.string = uuidv4();
  presentation.selectedArrangement.string = uuidv4();

  // Build the slides
  const slides = [];
  slides.push(await buildSlideFromTemplate({}, "title"));
  for (const entry of outline.entries) {
    slides.push(await buildSlideFromTemplate(entry, entry.type));
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
