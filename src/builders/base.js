import { toRaw } from "vue";
import { v4 as uuidv4 } from "uuid";
import protobuf from "protobufjs";
import { ACTION_SLIDE } from "src/const";

class BaseSlide {
  constructor(presentationTemplateData, widgetData) {
    this.presentationTemplateData = presentationTemplateData;
    this.presentationTemplate = null;
    this.slideTemplate = null;
    this.widgetData = widgetData;
  }

  async init() {
    await this.loadPresentationTemplate(this.presentationTemplateData);
  }

  async loadPresentationTemplate(template) {
    const protoDir = window.fileApi.getProtoDir();
    const presentationProto = await protobuf.load(
      `${protoDir}/presentation.proto`,
    );
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    const pres = await Presentation.decode(toRaw(template));

    this.presentationTemplate = pres;
  }

  async loadSlideTemplate(name) {
    const protoDir = window.fileApi.getProtoDir();
    const presentationProto = await protobuf.load(
      `${protoDir}/presentation.proto`,
    );
    const Presentation = presentationProto.lookupType("rv.data.Presentation");

    const pres = await Presentation.decode(this.presentationTemplateData);
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
    this.slideTemplate = template;
  }

  async slideTemplateExists(pres, template) {
    let exists = false;
    const presentation = this.presentationTemplate;

    for (const cue of presentation.cues) {
      const action = cue.actions.find((a) => a.type === ACTION_SLIDE);
      if (action.label.text.toLowerCase() === template.toLowerCase()) {
        exists = true;
        break;
      }
    }
    return exists;
  }

  async generateSlides() {
    throw new Error("Not implemented");
  }

  /* **************** */
  /* Helper Functions */
  /* **************** */
  _updateTextElementByName(action, name, text) {
    // name can be an array of acceptable element names, or a string
    let element = undefined;
    if (Array.isArray(name)) {
      element = action.slide.presentation.baseSlide.elements.find((e) =>
        name.includes(e.element.name),
      );
    } else {
      element = action.slide.presentation.baseSlide.elements.find(
        (e) => e.element.name === name,
      );
    }

    if (!element) {
      console.debug("No text element found named ", name);
      return;
    }

    this._updateTextElement(element, text);
  }

  _updateTextElement(element, text) {
    // Update the rtfData
    const rtfData = new TextDecoder().decode(element.element.text.rtfData);
    const replacedRtf = rtfData.replace("[TEXT]", text);
    const newRtfData = new TextEncoder().encode(replacedRtf);
    element.element.text.rtfData = newRtfData;

    // Check for custom attributes (capitalization/gradientFill/etc) and update the range
    if (element.element.text.attributes.customAttributes) {
      for (const attr of element.element.text.attributes.customAttributes) {
        if (attr.range) {
          attr.range.end = replacedRtf.length;
        }
      }
    }

    // Generate a new UUID
    element.element.uuid.string = uuidv4();
  }

  _multiSlideText(textRef) {
    // We may need to split verses into multiple slides.
    // We should eventually make the target and grace values configurable on the outline.
    const TARGET_SLIDE_CHARS = 350;
    const SLIDE_GRACE_CHARS = 50;
    const MAX_SLIDE_CHARS = TARGET_SLIDE_CHARS + SLIDE_GRACE_CHARS;
    const MIN_SLIDE_CHARS = TARGET_SLIDE_CHARS - SLIDE_GRACE_CHARS * 2;

    let slideTexts = [];
    let text = toRaw(textRef);

    const punctuation = RegExp("[,;)'\":…]\\s", "g");
    while (text.length > MAX_SLIDE_CHARS) {
      var testRegion = text.substring(MIN_SLIDE_CHARS, TARGET_SLIDE_CHARS);

      // find possible split points before the target slide size
      var lastNewLineLoc = testRegion.lastIndexOf("\n");
      var lastPeriodLoc = testRegion.lastIndexOf(".");
      var lastSpaceLoc = testRegion.lastIndexOf(" ");
      var lastPunctuationLoc = -1;
      for (var match in testRegion.matchAll(punctuation)) {
        if (match.start > lastPunctuationLoc) lastPunctuationLoc = match.start;
      }

      // the real split is the largest number smaller than target_slide_chars
      // with priority given to grammar concerns
      var slideChars = TARGET_SLIDE_CHARS;
      if (lastNewLineLoc > -1 && lastNewLineLoc < TARGET_SLIDE_CHARS) {
        slideChars = MIN_SLIDE_CHARS + lastNewLineLoc;
      } else if (lastPeriodLoc > -1 && lastPeriodLoc < TARGET_SLIDE_CHARS) {
        slideChars = MIN_SLIDE_CHARS + lastPeriodLoc;
      } else if (
        lastPunctuationLoc > -1 &&
        lastPunctuationLoc < TARGET_SLIDE_CHARS
      ) {
        slideChars = MIN_SLIDE_CHARS + lastPunctuationLoc;
      } else if (lastSpaceLoc > -1 && lastSpaceLoc < TARGET_SLIDE_CHARS) {
        slideChars = MIN_SLIDE_CHARS + lastSpaceLoc;
      }

      // create a slide with the proper amount of text and reduce "remaining"
      const realText = text.substring(0, slideChars);
      text = text.substring(slideChars);

      slideTexts.push(realText);
    }

    // Add the remainder of the text to the last slide
    slideTexts.push(text);

    // If there are multiple slides, add "..." to the end of all but the last slide
    // and add "..." to the beginning of all but the first slide.
    if (slideTexts.length > 1) {
      for (let i = 0; i < slideTexts.length; i++) {
        if (i < slideTexts.length - 1) {
          slideTexts[i] += "...";
        }
        if (i >= 1) {
          slideTexts[i] = `...${slideTexts[i]}`;
        }
      }
    }

    return slideTexts;
  }
}

export { BaseSlide };
