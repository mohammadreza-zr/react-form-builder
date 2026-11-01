import { toGregorian, toJalali } from "./conversion.js";
import { normalizeDateLike } from "./format.js";
import type { JalaliDate } from "./types.js";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * A field holds a Jalali day as text — `YYYY/MM/DD`, Latin digits — because
 * that is what an endpoint is sent and what `normalizeDateLike` reads back,
 * whichever digits were typed.
 */
export function toJalaliString({ jy, jm, jd }: JalaliDate) {
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/** A month field's text — `YY/MM`, as a pass validity is written. */
export function toJalaliMonthString({ jy, jm }: JalaliDate) {
  return `${pad(jy % 100)}/${pad(jm)}`;
}

/** `YY/MM` back to the day text of that month's first day, in the 1400s. */
export function fromJalaliMonthString(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  return match ? `14${match[1]}/${match[2]}/01` : null;
}

/** A Jalali moment as the `YYYY/MM/DD HH:mm` text a date-time field holds. */
export function toJalaliDateTimeString(value: {
  jalali: JalaliDate;
  time: string;
}) {
  return `${toJalaliString(value.jalali)} ${value.time}`;
}

/** A day split into parts, as an endpoint that takes it that way reads it. */
export type JalaliParts = {
  year?: number | null;
  month?: number | null;
  day?: number | null;
};

/** A Jalali day as an endpoint that splits it takes it — `{ year, month, day }`. */
export function toJalaliParts({ jy, jm, jd }: JalaliDate): Required<JalaliParts> {
  return { year: jy, month: jm, day: jd };
}

/** The day text of a split day, or `null` while a part of it is missing. */
export function fromJalaliParts(
  value: JalaliParts & Record<string, unknown>,
): string | null {
  const { year, month, day } = value;
  return year == null || month == null || day == null
    ? null
    : toJalaliString({ jy: year, jm: month, jd: day });
}

/**
 * A day as an endpoint's `date-time` — that day's midnight, from its local
 * components: a UTC conversion of the local midnight would land on the day
 * before in eastern time zones.
 */
export function toDateTime(jalali: JalaliDate): string {
  const day = toGregorian(jalali);
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T00:00:00Z`;
}

/** The day text of an endpoint's `date-time`, or `null` when it is not one. */
export function fromDateTime(value: string): string | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!day) return null;
  return toJalaliString(
    toJalali(new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))),
  );
}

/* ---------------------------------- */
/* What a `date` field holds          */
/* ---------------------------------- */

/**
 * How a `date` field holds its day: the `YYYY/MM/DD` text, the split
 * `{ year, month, day }`, or that day's midnight as an ISO `date-time`.
 */
export type DayValueFormat = "text" | "parts" | "date-time";

/** `month` holds a year and month as `YY/MM`; only the `text` format has it. */
export type DayPicker = "day" | "month";

/**
 * The day text (`YYYY/MM/DD`) a field's value stands for, or `null` while it
 * stands for none. A picker reads this whatever the format.
 */
export function readDayValue(
  value: unknown,
  format: DayValueFormat = "text",
  picker: DayPicker = "day",
): string | null {
  if (!value) return null;
  if (format === "parts") return fromJalaliParts(value as JalaliParts);
  if (format === "date-time") return fromDateTime(String(value));
  return picker === "month"
    ? fromJalaliMonthString(String(value))
    : String(value);
}

/**
 * What a field holds once a day is picked. A cleared field holds `""` for the
 * text format and `null` for the other two.
 */
export function writeDayValue(
  day: JalaliDate | null,
  format: DayValueFormat = "text",
  picker: DayPicker = "day",
): unknown {
  if (format === "parts") return day && toJalaliParts(day);
  if (format === "date-time") return day && toDateTime(day);
  if (!day) return "";
  return picker === "month" ? toJalaliMonthString(day) : toJalaliString(day);
}

/* ---------------------------------- */
/* The browser's date inputs          */
/* ---------------------------------- */

/** A Jalali day as an `<input type="date">` holds it — `yyyy-mm-dd`, Gregorian. */
export function toNativeDay(text: string | null | undefined): string {
  const jalali = normalizeDateLike(text);
  if (!jalali) return "";
  const day = toGregorian(jalali);
  return `${String(day.getFullYear()).padStart(4, "0")}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The Jalali day of an `<input type="date">` value, `null` while it is blank. */
export function fromNativeDay(value: string): JalaliDate | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!day) return null;
  return toJalali(new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])));
}

/** `YYYY/MM/DD HH:mm` as an `<input type="datetime-local">` holds it. */
export function toNativeDateTime(text: string | null | undefined): string {
  const [day, time = "00:00"] = (text ?? "").trim().split(/\s+/);
  const native = toNativeDay(day);
  return native ? `${native}T${time}` : "";
}

/** The `YYYY/MM/DD HH:mm` text of an `<input type="datetime-local">` value, `""` while blank. */
export function fromNativeDateTime(value: string): string {
  const [day = "", time = "00:00"] = value.split("T");
  const jalali = fromNativeDay(day);
  return jalali ? toJalaliDateTimeString({ jalali, time: time.slice(0, 5) }) : "";
}
