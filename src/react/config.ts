import type { ReactNode } from "react";
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

import type { Dependency, FieldOption, WatchSnapshot } from "../core/types.js";
import type { ValidateResult, ValidationMessages } from "../core/validation.js";
import type { DayPicker, DayValueFormat } from "../jalali/value.js";

/**
 * A field's width in a wrapping row: a fixed width (`408`, `"100%"`), or a
 * range — `{ min, max }` starts at `min`, grows into the row's leftover space
 * up to `max`.
 */
export type FieldWidth = number | string | { min: number; max: number };

/**
 * What an adapter adds to the field types: `{ text: { icon?: ReactNode } }`
 * adds a key to `text`, and a type the package does not know (`plate`) becomes
 * a field type of its own. `{}` adds nothing.
 */
export type FieldExtras = Record<string, object>;

/** What an options loader is given. */
export type OptionsLoaderContext<T extends FieldValues = FieldValues> = {
  /** The fields named in `optionsDeps`, by name. */
  values: WatchSnapshot<T>;
  /** What the user typed into a searchable field; `""` otherwise. */
  search: string;
  /** The page asked for, from 1. It grows only when the component asks for more. */
  page: number;
  /** Aborted when no field waits for this load any more. */
  signal: AbortSignal;
};

/** One page of loaded options: `hasMore` lets the component ask for the next. */
export type OptionsPage = {
  options: FieldOption[];
  hasMore?: boolean;
  /** How many options the server has in all, when it says. */
  total?: number;
};

/** Loads a field's options: a list, or one page of them. */
export type OptionsLoader<T extends FieldValues = FieldValues> = (
  context: OptionsLoaderContext<T>,
) => Promise<FieldOption[] | OptionsPage> | FieldOption[] | OptionsPage;

/** The keys every field takes. */
export type BaseField<T extends FieldValues = FieldValues> = {
  name: Path<T>;
  label?: string;
  description?: string;
  /** Help under the control; may be a React node (a link). */
  hint?: ReactNode;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Shown and submitted, not editable. */
  readOnly?: boolean;
  /** The value the field starts with in a `Form`; without it, the empty value of its type. */
  defaultValue?: unknown;
  /** The permission the field needs; without it the field is not in the form. */
  permission?: string;
  /** The permission that lets the user change the value; without it the field is read-only. */
  writePermission?: string;
  /** Fewest characters, or items for a list. */
  minLen?: number;
  /** Most characters, or items for a list. */
  maxLen?: number;
  min?: number;
  max?: number;
  /** A text value must match it. */
  pattern?: RegExp | string;
  /** A rule of the field's own: `true` when the value is fine, else the message. */
  validate?: (value: unknown, values: T) => ValidateResult | Promise<ValidateResult>;
  /** This field's own validation messages, over the form's. */
  messages?: Partial<ValidationMessages>;
  dependencies?: Dependency<T>[];
  /**
   * Fields whose change puts this one back to its starting value: a city when
   * the province changes. A change of both in one pass (a record loaded into
   * the form) keeps both.
   */
  resetOn?: Path<T>[];
  /** The field's width in a wrapping row. */
  width?: FieldWidth;
  /** Let the field take the row's leftover space on top of its `width`. */
  grow?: boolean;
  /** The columns the field spans in a form or group with `columns`; `"full"` for the whole row. */
  colSpan?: number | "full";
  /** Class on the field's wrapper. */
  className?: string;
  /** Whatever else the control takes; the adapter decides what it spreads where. */
  inputProps?: Record<string, unknown>;
  /** The stored value as the control shows it. */
  format?: (value: unknown) => unknown;
  /** What the control gives back, as it is stored. */
  parse?: (value: unknown) => unknown;
};

