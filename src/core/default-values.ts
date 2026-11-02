import { set } from "react-hook-form";

import type { FieldNode } from "./types.js";

/** The config keys `emptyValueOf` and `defaultValuesOf` read. */
export interface ValueSource extends FieldNode {
  defaultValue?: unknown;
  multiple?: boolean;
  valueFormat?: unknown;
  minRows?: number;
}

/**
 * The value a field of this type holds while nothing is entered: `""` for
 * text, `false` for a checkbox or switch, `[]` for a list, `null` for a date
 * held as parts or a date-time, `undefined` for a number. A form starts each
 * field from it, so every control is controlled from the first render.
 */
export function emptyValueOf(field: ValueSource): unknown {
  switch (field.type) {
    case "checkbox":
    case "switch":
      return false;
    case "number":
    case "slider":
    case "hidden":
    case "custom":
      return undefined;
    case "tags":
    case "array":
      return [];
    case "select":
    case "combobox":
      return field.multiple ? [] : "";
    case "file":
      return field.multiple ? [] : null;
    case "segmented":
      return field.options?.length ? "" : false;
    case "range-date":
    case "range-datetime":
      return { from: "", to: "" };
    case "date":
      return field.valueFormat === "parts" || field.valueFormat === "date-time" ? null : "";
    default:
      return "";
  }
}

/**
 * The starting values of a form: each field's `defaultValue`, or the empty
 * value of its type. Groups and `trailing` fields are included; an array
 * starts with `minRows` rows of its row fields' starting values.
 */
export function defaultValuesOf(fields: FieldNode[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  collect(fields as ValueSource[], values);
  return values;
}

/** The starting values of one row of an array: its row fields', by relative name. */
export function rowDefaultsOf(field: FieldNode): Record<string, unknown> {
  return defaultValuesOf(field.fields ?? []);
}

function collect(fields: ValueSource[], values: Record<string, unknown>) {
  for (const field of fields) {
    if (field.type === "break") continue;
    if (field.type === "group") {
      collect((field.fields ?? []) as ValueSource[], values);
      continue;
    }
    if (field.name) {
      const value =
        field.defaultValue !== undefined
          ? field.defaultValue
          : field.type === "array"
            ? Array.from({ length: field.minRows ?? 0 }, () => rowDefaultsOf(field))
            : emptyValueOf(field);
      set(values, field.name, value);
    }
    if (field.trailing) collect(field.trailing as ValueSource[], values);
  }
}
