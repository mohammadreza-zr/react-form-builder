/**
 * Persian calendar locale data + formatting/parsing helpers.
 *
 * Pure functions, no React. Formatted dates are written in Persian digits
 * (۱۲۳) unless the caller asks for Latin ones.
 */
import {
  isJalaliLeapYear,
  jalaliMonthLength,
  jalaliWeekday,
  toGregorian,
  toJalali,
} from "./conversion.js";
import { type DateLike, type JalaliDate, isJalaliDate } from "./types.js";

/** Full Persian month names, 1-based (`MONTH_NAMES_FA[1]` = فروردین). */
export const MONTH_NAMES_FA = [
  "",
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** Latin transliteration, for `en` contexts / aria text. */
export const MONTH_NAMES_EN = [
  "",
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
] as const;

/** Persian weekday names, indexed by JS `getDay()` (0 = Sunday). */
export const WEEKDAY_NAMES_FA = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
] as const;

/** One-letter weekday headers used in the calendar grid, Saturday-first. */
export const WEEKDAY_SHORTS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert any digits in a string/number to Persian digits (۱۲۳). */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9٠-٩]/g, (d) => {
    const idx = ARABIC_DIGITS.includes(d)
      ? ARABIC_DIGITS.indexOf(d)
      : Number(d);
    return FA_DIGITS[idx] ?? d;
  });
}

/** The digits a formatted date is written in. */
export type DigitStyle = "persian" | "latin";

const digitsIn = (style: DigitStyle, input: string | number) =>
  style === "latin" ? String(input) : toPersianDigits(input);

/** Convert Persian/Arabic digits to Latin ones (for parsing user input). */
export function toLatinDigits(input: string): string {
  return input
    .split("")
    .map((ch) => {
      const fa = FA_DIGITS.indexOf(ch);
      if (fa > -1) return String(fa);
      const ar = ARABIC_DIGITS.indexOf(ch);
      if (ar > -1) return String(ar);
      return ch;
    })
    .join("");
}

/** Pad to two digits WITHOUT converting to Persian (for internal keys). */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Stable lookup key for a day: `jy/jm/jd` with Latin digits. */
export function jalaliKey(j: JalaliDate): string {
  return `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`;
}

/**
 * Normalise any `DateLike` into a `JalaliDate`.
 * Strings are read as JALALI (`"1405-05-19"`, `"1405/5/19"` both work).
 * Returns `null` when the input can't be understood — callers decide what
 * "no date" means for them instead of crashing on bad data.
 */
export function normalizeDateLike(
  value: DateLike | null | undefined,
): JalaliDate | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toJalali(value);
  }
  if (isJalaliDate(value)) {
    return { jy: value.jy, jm: value.jm, jd: value.jd };
  }
  const cleaned = toLatinDigits(String(value)).trim().replace(/[./]/g, "-");
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(cleaned);
  if (!m) return null;
  const [, y, mo, d] = m;
  const jy = Number(y);
  const jm = Number(mo);
  const jd = Number(d);
  if (jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) {
    return null;
  }
  return { jy, jm, jd };
}

/** True when two `JalaliDate`s point at the same day. */
export function isSameJalaliDay(a: JalaliDate, b: JalaliDate): boolean {
  return a.jy === b.jy && a.jm === b.jm && a.jd === b.jd;
}

/** Compare two Jalali dates: negative when a < b, 0 when equal, positive when a > b. */
export function compareJalali(a: JalaliDate, b: JalaliDate): number {
  return (a.jy - b.jy) * 10_000 + (a.jm - b.jm) * 100 + (a.jd - b.jd);
}

/** Today's date as a `JalaliDate` (local timezone). */
export function jalaliToday(): JalaliDate {
  return toJalali(new Date());
}

/** Add (or subtract) whole months, clamping the day to the month's length. */
export function addJalaliMonths(j: JalaliDate, months: number): JalaliDate {
  const total = j.jy * 12 + (j.jm - 1) + months;
  const jy = Math.floor(total / 12);
  const jm = (((total % 12) + 12) % 12) + 1;
  const jd = Math.min(j.jd, jalaliMonthLength(jy, jm));
  return { jy, jm, jd };
}

/**
 * The JS weekday (0 = Sunday) of the FIRST day of a Jalali month — what the
 * grid builder needs to know how many leading blanks to draw.
 */
