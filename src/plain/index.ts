import type { FormComponents } from "../react/adapter.js";
import {
  PlainCombobox,
  PlainRadio,
  PlainSegmented,
  PlainSelect,
  PlainTags,
} from "./choices.js";
import {
  PlainColor,
  PlainCustom,
  PlainDate,
  PlainFile,
  PlainHidden,
  PlainInput,
  PlainNumber,
  PlainOtp,
  PlainRange,
  PlainSlider,
  PlainTextarea,
  PlainToggle,
} from "./inputs.js";
import {
  PlainActions,
  PlainArray,
  PlainBreak,
  PlainGroup,
  PlainLayout,
  PlainWrapper,
} from "./layout.js";

export * from "./choices.js";
export * from "./inputs.js";
export * from "./layout.js";
export { type PlainTexts, usePlainTexts } from "./shared.js";

/**
 * Native HTML for every field type of the package. A `FormBuilder` draws with
 * these wherever a project gives no component of its own.
 */
export const plainComponents: FormComponents<any, any> = {
  fields: {
    text: PlainInput,
    password: PlainInput,
    search: PlainInput,
    email: PlainInput,
    tel: PlainInput,
    url: PlainInput,
    textarea: PlainTextarea,
    number: PlainNumber,
    select: PlainSelect,
    radio: PlainRadio,
    combobox: PlainCombobox,
    tags: PlainTags,
    checkbox: PlainToggle,
    switch: PlainToggle,
    slider: PlainSlider,
    color: PlainColor,
    file: PlainFile,
    otp: PlainOtp,
    hidden: PlainHidden,
    date: PlainDate,
    time: PlainDate,
    datetime: PlainDate,
    "range-date": PlainRange,
    "range-datetime": PlainRange,
    segmented: PlainSegmented,
    custom: PlainCustom,
  },
  wrapper: PlainWrapper,
  group: PlainGroup,
  array: PlainArray,
  break: PlainBreak,
  layout: PlainLayout,
  actions: PlainActions,
};
