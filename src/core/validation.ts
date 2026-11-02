import { isFilled } from "./dependency.js";
import { type LocalizedValue, resolveLocalizedText } from "./localized-field.js";

/**
 * The messages of the rules a field config sets. Each is a text or one text
 * per language, with `{label}`, `{min}`, `{max}` and `{length}` filled in.
 */
export type ValidationMessages = {
  /** What `{label}` becomes for a field without a label. */
  field: LocalizedValue;
  required: LocalizedValue;
  minLen: LocalizedValue;
  maxLen: LocalizedValue;
  /** `minLen` of a list: tags, a multiple choice, files. */
  minItems: LocalizedValue;
  maxItems: LocalizedValue;
  min: LocalizedValue;
  max: LocalizedValue;
  pattern: LocalizedValue;
  email: LocalizedValue;
  url: LocalizedValue;
  length: LocalizedValue;
  maxSize: LocalizedValue;
  minRows: LocalizedValue;
  maxRows: LocalizedValue;
  minDate: LocalizedValue;
  maxDate: LocalizedValue;
};

export const defaultMessages: ValidationMessages = {
  field: { en: "This field", fa: "این فیلد" },
  required: { en: "{label} is required.", fa: "{label} الزامی است." },
  minLen: { en: "{label} needs at least {min} characters.", fa: "{label} باید حداقل {min} نویسه باشد." },
  maxLen: { en: "{label} takes at most {max} characters.", fa: "{label} حداکثر {max} نویسه می‌پذیرد." },
  minItems: { en: "Choose at least {min} for {label}.", fa: "برای {label} حداقل {min} مورد انتخاب کنید." },
  maxItems: { en: "Choose at most {max} for {label}.", fa: "برای {label} حداکثر {max} مورد انتخاب کنید." },
  min: { en: "{label} must be at least {min}.", fa: "{label} باید حداقل {min} باشد." },
  max: { en: "{label} must be at most {max}.", fa: "{label} باید حداکثر {max} باشد." },
  pattern: { en: "{label} is not in the expected format.", fa: "قالب {label} درست نیست." },
  email: { en: "Enter a valid email address.", fa: "یک نشانی ایمیل درست وارد کنید." },
  url: { en: "Enter a valid web address.", fa: "یک نشانی وب درست وارد کنید." },
  length: { en: "{label} needs exactly {length} characters.", fa: "{label} باید دقیقاً {length} نویسه باشد." },
  maxSize: { en: "Each file of {label} can be at most {max}.", fa: "هر فایل {label} حداکثر {max} می‌تواند باشد." },
  minRows: { en: "{label} needs at least {min} rows.", fa: "{label} باید حداقل {min} ردیف داشته باشد." },
  maxRows: { en: "{label} takes at most {max} rows.", fa: "{label} حداکثر {max} ردیف می‌پذیرد." },
  minDate: { en: "{label} cannot be before {min}.", fa: "{label} نمی‌تواند پیش از {min} باشد." },
  maxDate: { en: "{label} cannot be after {max}.", fa: "{label} نمی‌تواند پس از {max} باشد." },
};

/**
 * One validation message for one field, in `options.locale`: the field's own
 * `messages`, else the form's, else the package's, with `{label}` and `vars`
 * filled in.
 */
export function validationMessage(
  key: keyof ValidationMessages,
  vars: Record<string, unknown>,
  field: { label?: unknown; messages?: Partial<ValidationMessages> },
  options: RuleOptions = {},
): string {
  const locale = options.locale ?? "en";
  const fallback = options.fallbackLocale ?? "en";
  const source = field.messages?.[key] ?? options.messages?.[key] ?? defaultMessages[key];
  const label =
    resolveLocalizedText(field.label, locale, fallback) ||
    resolveLocalizedText(field.messages?.field ?? options.messages?.field ?? defaultMessages.field, locale, fallback);
  const filled: Record<string, unknown> = { label, ...vars };
  return resolveLocalizedText(source, locale, fallback).replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in filled ? String(filled[name]) : whole,
  );
}

/** What a rule answers: `true` or nothing when the value is fine, else the message. */
export type ValidateResult = string | boolean | undefined;

/** One rule of a field, as react-hook-form's `validate` takes it. */
export type FieldRule = (value: unknown, values: Record<string, unknown>) => ValidateResult | Promise<ValidateResult>;

/** The keys of a field config the rules read. */
export interface RuleSource {
  type: string;
  label?: unknown;
  required?: boolean;
  disabled?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
  pattern?: RegExp | string;
  length?: number;
  maxSize?: number;
  minDate?: string;
  maxDate?: string;
  multiple?: boolean;
  messages?: Partial<ValidationMessages>;
  validate?: (value: unknown, values: never) => ValidateResult | Promise<ValidateResult>;
}

export interface RuleOptions {
  messages?: Partial<ValidationMessages>;
  locale?: string;
  fallbackLocale?: string;
  /**
   * The Jalali day text (`YYYY/MM/DD`) a date field's value stands for, for
   * `minDate`/`maxDate`. Defaults to the value itself when it is text; the
   * builder passes one that reads the field's `valueFormat`.
   */
  dayOf?: (value: unknown) => string | null;
}

