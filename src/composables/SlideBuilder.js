import { toRaw } from "vue";
import { v4 as uuidv4 } from "uuid";
import protobuf from "protobufjs";

export function useSlideBuilder() {
  let templateData = null;

  async function buildSlideFromTemplate(slide, template) {
    if (!template) {
      throw new Error("Template is required");
    }
    if (!slide) {
      throw new Error("Slide is required");
    }

    // Break out individual functions for building different templates
    switch (template) {
      case "title":
        return await buildTitleSlide(slide, template);
      case "point":
        return await buildPointSlide(slide, template);
      case "verse":
        return await buildVerseSlide(slide, template);
      case "blank":
        return await buildBlankSlide(slide, template);
      default:
        throw new Error(`Template ${template} not found`);
    }
  }

  async function getPresentationTemplate(template) {
    const presentationProto = await protobuf.load("/proto/presentation.proto");
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    templateData = toRaw(template);
    console.log("templateData", templateData);
    const pres = await Presentation.decode(toRaw(template));

    return pres;
  }

  async function getSlideTemplate(name) {
    const presentationProto = await protobuf.load("/proto/presentation.proto");
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    const pres = await Presentation.decode(templateData);
    console.log("pres", pres);
    let template = null;
    // Get template based on name
    for (const cue of pres.cues) {
      const action = cue.actions.find((a) => a.type === 11);
      if (action && action.label.text.toLowerCase() === name.toLowerCase()) {
        template = cue;
        break;
      }
    }
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    //console.log("Got Template", template);
    return template;
  }
  async function buildTitleSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);
    newSlide.uuid.string = uuidv4();
    return newSlide;
  }

  async function buildBlankSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);
    newSlide.uuid.string = uuidv4();
    const action = newSlide.actions.find((a) => a.type === 11);
    action.label = {};
    return newSlide;
  }

  async function buildPointSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);

    // Give it a new UUID
    newSlide.uuid.string = uuidv4();

    // Find the action with type 11 (slide type)
    const action = newSlide.actions.find((a) => a.type === 11);

    const textElementIndex =
      action.slide.presentation.baseSlide.elements.findIndex(
        (e) => e.element.text.rtfData !== null
      );
    const textElement =
      action.slide.presentation.baseSlide.elements[textElementIndex];

    //rtfData is a Uint8Array, so we need to convert it to a string
    const rtfData = new TextDecoder().decode(textElement.element.text.rtfData);
    const replacedRtf = rtfData.replace("[TEXT]", entry.text);

    // Convert the string back to a Uint8Array
    const newRtfData = new TextEncoder().encode(replacedRtf);
    textElement.element.text.rtfData = newRtfData;

    action.label = {};

    return newSlide;
  }

  async function buildVerseSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);

    // Give it a new UUID
    newSlide.uuid.string = uuidv4();

    // Find the action with type 11 (slide type)
    const action = newSlide.actions.find((a) => a.type === 11);

    // Update Verse element
    const verseElement = action.slide.presentation.baseSlide.elements.find(
      (e) => e.element.name === "Text"
    );
    let rtfData = new TextDecoder().decode(verseElement.element.text.rtfData);
    let replacedRtf = rtfData.replace("[TEXT]", entry.text);
    let newRtfData = new TextEncoder().encode(replacedRtf);
    verseElement.element.text.rtfData = newRtfData;

    // Update Reference element
    const referenceElement = action.slide.presentation.baseSlide.elements.find(
      (e) => ["Caption", "Reference"].includes(e.element.name)
    );
    rtfData = new TextDecoder().decode(referenceElement.element.text.rtfData);
    replacedRtf = rtfData.replace(
      "[TEXT]",
      `${entry.reference ?? ""} ${entry.translation ?? ""}`
    );
    newRtfData = new TextEncoder().encode(replacedRtf);
    referenceElement.element.text.rtfData = newRtfData;

    // Update label
    action.label = {
      color: { red: 0, green: 0, blue: 0, alpha: 0 },
      text: `${entry.reference ?? ""} ${entry.translation ?? ""}`,
    };

    return newSlide;
  }

  async function generateFile(presentationData) {
    const presentationProto = await protobuf.load("/proto/presentation.proto");
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    const newPresBuffer = Presentation.encode(presentationData).finish();
    return newPresBuffer;
  }

  return {
    getPresentationTemplate,
    getSlideTemplate,
    buildSlideFromTemplate,
    buildPointSlide,
    generateFile,
  };
}
