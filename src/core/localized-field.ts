import { isValidElement } from "react";

import type { FieldNode, FieldOption } from "./types.js";

/** A text, or one text per language: `{ fa: "نام", en: "Name" }`. */
export type LocalizedValue = string | Record<string, string>;

/**
 * Resolves a text that may be written in several languages into a plain
 * string. If the language asked for is missing or empty, the fallback language
 * is used, and then the first language that has a text.
 */
export function resolveLocalizedText(
  value: unknown,
  language: string,
  fallbackLanguage: string = language,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (typeof value === "object" && !Array.isArray(value) && !isValidElement(value)) {
    const dict = value as Record<string, unknown>;
    const exact = dict[language];
    if (typeof exact === "string" && exact.trim()) return exact;

    const fallback = dict[fallbackLanguage];
    if (typeof fallback === "string" && fallback.trim()) return fallback;

    for (const key of Object.keys(dict)) {
      const text = dict[key];
      if (typeof text === "string" && text.trim()) return text;
    }
  }

  return "";
}

/**
 * A text the language decides: a string, or a plain `{ [language]: text }`
 * object. Anything else — a React element, an array of nodes — is drawn as
 * written.
 */
function isLocalizable(value: unknown): boolean {
  if (typeof value === "string") return true;
  if (!value || typeof value !== "object" || Array.isArray(value) || isValidElement(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/** The text in one language, or `value` untouched when it is not a localizable text. */
function localize(value: unknown, language: string, fallbackLanguage: string): unknown {
  return isLocalizable(value) ? resolveLocalizedText(value, language, fallbackLanguage) : value;
}

const TEXT_KEYS = ["label", "placeholder", "hint", "description", "startLabel", "endLabel", "trailingText"] as const;

/**
 * The field with its texts in one language: `label`, `placeholder`, `hint`,
 * `description`, `startLabel`, `endLabel`, `trailingText` and the label of each
 * option. A group keeps its `title` and `description` and its fields are
 * resolved too.
 */
export function resolveLocalizedField<F extends FieldNode>(
  field: F,
  language: string,
  fallbackLanguage: string = language,
): F {
  if (!field) return field;
  const record = field as unknown as Record<string, unknown>;

  if (field.type === "group") {
    return {
      ...field,
      title: localize(record.title, language, fallbackLanguage),
      description: localize(record.description, language, fallbackLanguage),
      fields: (field.fields ?? []).map((inner) => resolveLocalizedField(inner, language, fallbackLanguage)),
    };
  }

  const result: Record<string, unknown> = { ...record };
  for (const key of TEXT_KEYS) {
    if (record[key]) result[key] = localize(record[key], language, fallbackLanguage);
  }
  if (Array.isArray(field.options)) {
    result.options = field.options.map((option: FieldOption) => ({
      ...option,
      label: localize(option.label, language, fallbackLanguage),
    }));
  }
  return result as F;
}
