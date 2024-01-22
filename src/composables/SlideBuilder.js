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
    const pres = await Presentation.decode(toRaw(template));

    return pres;
  }

  async function getSlideTemplate(name) {
    const presentationProto = await protobuf.load("/proto/presentation.proto");
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
    const newSlide = await getSlideTemplate(template);
    newSlide.uuid.string = uuidv4();
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

    textElement.element.uuid.string = uuidv4();

    action.label = {};

    return newSlide;
  }

  async function buildVerseSlide(entry, template) {
    // We may need to split verses into multiple slides.
    // We should eventually make the target and grace values configurable on the outline.
    const TARGET_SLIDE_CHARS = 350;
    const SLIDE_GRACE_CHARS = 50;
    const MAX_SLIDE_CHARS = TARGET_SLIDE_CHARS + SLIDE_GRACE_CHARS;
    const MIN_SLIDE_CHARS = TARGET_SLIDE_CHARS - SLIDE_GRACE_CHARS * 2;

    let newSlides = [];
    let slideTexts = [];
    let verseText = toRaw(entry.text);

    const punctuation = RegExp("[,;)'\":…]\\s", "g");
    while (verseText.length > MAX_SLIDE_CHARS) {
      var testRegion = verseText.substring(MIN_SLIDE_CHARS, TARGET_SLIDE_CHARS);

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
      const realText = verseText.substring(0, slideChars);
      verseText = verseText.substring(slideChars);

      slideTexts.push(realText);
    }

    // Add the remainder of the text to the last slide
    slideTexts.push(verseText);

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

    for (const text of slideTexts) {
      const newSlide = await getSlideTemplate(template);

      // Give it a new UUID
      newSlide.uuid.string = uuidv4();

      // Find the action for the slide layer
      const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
      action.uuid.string = uuidv4();
      action.slide.presentation.baseSlide.uuid.string = uuidv4();

      // Update Verse element
      const verseElement = action.slide.presentation.baseSlide.elements.find(
        (e) => ["Text", "TextElement", "Verse"].includes(e.element.name)
      );
      let rtfData = new TextDecoder().decode(verseElement.element.text.rtfData);
      let replacedRtf = rtfData.replace("[TEXT]", text);
      let newRtfData = new TextEncoder().encode(replacedRtf);
      verseElement.element.text.rtfData = newRtfData;
      verseElement.element.uuid.string = uuidv4();

      // Update Reference element
      const referenceElement =
        action.slide.presentation.baseSlide.elements.find((e) =>
          ["Caption", "Reference"].includes(e.element.name)
        );
      rtfData = new TextDecoder().decode(referenceElement.element.text.rtfData);
      replacedRtf = rtfData.replace(
        "[TEXT]",
        `${entry.reference ?? ""} ${entry.translation ?? ""}`
      );
      newRtfData = new TextEncoder().encode(replacedRtf);
      referenceElement.element.text.rtfData = newRtfData;
      referenceElement.element.uuid.string = uuidv4();

      // Update label
      action.label = {
        color: { red: 0, green: 0, blue: 0, alpha: 0 },
        text: `${entry.reference ?? ""} ${entry.translation ?? ""}`,
      };

      newSlides.push(newSlide);
    }
    return newSlides;
  }

  async function generateFile(presentationData) {
    const presentationProto = await protobuf.load("/proto/presentation.proto");
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

  return {
    getSupportedWidgets,
    getPresentationTemplate,
    getSlideTemplate,
    buildSlideFromTemplate,
    buildPointSlide,
    generateFile,
  };
}
