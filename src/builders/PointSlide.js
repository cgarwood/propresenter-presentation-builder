import { v4 as uuidv4 } from "uuid";
import { ACTION_SLIDE } from "src/const";
import { BaseSlide } from "./base";

class PointSlide extends BaseSlide {
  async generateSlides() {
    if (!this.slideTemplate) {
      await this.loadSlideTemplate("point");
    }

    let newSlide = this.slideTemplate;
    newSlide.uuid.string = uuidv4();

    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();
    action.label = {};

    const textElementIndex =
      action.slide.presentation.baseSlide.elements.findIndex(
        (e) => e.element.text.rtfData !== null,
      );
    const textElement =
      action.slide.presentation.baseSlide.elements[textElementIndex];
    this._updateTextElement(textElement, this.widgetData.text);

    return newSlide;
  }
}
export { PointSlide };
