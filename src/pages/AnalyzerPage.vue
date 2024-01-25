<template>
  <q-page class="q-pa-md">
    <q-input
      outlined
      label="ProPresenter Template"
      class="q-mb-md"
      readonly
      v-model="presentationPath"
      @click="openPresentation"
    />

    <div v-if="presentation">
      <div class="text-h5 q-mb-lg">{{ presentation.name }}</div>
      <q-expansion-item
        :expand-separator="true"
        :caption-lines="1"
        header-class="bg-primary text-white"
        expand-icon-class="text-white"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-icon name="mdi-file-outline" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Presentation Details</q-item-label>
            <q-item-label caption class="text-white" lines="1">
              {{ presentation.name }}
            </q-item-label>
          </q-item-section>
        </template>
        <q-list bordered separator>
          <q-item>
            <q-item-section>
              <q-item-label>Name</q-item-label>
              <q-item-label caption>{{ presentation.name }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Last Used</q-item-label>
              <q-item-label caption>{{
                prettyDate(presentation.lastDateUsed?.seconds)
              }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Last Modified</q-item-label>
              <q-item-label caption>{{
                prettyDate(presentation.lastModifiedDate?.seconds)
              }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>
      <q-expansion-item
        :expand-separator="true"
        :caption-lines="1"
        header-class="bg-secondary text-white"
        expand-icon-class="text-white"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-icon name="mdi-presentation" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Cues (Slides)</q-item-label>
            <q-item-label caption class="text-white" lines="1">
              {{ presentation.cues.length }} cues
            </q-item-label>
          </q-item-section>
        </template>
        <q-list bordered class="q-pa-md">
          <q-expansion-item
            style="border: 1px solid #ccc"
            :expand-separator="true"
            :caption-lines="1"
            header-class="bg-grey-3"
            v-for="(cue, index) in presentation.cues"
            :key="index"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="mdi-duck" />
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  Slide {{ index + 1 }}
                  <q-badge v-if="!cue.isEnabled">Disabled</q-badge>
                  <q-badge
                    class="q-mx-sm"
                    :style="{
                      backgroundColor: convertPro7ColorToRGBA(
                        getGroupForUUID(cue.uuid.string).group.color,
                      ),
                    }"
                    v-if="getGroupForUUID(cue.uuid.string)"
                  >
                    {{ getGroupForUUID(cue.uuid.string).group.name }}
                  </q-badge>
                </q-item-label>
                <q-item-label caption lines="1">{{
                  cue.uuid.string
                }}</q-item-label>
              </q-item-section>
            </template>
            <!-- Cue (Slide) Details -->
            <div class="q-pa-md">
              <q-expansion-item
                header-class="bg-primary text-white"
                expand-icon-class="text-white"
              >
                <template v-slot:header>
                  <q-item-section>
                    <q-item-label>Slide Layer</q-item-label>
                    <q-item-label caption class="text-white" lines="1">
                      {{ getSlideLayerForCue(cue).uuid?.string }}
                    </q-item-label>
                  </q-item-section>
                </template>
                <div>
                  <q-expansion-item
                    v-if="
                      getSlideLayerForCue(cue).slide.presentation.baseSlide
                        .elements
                    "
                    label="Slide Elements"
                    header-class="bg-grey-3"
                    class="q-pa-sm"
                  >
                    <q-expansion-item
                      v-for="el in getSlideLayerForCue(cue).slide.presentation
                        .baseSlide.elements"
                      :key="el.element.uuid.string"
                      :label="el.element.name"
                      :caption="el.element.uuid.string"
                    >
                      <div v-if="el.element.text.rtfData">
                        {{ rtfData(el.element.text.rtfData) }}
                      </div>
                    </q-expansion-item>
                  </q-expansion-item>
                </div>
              </q-expansion-item>
              <q-expansion-item
                header-class="bg-secondary text-white"
                expand-icon-class="text-white"
                v-if="getMediaLayerForCue(cue)"
              >
                <template v-slot:header>
                  <q-item-section>
                    <q-item-label
                      >Media Layer &bull;
                      <i>{{ getMediaLayerForCue(cue).name }}</i></q-item-label
                    >
                    <q-item-label caption class="text-white" lines="1">
                      {{ getMediaLayerForCue(cue).uuid.string }}
                    </q-item-label>
                  </q-item-section>
                </template>
                <div>
                  <q-list bordered separator>
                    <q-item>
                      <q-item-section>
                        <q-item-label>Absolute Path</q-item-label>
                        <q-item-label caption>{{
                          getMediaLayerForCue(cue).media.element.url
                            .absoluteString
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label>Local Path</q-item-label>
                        <q-item-label caption>{{
                          getMediaLayerForCue(cue).media.element.url.local.path
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </q-expansion-item>
            </div>
          </q-expansion-item>
        </q-list>
      </q-expansion-item>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="mdi-duck" label="debug" color="green-7" @click="debug" />
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, toRaw } from "vue";
import { date } from "quasar";
import protobuf from "protobufjs";

const presentation = ref(null);
const presentationPath = ref(null);

async function openPresentation() {
  const file = await window.fileApi.openPro7Presentation();
  if (!file) return;
  const { path, data } = file;

  const presentationProto = await protobuf.load("/proto/presentation.proto");
  const pres = presentationProto.lookupType("rv.data.Presentation");

  presentation.value = await pres.decode(toRaw(data));
  presentationPath.value = path;
}

function debug() {
  console.log(presentation.value);
}

function getGroupForUUID(uuid) {
  return presentation.value.cueGroups.find((group) =>
    group.cueIdentifiers.some((cue) => cue.string === uuid),
  );
}
function convertPro7ColorToRGBA(color) {
  if (!color) return;
  const { red, green, blue, alpha } = color;
  return `rgba(${red * 255}, ${green * 255}, ${blue * 255}, ${alpha * 255})`;
}
function getSlideLayerForCue(cue) {
  return cue.actions.find((layer) => layer.type === 11);
}

function getMediaLayerForCue(cue) {
  return cue.actions.find((layer) => layer.type === 2);
}

function prettyDate(timestamp) {
  const d = new Date(timestamp * 1000);
  return date.formatDate(d, "YYYY-MM-DD");
}

function rtfData(rtf) {
  return new TextDecoder().decode(rtf);
}
</script>

<style lang="scss" scoped>
.q-page {
  padding-bottom: 82px;
}
</style>
