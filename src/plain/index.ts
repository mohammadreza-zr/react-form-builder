import type { FormComponents } from "../react/adapter.js";
import {
  PlainSegmented,
  PlainRadio,
  PlainSelect,
  PlainSwitch,
} from "./choices.js";
import {
  PlainCheckbox,
  PlainColor,
  PlainCustom,
  PlainDate,
  PlainInput,
  PlainRange,
  PlainSlider,
  PlainTextarea,
} from "./inputs.js";
import { PlainBreak, PlainGroup } from "./layout.js";

export { FieldFrame } from "./field-frame.js";
export * from "./choices.js";
export * from "./inputs.js";
export * from "./layout.js";

/** Native HTML for every field type of the package, for docs and tests. */
export const plainComponents: FormComponents<any, any> = {
  fields: {
    text: PlainInput,
    number: PlainInput,
    password: PlainInput,
    search: PlainInput,
    textarea: PlainTextarea,
    select: PlainSelect,
    radio: PlainRadio,
    switch: PlainSwitch,
    checkbox: PlainCheckbox,
    slider: PlainSlider,
    color: PlainColor,
    date: PlainDate,
    time: PlainDate,
    datetime: PlainDate,
    "range-date": PlainRange,
    "range-datetime": PlainRange,
    segmented: PlainSegmented,
    custom: PlainCustom,
  },
  group: PlainGroup,
  break: PlainBreak,
};
