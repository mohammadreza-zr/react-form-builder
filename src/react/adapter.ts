import type { ComponentType, ReactNode } from "react";
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

import type {
  FieldExtras,
  FieldConfigForType,
  FormFieldConfig,
  FormFieldType,
  GroupField,
} from "./config.js";

/** Draws fields inside a field or a group, through the same pipeline as the form. */
export type RenderFields<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = (
  fields: FormFieldConfig<T, X>[],
  options?: { inline?: boolean },
) => ReactNode;

/** What the builder hands the component of one field type. */
export type FieldProps<
  C = unknown,
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  /** The resolved config: dependencies, access and language already applied. */
  config: C;
  /** react-hook-form's binding of the field. */
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
  /** The element id, with the form's `idScope`. */
  id: string;
  /** `true` when drawn inside another field's box. */
  inline: boolean;
  /** The config's `disabled` or the form's. */
  disabled: boolean;
  required: boolean;
  /**
   * For fields that nest others (a segmented field's trailing slot). Declared
   * as a method so a component written for one set of extras can be placed in
   * a set with more.
   */
  renderFields(
    fields: FormFieldConfig<T, X>[],
    options?: { inline?: boolean },
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

export type GroupProps<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  config: GroupField<T, X>;
  /** The group's fields, drawn by the builder (inline when the config says so). */
  children: ReactNode;
};

/**
 * What a project supplies: one component per field type, plus the layout
 * items. A type without a component draws `fallback`, or nothing.
 */
export type FormComponents<
  T extends FieldValues = FieldValues,
  X extends FieldExtras = {},
> = {
  fields: {
    [K in Exclude<FormFieldType<X>, "break" | "group">]?: ComponentType<
      FieldProps<FieldConfigForType<T, K, X>, T, X>
    >;
  };
  group?: ComponentType<GroupProps<T, X>>;
  break?: ComponentType;
  fallback?: ComponentType<{ type: string }>;
};
