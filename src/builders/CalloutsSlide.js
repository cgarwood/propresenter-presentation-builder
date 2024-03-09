import { v4 as uuidv4 } from "uuid";
import { ACTION_SLIDE } from "src/const";
import { BaseSlide } from "./base";

class CalloutsSlide extends BaseSlide {
  async generateSlides() {
    if (!this.slideTemplate) {
      await this.loadSlideTemplate("callouts");
    }

    let newSlide = this.slideTemplate;
    newSlide.uuid.string = uuidv4();

    // Find the action for the slide layer
    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();

    this._updateTextElementByName(
      action,
      ["Topic 1", "Title 1"],
      this.widgetData.callout1title,
    );
    this._updateTextElementByName(
      action,
      ["Description 1", "Content 1", "Text 1"],
      this.widgetData.callout1text,
    );
    this._updateTextElementByName(
      action,
      ["Topic 2", "Title 2"],
      this.widgetData.callout2title,
    );
    this._updateTextElementByName(
      action,
      ["Description 2", "Content 2", "Text 2"],
      this.widgetData.callout2text,
    );
    this._updateTextElementByName(
      action,
      ["Topic 3", "Title 3"],
      this.widgetData.callout3title,
    );
    this._updateTextElementByName(
      action,
      ["Description 3", "Content 3", "Text 3"],
      this.widgetData.callout3text,
    );

    return newSlide;
  }
}
export { CalloutsSlide };
