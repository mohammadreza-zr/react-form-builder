import type { FieldOption } from "../core/types.js";
import type { FieldProps } from "../react/adapter.js";
import { useFormBuilderOptions } from "../react/contexts.js";

/** The words the plain components draw themselves, in the languages the package ships. */
const TEXTS = {
  en: { add: "Add", remove: "Remove", up: "Move up", down: "Move down", from: "From", to: "To", empty: "No match", loading: "Loading…" },
  fa: { add: "افزودن", remove: "حذف", up: "بالا", down: "پایین", from: "از", to: "تا", empty: "موردی پیدا نشد", loading: "در حال بارگذاری…" },
};

export type PlainTexts = (typeof TEXTS)["en"];

/** The plain components' own words in the form's `locale` (English when it has none). */
export function usePlainTexts(): PlainTexts {
  const { locale, fallbackLocale } = useFormBuilderOptions();
  const pick = (code: string | undefined) => (code ? (TEXTS as Record<string, PlainTexts>)[code.slice(0, 2)] : undefined);
  return pick(locale) ?? pick(fallbackLocale) ?? TEXTS.en;
}

/** The attributes every plain control sets from its props. */
export function controlAttributes(props: FieldProps<any, any, any>) {
  const { config, field, id, describedBy, disabled, readOnly, required, invalid, style } = props;
  return {
    ...((config as { inputProps?: Record<string, unknown> }).inputProps ?? {}),
    id,
    name: field.name,
    ref: field.ref,
    disabled,
    readOnly,
    required,
    style,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    onBlur: field.onBlur,
  };
}

/**
 * The stored value for an option chosen by its text: the option's own value
 * (a number stays a number), as a number when the field is `numeric`.
 */
export function valueFor(options: FieldOption[], text: string, numeric?: boolean): unknown {
  const option = options.find((candidate) => String(candidate.value) === text);
  const value = option ? option.value : text;
  return numeric && value !== "" ? Number(value) : value;
}

/** A value as the text an option or a native control compares it by. */
export const asText = (value: unknown) => (value === undefined || value === null ? "" : String(value));
