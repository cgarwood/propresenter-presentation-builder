import { cloneDeep } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { ACTION_SLIDE } from "src/const";
import { BaseSlide } from "./base";

class VerseSlide extends BaseSlide {
  async generateSlides() {
    if (!this.slideTemplate) {
      await this.loadSlideTemplate("verse");
    }

    let newSlides = [];
    let slideTexts = this._multiSlideText(this.widgetData.text);

    for (const text of slideTexts) {
      const newSlide = cloneDeep(this.slideTemplate);

      // Give it a new UUID
      newSlide.uuid.string = uuidv4();

      // Find the action for the slide layer
      const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
      action.uuid.string = uuidv4();
      action.slide.presentation.baseSlide.uuid.string = uuidv4();

      // Update Verse element
      this._updateTextElementByName(
        action,
        ["Text", "TextElement", "Verse"],
        text,
      );
      this._updateTextElementByName(
        action,
        ["Caption", "Reference"],
        `${this.widgetData.reference ?? ""} ${this.widgetData.translation ?? ""}`,
      );

      // Update label
      action.label = {
        color: { red: 0, green: 0, blue: 0, alpha: 0 },
        text: `${this.widgetData.reference ?? ""} ${this.widgetData.translation ?? ""}`,
      };

      newSlides.push(newSlide);
    }
    return newSlides;
  }
}

export { VerseSlide };
