import { v4 as uuidv4 } from "uuid";
import { ACTION_SLIDE } from "src/const";
import { BaseSlide } from "./base";

class QuoteSlide extends BaseSlide {
  async generateSlides() {
    if (!this.slideTemplate) {
      await this.loadSlideTemplate("quote");
    }

    let newSlide = this.slideTemplate;
    newSlide.uuid.string = uuidv4();

    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();

    this._updateTextElementByName(
      action,
      ["Text", "TextElement", "Quote"],
      this.widgetData.text,
    );
    this._updateTextElementByName(
      action,
      ["Caption", "Reference", "Author", "Quote Author", "Name"],
      this.widgetData.author,
    );

    return newSlide;
  }
}

export { QuoteSlide };
