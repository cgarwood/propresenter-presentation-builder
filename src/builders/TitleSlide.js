import { v4 as uuidv4 } from "uuid";
import { ACTION_SLIDE } from "src/const";
import { BaseSlide } from "./base";

class TitleSlide extends BaseSlide {
  async generateSlides() {
    let template = "title";
    if (this.widgetData.subtitle != "") {
      if (
        await this.slideTemplateExists(
          this.presentationTemplate,
          "title with subtitle",
        )
      ) {
        template = "title with subtitle";
      }
    }

    if (!this.slideTemplate) {
      await this.loadSlideTemplate(template);
    }

    let newSlide = this.slideTemplate;
    newSlide.uuid.string = uuidv4();

    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();
    action.label = {};

    // Replace title and subtitle
    this._updateTextElementByName(action, "Title", this.widgetData.title);
    this._updateTextElementByName(action, "Subtitle", this.widgetData.subtitle);

    // Return slide
    return newSlide;
  }
}

export { TitleSlide };
