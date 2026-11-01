/**
 * Core value types for the Iranian (Jalali / Shamsi) calendar system.
 *
 * Everything calendar-related in this package speaks `JalaliDate` at its
 * edges and the native `Date` at the boundary — see `conversion.ts` for the
 * translation between the two.
 */

/** A date in the Iranian solar (Jalali/Shamsi) calendar. */
export interface JalaliDate {
  /** Full Jalali year, e.g. `1405`. */
  jy: number;
  /** Month, 1-based: `1` = فروردین … `12` = اسفند. */
  jm: number;
  /** Day of month, 1-based. */
  jd: number;
}

/**
 * Every date-taking prop in a calendar component accepts any of these
 * shapes, so call sites never have to convert first:
 *
 * - a native `Date` (Gregorian under the hood, as always in JS),
 * - a `JalaliDate` struct `{ jy, jm, jd }`,
 * - a Jalali string like `"1405-05-19"`, `"1405/05/19"` or `"1405/5/19"`.
 */
export type DateLike = Date | JalaliDate | string;

/** Type guard: is this `DateLike` already a `JalaliDate` struct? */
export function isJalaliDate(value: DateLike): value is JalaliDate {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Date) &&
    typeof (value as JalaliDate).jy === "number" &&
    typeof (value as JalaliDate).jm === "number" &&
    typeof (value as JalaliDate).jd === "number"
  );
}