/** Field types that hold `true` or `false`: required means `true`. */
const BOOLEAN_TYPES = new Set(["checkbox", "switch"]);
/** Field types whose value is a list: lengths count items. */
const LIST_TYPES = new Set(["tags"]);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** A size in bytes as people write it: `2 MB`. */
export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${Number.isInteger(size) ? size : size.toFixed(1)} ${units[unit]}`;
}

/** A Jalali day text as a number that sorts like the day: `1405/05/09` → `14050509`. */
function dayNumber(text: string): number | null {
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text.trim());
  return match ? Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]) : null;
}

function isRangeValue(value: unknown): value is { from?: unknown; to?: unknown } {
  return !!value && typeof value === "object" && !Array.isArray(value) && ("from" in value || "to" in value);
}

/**
 * The react-hook-form rules a field config sets: `required`, `minLen`/`maxLen`
 * (characters, or items for a list), `min`/`max`, `pattern`, the format of an
 * `email` or `url` field, an `otp`'s `length`, a file's `maxSize`, a date's
 * `minDate`/`maxDate`, and the config's own `validate`. A disabled field has
 * none. An empty value passes every rule but `required`.
 */
export function fieldRules(field: RuleSource, options: RuleOptions = {}): Record<string, FieldRule> {
  if (field.disabled) return {};
  const text = (key: keyof ValidationMessages, vars: Record<string, unknown> = {}) =>
    validationMessage(key, vars, field, options);

  const rules: Record<string, FieldRule> = {};
  const isList = LIST_TYPES.has(field.type) || field.multiple === true;

  if (field.required) {
    rules.required = (value) => {
      if (BOOLEAN_TYPES.has(field.type)) return value === true || text("required");
      if (isRangeValue(value)) return (isFilled(value.from) && isFilled(value.to)) || text("required");
      return isFilled(value) || text("required");
    };
  }

  if (field.minLen !== undefined || field.maxLen !== undefined) {
    rules.length = (value) => {
      if (!isFilled(value)) return true;
      const size = Array.isArray(value) ? value.length : typeof value === "string" ? value.length : null;
      if (size === null) return true;
      const list = isList || Array.isArray(value);
      if (field.minLen !== undefined && size < field.minLen) return text(list ? "minItems" : "minLen", { min: field.minLen });
      if (field.maxLen !== undefined && size > field.maxLen) return text(list ? "maxItems" : "maxLen", { max: field.maxLen });
      return true;
    };
  }

  if ((field.min !== undefined || field.max !== undefined) && field.type !== "array") {
    rules.range = (value) => {
      if (!isFilled(value) || typeof value === "boolean") return true;
      const number = Number(value);
      if (!Number.isFinite(number)) return true;
      if (field.min !== undefined && number < field.min) return text("min", { min: field.min });
      if (field.max !== undefined && number > field.max) return text("max", { max: field.max });
      return true;
    };
  }

  if (field.pattern !== undefined) {
    const pattern = typeof field.pattern === "string" ? new RegExp(field.pattern) : field.pattern;
    rules.pattern = (value) => {
      if (typeof value !== "string" || value === "") return true;
      pattern.lastIndex = 0;
      return pattern.test(value) || text("pattern");
    };
  }

  if (field.type === "email") {
    rules.email = (value) => typeof value !== "string" || value === "" || EMAIL.test(value.trim()) || text("email");
  }

  if (field.type === "url") {
    rules.url = (value) => typeof value !== "string" || value === "" || isUrl(value.trim()) || text("url");
  }

  if (field.type === "otp" && field.length !== undefined) {
    rules.otp = (value) =>
      typeof value !== "string" || value === "" || value.length === field.length || text("length", { length: field.length });
  }

  if (field.maxSize !== undefined) {
    const limit = field.maxSize;
    rules.maxSize = (value) => {
      const files = (Array.isArray(value) ? value : [value]).filter(
        (item): item is { size: number } => !!item && typeof (item as { size?: unknown }).size === "number",
      );
      return files.every((file) => file.size <= limit) || text("maxSize", { max: formatBytes(limit) });
    };
  }

  if (field.minDate !== undefined || field.maxDate !== undefined) {
    const min = field.minDate === undefined ? null : dayNumber(field.minDate);
    const max = field.maxDate === undefined ? null : dayNumber(field.maxDate);
    const dayOf = options.dayOf ?? ((value: unknown) => (typeof value === "string" ? value : null));
    const check = (value: unknown): ValidateResult => {
      const day = isFilled(value) ? dayOf(value) : null;
      if (!day) return true;
      const at = dayNumber(day);
      if (at === null) return true;
      if (min !== null && at < min) return text("minDate", { min: field.minDate });
      if (max !== null && at > max) return text("maxDate", { max: field.maxDate });
      return true;
    };
    rules.dates = (value) => {
      if (isRangeValue(value)) {
        const from = check(value.from);
        return from === true ? check(value.to) : from;
      }
      return check(value);
    };
  }

  if (field.validate) {
    const validate = field.validate as FieldRule;
    rules.custom = (value, values) => validate(value, values);
  }

  return rules;
}
