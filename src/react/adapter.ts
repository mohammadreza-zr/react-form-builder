import type { ComponentType, CSSProperties, ReactNode } from "react";
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

import type { FieldOption } from "../core/types.js";
import type {
  FieldExtras,
  FieldConfigForType,
  FormFieldConfig,
  FormFieldConfigByType,
  FormFieldType,
} from "./config.js";

/** Draws fields inside a field or a group, through the same pipeline as the form. */
export type RenderFields<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = (
  fields: FormFieldConfig<T, X>[],
  options?: { inline?: boolean; columns?: number },
) => ReactNode;

/** The state of a field's loaded options, and what the component can ask of them. */
export type OptionsState = {
  /** The first page for the current inputs is loading. */
  loading: boolean;
  /** A further page is loading. */
  loadingMore: boolean;
  /** What the last load threw; `null` when it did not. */
  error: unknown;
  /** The text the user typed. */
  search: string;
  /** Load the options for a typed text (after `searchDelay`). */
  setSearch: (text: string) => void;
  /** The last page said there are more. */
  hasMore: boolean;
  /** How many options there are in all, when the loader says. */
  total?: number;
  /** Load the next page. Does nothing while one loads or when there is none. */
  loadMore: () => void;
  /** Start loading a field with `loadOn: "open"`: call it when the list opens. */
  open: () => void;
  /** Load the current inputs again, past the shared answers. */
  retry: () => void;
};

/** What the builder hands the component of one field type. */
export type FieldProps<
  C = unknown,
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  /** The resolved config: defaults, dependencies, access and language applied. */
  config: C;
  /** react-hook-form's binding of the field, through the config's `format`/`parse`. */
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
  /**
   * The form's control, for a field whose value is kept in more than one form
   * field: `useController({ control, name })` binds another.
   */
  control: Control<T>;
  /** The element id, with the form's `idScope`. */
  id: string;
  /** The ids of the description and the error, for `aria-describedby`. */
  describedBy?: string;
  /** `true` when drawn inside another field's box. */
  inline: boolean;
  /** The config's `disabled`, a dependency's, or a missing write permission. */
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  /** The options after dependencies and loading; `[]` for a field without them. */
  options: FieldOption[];
  optionsState: OptionsState;
  /** The field's place in the layout; set only when no wrapper draws it. */
  style?: CSSProperties;
  /**
   * For fields that nest others (a segmented field's trailing slot). Declared
   * as a method so a component written for one set of extras can be placed in
   * a set with more.
   */
  renderFields(
    fields: FormFieldConfig<T, X>[],
    options?: { inline?: boolean; columns?: number },
  ): ReactNode;
};

/**
 * The props of the component for the field type `K`, with the config of that
 * type: `FieldPropsOf<"text", Extras>` is what a `text` component receives
 * once an adapter has added `Extras` to the field types.
 */
export type FieldPropsOf<
  K extends string,
  X extends FieldExtras = {},
  T extends FieldValues = FieldValues,
> = FieldProps<FieldConfigForType<T, K & FormFieldType<X>, X>, T, X>;

/**
 * Where a field's label is drawn: by the wrapper above the control
 * (`"wrapper"`), by the wrapper as the caption of a group of controls that
 * point to it with `aria-labelledby={id + "-label"}` (`"group"`), by the
 * control itself, as a checkbox does (`"control"`), or nowhere (`"none"`).
 */
export type LabelPlacement = "wrapper" | "group" | "control" | "none";

/**
 * A field type's component. The object form says where its label goes, and
 * `wrapper: false` draws the component without the wrapper.
 */
export type FieldEntry<P> =
  | ComponentType<P>
  | { component: ComponentType<P>; label?: LabelPlacement; wrapper?: boolean };

/** What the wrapper around every field receives: the one place for label, help and error. */
export type WrapperProps = {
  /** The resolved config. */
  config: {
    type: string;
    name?: string;
    label?: string;
    description?: string;
    hint?: ReactNode;
    className?: string;
  };
  id: string;
  label: LabelPlacement;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
  /** The error message to show. */
  error?: string;
  inline: boolean;
  /** The field's place in the layout: width, grow, or grid span. */
  style?: CSSProperties;
  children: ReactNode;
};

export type GroupProps<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  config: FormFieldConfigByType<T, X>["group"];
  /** The group's fields, drawn by the builder (inline when the config says so). */
  children: ReactNode;
  style?: CSSProperties;
};

/** One row of an array field. */
export type ArrayRow = {
  /** A stable key for the row. */
  key: string;
  index: number;
  /** The row's fields, drawn. */
  children: ReactNode;
  remove: () => void;
  canRemove: boolean;
  /** Present when the array is `sortable` and the row can move that way. */
  moveUp?: () => void;
  moveDown?: () => void;
};

/** What the component of an `array` field receives. */
export type ArrayProps<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  config: FormFieldConfigByType<T, X>["array"];
  id: string;
  rows: ArrayRow[];
  append: () => void;
  canAppend: boolean;
  disabled: boolean;
  required: boolean;
  /** The error of the list itself (`minRows`, `maxRows`). */
  error?: string;
  style?: CSSProperties;
};

/** The container of a list of fields: a form, a group's body, an array row. */
export type LayoutProps = {
  /** Lay the fields on a grid of this many columns; without it a wrapping row. */
  columns?: number;
  inline: boolean;
  children: ReactNode;
};

/** The buttons under a `Form`. */
export type ActionsProps = {
  submitLabel: string;
  /** Present when the form shows a reset button. */
  resetLabel?: string;
  submitting: boolean;
  dirty: boolean;
  onReset: () => void;
};

/**
 * What a project supplies: one component per field type, plus the wrapper and
 * the layout pieces. Every key is optional: what is left out is drawn by the
 * plain components, so a project replaces only what it styles.
 */
export type FormComponents<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  fields?: {
    [K in Exclude<FormFieldType<X>, "break" | "group" | "array">]?: FieldEntry<
      FieldProps<FieldConfigForType<T, K, X>, T, X>
    >;
  };
  /** Around every field; `null` draws each field bare. */
  wrapper?: ComponentType<WrapperProps> | null;
  group?: ComponentType<GroupProps<T, X>>;
  array?: ComponentType<ArrayProps<T, X>>;
  break?: ComponentType;
  layout?: ComponentType<LayoutProps>;
  actions?: ComponentType<ActionsProps>;
  /** A type with no component draws this, or nothing. */
  fallback?: ComponentType<{ type: string }>;
};
