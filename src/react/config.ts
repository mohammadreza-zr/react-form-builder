import type { ReactNode } from "react";
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

import type {
  Dependency,
  FieldDependency,
  FieldOption,
  SelectFieldDependency,
} from "../core/types.js";
import type { DayPicker, DayValueFormat } from "../jalali/value.js";

/**
 * A field's width in its row: a fixed width (`408`, `"100%"`), or a range —
 * `{ min, max }` starts at `min`, grows into the row's leftover space up to
 * `max`.
 */
export type FieldWidth = number | string | { min: number; max: number };

/**
 * What an adapter adds to the field types: `{ text: { icon?: ReactNode } }`
 * adds a key to `text`, and a type the package does not know (`plate`) becomes
 * a field type of its own. `{}` adds nothing.
 */
export type FieldExtras = Record<string, object>;

/** The keys every field takes. */
export type BaseField<
  T extends FieldValues = FieldValues,
  TDependency extends Dependency<T> = FieldDependency<T>,
> = {
  name: Path<T>;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  /** The permission the field needs; without it the field is not in the form. */
  permission?: string;
  /** The permission that lets the user change the value; without it the field is read-only. */
  writePermission?: string;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
  dependencies?: TDependency[];
  /** The field's width in the form's wrapping row. */
  width?: FieldWidth;
  /** Let the field take the row's leftover space on top of its `width`. */
  grow?: boolean;
  /** Class on the element the field renders into the caller's layout. */
  className?: string;
  /** Whatever else the control takes; the adapter decides what it spreads where. */
  inputProps?: Record<string, unknown>;
};

export type TextFieldType = "text" | "number" | "password" | "search" | "textarea";

export type TextField<
  T extends FieldValues = FieldValues,
  TType extends TextFieldType = TextFieldType,
> = BaseField<T> & {
  type: TType;
  placeholder?: string;
  hint?: ReactNode;
  /** Rewrites the typed text before it is stored. */
  normalize?: (value: string) => string;
};

export type ChoiceFieldType = "select" | "radio" | "switch";

export type ChoiceField<
  T extends FieldValues = FieldValues,
  TType extends ChoiceFieldType = ChoiceFieldType,
> = BaseField<T, SelectFieldDependency<T, TType>> & {
  type: TType;
  options?: FieldOption[];
  placeholder?: string;
  /** `select` only: bind a `string[]`. */
  multiple?: boolean;
  /** `select` and `radio`: the field holds the options' values as numbers. */
  numeric?: boolean;
  /** `select` only: a choice that empties the field. */
  clearable?: boolean;
  hint?: ReactNode;
};

export type CheckboxField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "checkbox";
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

export type DateFieldType = "date" | "time" | "datetime";

export type DateField<
  T extends FieldValues = FieldValues,
  TType extends DateFieldType = DateFieldType,
> = BaseField<T> & {
  type: TType;
  placeholder?: string;
  hint?: ReactNode;
} & (TType extends "date"
    ? {
        /**
         * What a `date` field binds. `"text"` (default) is the Jalali
         * `YYYY/MM/DD` string; `"parts"` is `{ year, month, day }`, the split
         * day some endpoints read and write; `"date-time"` is that day's
         * midnight as an ISO `date-time`. A cleared field holds `""` for the
         * first and `null` for the other two.
         */
        valueFormat?: DayValueFormat;
        /** `month` holds a Jalali year and month as `YY/MM` (`text` only). */
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
  hint?: ReactNode;
};

/** With no `options` it binds a boolean; with options it binds the chosen `value`. */
export type SegmentedField<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = BaseField<T, Dependency<T>> & {
  type: "segmented";
  options?: FieldOption[];
  numeric?: boolean;
  /** Fields drawn inside the same box after the segments. */
  trailing?: FormFieldConfig<T, X>[];
};

/** What a `custom` field's `render` receives. */
export type CustomFieldRenderProps<T extends FieldValues = FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

/** A control the package has no field type for; the form still owns binding and error. */
export type CustomField<T extends FieldValues = FieldValues> = BaseField<T> & {
  type: "custom";
  render: (props: CustomFieldRenderProps<T>) => ReactNode;
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
  width?: FieldWidth;
  className?: string;
  fields: FormFieldConfig<T, X>[];
};

type BuiltinConfig<
  T extends FieldValues,
  X extends FieldExtras,
> = {
  text: TextField<T, "text">;
  number: TextField<T, "number">;
  password: TextField<T, "password">;
  search: TextField<T, "search">;
  textarea: TextField<T, "textarea">;
  select: ChoiceField<T, "select">;
  radio: ChoiceField<T, "radio">;
  switch: ChoiceField<T, "switch">;
  checkbox: CheckboxField<T>;
  slider: SliderField<T>;
  color: ColorField<T>;
  date: DateField<T, "date">;
  time: DateField<T, "time">;
  datetime: DateField<T, "datetime">;
  "range-date": RangeField<T, "range-date">;
  "range-datetime": RangeField<T, "range-datetime">;
  segmented: SegmentedField<T, X>;
  custom: CustomField<T>;
  break: BreakField;
  group: GroupField<T, X>;
};

type BuiltinType = keyof BuiltinConfig<FieldValues, FieldExtras>;

/** Every field type, by name, with the adapter's extras merged in. */
export type FormFieldConfigByType<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  [K in BuiltinType]: BuiltinConfig<T, X>[K] &
    (K extends keyof X ? X[K] : unknown);
} & {
  [K in Exclude<keyof X & string, BuiltinType>]: BaseField<T> & { type: K } & X[K];
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