/** The keys of a field that offers options, fixed or loaded. */
export type OptionsSource<T extends FieldValues = FieldValues> = {
  options?: FieldOption[];
  /** Loads the options; `options` are shown until the first load ends. */
  loadOptions?: OptionsLoader<T>;
  /** The fields `loadOptions` reads; a change in one loads again. */
  optionsDeps?: Path<T>[];
  /** Anything else `loadOptions` reads (an id from the page); a change loads again. */
  optionsKey?: unknown;
  /** Load when the field is drawn (`"mount"`, the default), or when the component calls `open`. */
  loadOn?: "mount" | "open";
  /** How long a typed search waits for the next keystroke, in ms. Default 250. */
  searchDelay?: number;
  /** Hold the options' values as numbers. */
  numeric?: boolean;
};

export type TextFieldType =
  | "text"
  | "password"
  | "search"
  | "email"
  | "tel"
  | "url"
  | "textarea";

export type TextField<
  T extends FieldValues = FieldValues,
  TType extends TextFieldType = TextFieldType,
> = BaseField<T> & {
  type: TType;
  /** Rewrites the typed text before it is stored. */
  normalize?: (value: string) => string;
  /** `textarea`: the visible lines. */
  rows?: number;
};

export type NumberField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "number";
  step?: number;
};

export type SelectField<T extends FieldValues = FieldValues> = BaseField<T> &
  OptionsSource<T> & {
    type: "select";
    /** Bind a list of the chosen values. */
    multiple?: boolean;
    /** A choice that empties the field. */
    clearable?: boolean;
  };

export type RadioField<T extends FieldValues = FieldValues> = BaseField<T> &
  OptionsSource<T> & {
    type: "radio";
  };

/** A searchable choice; with `multiple` a list, with `creatable` also values typed in. */
export type ComboboxField<T extends FieldValues = FieldValues> = BaseField<T> &
  OptionsSource<T> & {
    type: "combobox";
    multiple?: boolean;
    /** Keep a typed value that is not an option. */
    creatable?: boolean;
    /** Shown when no option matches. */
    emptyText?: string;
  };

/** Free texts, as a list of strings. */
export type TagsField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "tags";
};

export type ToggleField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "checkbox" | "switch";
};

export type SliderField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "slider";
  step?: number;
  showValue?: boolean;
};

export type ColorField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "color";
  /** Shown while the value is empty. */
  fallback?: string;
};

/** A `File`, or a list of them with `multiple`. */
export type FileField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "file";
  multiple?: boolean;
  /** The kinds of file offered, as the `accept` attribute takes them. */
  accept?: string;
  /** The largest file, in bytes. */
  maxSize?: number;
};

/** A one-time code of `length` characters, digits only unless `numeric` is `false`. */
export type OtpField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "otp";
  length?: number;
  numeric?: boolean;
};

/** A value the form holds and submits without drawing it. */
export type HiddenField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "hidden";
};

export type DateFieldType = "date" | "time" | "datetime";

export type DateField<
  T extends FieldValues = FieldValues,
  TType extends DateFieldType = DateFieldType,
> = BaseField<T> & {
  type: TType;
  /** The earliest day, as Jalali `YYYY/MM/DD`. */
  minDate?: string;
  /** The latest day, as Jalali `YYYY/MM/DD`. */
  maxDate?: string;
} & (TType extends "date"
    ? {
        /**
         * What a `date` field binds. `"text"` (default) is the Jalali
         * `YYYY/MM/DD` string; `"parts"` is `{ year, month, day }`;
         * `"date-time"` is that day's midnight as an ISO `date-time`; a
         * `DayValueCodec` is a shape of your own. A cleared field holds `""`
         * for text and `null` for the others.
         */
        valueFormat?: DayValueFormat;
        /** `month` holds a Jalali year and month as `YYYY/MM` (`text` only). */
        picker?: DayPicker;
      }
    : unknown);

export type RangeFieldType = "range-date" | "range-datetime";

export type RangeField<
  T extends FieldValues = FieldValues,
  TType extends RangeFieldType = RangeFieldType,
> = BaseField<T> & {
  type: TType;
  startLabel?: string;
  endLabel?: string;
  minDate?: string;
  maxDate?: string;
};

/** With no `options` it binds a boolean; with options it binds the chosen `value`. */
export type SegmentedField<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = BaseField<T> &
  OptionsSource<T> & {
    type: "segmented";
    /** Fields drawn inside the same box after the segments. */
    trailing?: FormFieldConfig<T, X>[];
  };