export function firstWeekdayOfMonth(jy: number, jm: number): number {
  return jalaliWeekday({ jy, jm, jd: 1 });
}

/**
 * Format a `JalaliDate` with familiar date-fns-style tokens, in Persian digits
 * unless `digits` says `"latin"`:
 *
 * | token | output |
 * |---|---|
 * | `YYYY` | full year — `۱۴۰۵` |
 * | `YY` | two-digit year — `۰۵` |
 * | `MMMM` | month name — `مرداد` |
 * | `MM` | two-digit month — `۰۵` |
 * | `M` | month — `۵` |
 * | `DD` | two-digit day — `۱۹` |
 * | `D` | day — `۱۹` |
 * | `dddd` | weekday name — `دوشنبه` |
 */
export function formatJalali(
  j: JalaliDate,
  pattern = "YYYY/MM/DD",
  digits: DigitStyle = "persian",
): string {
  const interfaceDigits = (input: string | number) => digitsIn(digits, input);
  const tokens: Record<string, string> = {
    YYYY: interfaceDigits(j.jy),
    YY: interfaceDigits(pad2(j.jy % 100)),
    MMMM: MONTH_NAMES_FA[j.jm] ?? "",
    MMM: MONTH_NAMES_FA[j.jm] ?? "",
    MM: interfaceDigits(pad2(j.jm)),
    M: interfaceDigits(j.jm),
    DD: interfaceDigits(pad2(j.jd)),
    D: interfaceDigits(j.jd),
    dddd: WEEKDAY_NAMES_FA[jalaliWeekday(j)],
  };

  return pattern.replaceAll(
    /YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd/g,
    (token) => tokens[token] ?? token,
  );
}

/** Human, long-form Persian date: `دوشنبه ۱۹ مرداد ۱۴۰۵`. */
export function formatJalaliLong(
  j: JalaliDate,
  digits: DigitStyle = "persian",
): string {
  return formatJalali(j, "dddd D MMMM YYYY", digits);
}

/**
 * Everything a field needs to turn any accepted value into a display string
 * and a native `Date` in one call.
 */
export function resolveDateLike(value: DateLike | null | undefined): {
  jalali: JalaliDate | null;
  date: Date | null;
} {
  const jalali = normalizeDateLike(value);
  return { jalali, date: jalali ? toGregorian(jalali) : null };
}

/** Re-exported for convenience so consumers only import from one place. */
export { isJalaliLeapYear, jalaliMonthLength };

/**
 * An API date as a table-cell display string.
 *
 * Endpoints mostly speak Gregorian (`format: date-time`), but some answer
 * with the Jalali spelling (`1405/05/05`) as-is, so the two shapes are
 * disambiguated the same way the pickers are: a `T` separator, or a year
 * the Jalali calendar never reaches, marks a Gregorian value; anything
 * else is read as Jalali.
 *
 * The result always wears the calendar's own spelling — zero-padded,
 * `YYYY/MM/DD`, in Persian digits unless `digits` says `"latin"`. `HH`, `mm` and `ss` add the local
 * clock time; a Jalali value carries none, so they are dropped for it.
 */
export function formatApiDate(
  value: Date | string | null | undefined,
  pattern = "YYYY/MM/DD",
  digits: DigitStyle = "persian",
): string | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : formatJalali(toJalali(value), withClock(pattern, value, digits), digits);
  }

  const str = String(value);
  const head = /^(\d{4})[-/]/.exec(str);
  const gregorian = /T/.test(str) || (head ? Number(head[1]) >= 1500 : false);

  if (!gregorian) {
    const jalali = normalizeDateLike(str);
    return jalali ? formatJalali(jalali, withClock(pattern, null, digits), digits) : str;
  }

  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return str;
  return formatJalali(toJalali(date), withClock(pattern, date, digits), digits);
}

/** Fills a pattern's `HH:mm:ss` from a moment, or drops it when there is none. */
function withClock(
  pattern: string,
  date: Date | null,
  digits: DigitStyle,
): string {
  if (!date) return pattern.replace(/\s*HH(:mm(:ss)?)?/, "");
  const clock: Record<string, number> = {
    HH: date.getHours(),
    mm: date.getMinutes(),
    ss: date.getSeconds(),
  };
  return pattern.replaceAll(/HH|mm|ss/g, (token) =>
    digitsIn(digits, pad2(clock[token])),
  );
}
