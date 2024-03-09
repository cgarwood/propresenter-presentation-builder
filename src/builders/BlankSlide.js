import { v4 as uuidv4 } from "uuid";
import { ACTION_SLIDE } from "src/const";
import { BaseSlide } from "./base";

class BlankSlide extends BaseSlide {
  async generateSlides() {
    if (!this.slideTemplate) {
      await this.loadSlideTemplate("blank");
    }

    let newSlide = this.slideTemplate;
    newSlide.uuid.string = uuidv4();

    const action = newSlide.actions.find((a) => a.type === ACTION_SLIDE);
    action.uuid.string = uuidv4();
    action.slide.presentation.baseSlide.uuid.string = uuidv4();
    action.label = {};

    return newSlide;
  }
}
export { BlankSlide };
