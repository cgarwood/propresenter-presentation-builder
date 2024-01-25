import { toRaw } from "vue";
import { v4 as uuidv4 } from "uuid";
import protobuf from "protobufjs";
import { ACTION_SLIDE, templateLabels } from "src/const";

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
      case "quote":
        return await buildQuoteSlide(slide, template);
      case "blank":
        return await buildBlankSlide(slide, template);
      default:
        throw new Error(`Template ${template} not found`);
    }
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

  async function buildTitleSlide(entry, template) {
    if (entry.subtitle != "") {
      if (await slideTemplateExists(templateData, "title with subtitle")) {
        template = "title with subtitle";
      }
    }
    const newSlide = await getSlideTemplate(template);
    newSlide.uuid.string = uuidv4();

    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();
    action.label = {};

    _updateTextElementByName(action, "Title", entry.text);
    _updateTextElementByName(action, "Subtitle", entry.subtitle);

    return newSlide;
  }

  async function buildBlankSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);
    newSlide.uuid.string = uuidv4();
    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.label = {};
    return newSlide;
  }

  async function buildPointSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);

    // Give it a new UUID
    newSlide.uuid.string = uuidv4();

    // Find the action for the slide layer
    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();

    const textElementIndex =
      action.slide.presentation.baseSlide.elements.findIndex(
        (e) => e.element.text.rtfData !== null,
      );
    const textElement =
      action.slide.presentation.baseSlide.elements[textElementIndex];

    _updateTextElement(textElement, entry.text);

    action.label = {};

    return newSlide;
  }

  async function buildVerseSlide(entry, template) {
    let newSlides = [];
    let slideTexts = _multiSlideText(entry.text);

    for (const text of slideTexts) {
      const newSlide = await getSlideTemplate(template);

      // Give it a new UUID
      newSlide.uuid.string = uuidv4();

      // Find the action for the slide layer
      const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
      action.uuid.string = uuidv4();
      action.slide.presentation.baseSlide.uuid.string = uuidv4();

      // Update Verse element
      _updateTextElementByName(action, ["Text", "TextElement", "Verse"], text);
      _updateTextElementByName(
        action,
        ["Caption", "Reference"],
        entry.reference,
      );

      // Update label
      action.label = {
        color: { red: 0, green: 0, blue: 0, alpha: 0 },
        text: `${entry.reference ?? ""} ${entry.translation ?? ""}`,
      };

      newSlides.push(newSlide);
    }
    return newSlides;
  }

  async function buildQuoteSlide(entry, template) {
    const newSlide = await getSlideTemplate(template);

    // Give it a new UUID
    newSlide.uuid.string = uuidv4();

    // Find the action for the slide layer
    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();

    _updateTextElementByName(
      action,
      ["Text", "TextElement", "Quote"],
      entry.text,
    );
    _updateTextElementByName(
      action,
      ["Caption", "Reference", "Author", "Quote Author", "Name"],
      entry.author,
    );

    return newSlide;
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

  function _updateTextElementByName(action, name, text) {
    // Let the name be an array of allowed names or a single string
    let element = null;
    if (Array.isArray(name)) {
      element = action.slide.presentation.baseSlide.elements.find((e) =>
        name.includes(e.element.name),
      );
    } else {
      element = action.slide.presentation.baseSlide.elements.find(
        (e) => e.element.name === name,
      );
    }

    _updateTextElement(element, text);
  }

  function _updateTextElement(element, text) {
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

  function _multiSlideText(textRef) {
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

  return {
    getSupportedWidgets,
    getPresentationTemplate,
    getSlideTemplate,
    buildSlideFromTemplate,
    buildPointSlide,
    generateFile,
  };
}
