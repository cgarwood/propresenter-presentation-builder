import { toRaw } from "vue";
import protobuf from "protobufjs";
import { ACTION_SLIDE, templateLabels, slideBuilders } from "src/const";

export function useSlideBuilder() {
  let templateData = null;

  async function buildSlideFromTemplate(slide, template) {
    if (!template) {
      throw new Error("Template is required");
    }
    if (!slide) {
      throw new Error("Slide is required");
    }

    let builder = slideBuilders[template.toLowerCase()];
    if (!builder) {
      throw new Error(`No builder found for template '${template}'`);
    }

    const newSlide = new builder(templateData, slide);
    await newSlide.init();
    return newSlide.generateSlides();
  }

  async function getPresentationTemplate(template) {
    const protoDir = window.fileApi.getProtoDir();
    const presentationProto = await protobuf.load(
      `${protoDir}/presentation.proto`,
    );
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    templateData = toRaw(template);
    const pres = await Presentation.decode(toRaw(template));

    return pres;
  }

  async function getSlideTemplate(name) {
    const protoDir = window.fileApi.getProtoDir();
    const presentationProto = await protobuf.load(
      `${protoDir}/presentation.proto`,
    );
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    const pres = await Presentation.decode(templateData);
    let template = null;
    // Get template based on name
    for (const cue of pres.cues) {
      const action = cue.actions.find((a) => a.type === ACTION_SLIDE);
      if (action && action.label.text.toLowerCase() === name.toLowerCase()) {
        template = cue;
        break;
      }
    }
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    return template;
  }

  async function generateFile(presentationData) {
    const protoDir = window.fileApi.getProtoDir();
    const presentationProto = await protobuf.load(
      `${protoDir}/presentation.proto`,
    );
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    const newPresBuffer = Presentation.encode(presentationData).finish();
    return newPresBuffer;
  }

  async function getSupportedWidgets(templateData) {
    let supportedWidgets = [];
    const presentation = await getPresentationTemplate(templateData);

    for (const cue of presentation.cues) {
      const action = cue.actions.find((a) => a.type === ACTION_SLIDE);
      if (action && templateLabels.includes(action.label.text.toLowerCase())) {
        supportedWidgets.push(action.label.text.toLowerCase());
      }
    }
    return supportedWidgets;
  }

  async function slideTemplateExists(pres, template) {
    let exists = false;
    const presentation = await getPresentationTemplate(pres);

    for (const cue of presentation.cues) {
      const action = cue.actions.find((a) => a.type === ACTION_SLIDE);
      if (action.label.text.toLowerCase() === template.toLowerCase()) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  return {
    getSupportedWidgets,
    getPresentationTemplate,
    getSlideTemplate,
    buildSlideFromTemplate,
    slideTemplateExists,
    generateFile,
  };
}
