import PointWidget from "src/components/PointWidget.vue";
import BibleWidget from "src/components/BibleWidget.vue";
export const outlineEntryTypes = {
  point: {
    label: "Point",
    icon: "mdi-star-four-points-circle",
    color: "blue-7",
    textColor: "text-white",
    component: PointWidget,
  },
  verse: {
    label: "Verse",
    icon: "mdi-book-cross",
    color: "green-7",
    textColor: "text-white",
    component: BibleWidget,
  },
  blank: {
    label: "Blank",
    icon: "mdi-square-medium",
    color: "grey-7",
    textColor: "text-white",
    component: PointWidget,
  },
};