/** What a `custom` field's `render` receives. */
export type CustomFieldRenderProps<T extends FieldValues = FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
  id: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

/** A control the package has no field type for; the form still owns binding, rules and error. */
export type CustomField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "custom";
  render: (props: CustomFieldRenderProps<T>) => ReactNode;
};

/**
 * A list of rows, each with the same `fields`. Row fields are named relative
 * to the row (`"price"` is `items.0.price` in the first); a name starting
 * with `/` in a row's conditions names a field of the whole form.
 */
export type ArrayField<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = Omit<BaseField<T>, "minLen" | "maxLen" | "pattern" | "format" | "parse"> & {
  type: "array";
  fields: FormFieldConfig<any, X>[];
  minRows?: number;
  maxRows?: number;
  addLabel?: string;
  removeLabel?: string;
  /** Rows can be moved up and down. */
  sortable?: boolean;
  /** The columns of each row's grid. */
  columns?: number;
  /** A new row's values; defaults to its fields' starting values. */
  newRow?: () => Record<string, unknown>;
};

/** Ends the row it lands on, so the next field starts a new line. */
export type BreakField = { type: "break" };

/** Related fields in one container. `inline` draws them bare, in a line. */
export type GroupField<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  type: "group";
  /** The adapter's name for how the group looks (`card`, `box`, …). */
  variant?: string;
  title?: ReactNode;
  description?: ReactNode;
  /** Draw the fields bare with their labels inline, as a field's own box does. */
  inline?: boolean;
  /** Lay the fields out on a grid of this many columns. */
  columns?: number;
  /** The permission the group needs; without it the group is not in the form. */
  permission?: string;
  width?: FieldWidth;
  colSpan?: number | "full";
  className?: string;
  fields: FormFieldConfig<T, X>[];
};

type BuiltinConfig<
  T extends FieldValues,
  X extends FieldExtras,
> = {
  text: TextField<T, "text">;
  password: TextField<T, "password">;
  search: TextField<T, "search">;
  email: TextField<T, "email">;
  tel: TextField<T, "tel">;
  url: TextField<T, "url">;
  textarea: TextField<T, "textarea">;
  number: NumberField<T>;
  select: SelectField<T>;
  radio: RadioField<T>;
  combobox: ComboboxField<T>;
  tags: TagsField<T>;
  checkbox: ToggleField<T> & { type: "checkbox" };
  switch: ToggleField<T> & { type: "switch" };
  slider: SliderField<T>;
  color: ColorField<T>;
  file: FileField<T>;
  otp: OtpField<T>;
  hidden: HiddenField<T>;
  date: DateField<T, "date">;
  time: DateField<T, "time">;
  datetime: DateField<T, "datetime">;
  "range-date": RangeField<T, "range-date">;
  "range-datetime": RangeField<T, "range-datetime">;
  segmented: SegmentedField<T, X>;
  custom: CustomField<T>;
  array: ArrayField<T, X>;
  break: BreakField;
  group: GroupField<T, X>;
};

/** The field types of the package. */
export type BuiltinFieldType = keyof BuiltinConfig<FieldValues, FieldExtras>;

/** Every field type, by name, with the adapter's extras merged in. */
export type FormFieldConfigByType<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  [K in BuiltinFieldType]: BuiltinConfig<T, X>[K] &
    (K extends keyof X ? X[K] : unknown);
} & {
  [K in Exclude<keyof X & string, BuiltinFieldType>]: BaseField<T> & { type: K } & X[K];
};

export type FormFieldType<X extends FieldExtras = {}> =
  keyof FormFieldConfigByType<FieldValues, X> & string;

/** One item of a form: a field, a `break` or a `group`. */
export type FormFieldConfig<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = FormFieldConfigByType<T, X>[keyof FormFieldConfigByType<T, X>];

/** The config of the field type `K`. */
export type FieldConfigForType<
  T extends FieldValues,
  K extends FormFieldType<X>,
  X extends FieldExtras = {},
> = FormFieldConfigByType<T, X>[K];
