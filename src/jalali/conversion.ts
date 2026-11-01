/**
 * Jalali (Iranian solar) ⇄ Gregorian conversion.
 *
 * A dependency-free TypeScript port of the widely battle-tested
 * `jalaali-js` algorithm (the same one `moment-jalaali` and `jalaali-react`
 * use), which is accurate for Jalali years -61…3177 (~1800…2100 Gregorian). It has no
 * runtime dependency.
 */
import type { JalaliDate } from "./types.js";

/** Integer division truncated toward zero (matches the reference algorithm). */
function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

/** Modulo that stays positive for the ranges we use (matches the reference). */
function mod(a: number, b: number): number {
  return a - div(a, b) * b;
}

/**
 * Jalali year breakpoints of the 2820-year cycle. The reference algorithm
 * never changes these — do not edit.
 */
const BREAKS: readonly number[] = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

interface JalCalResult {
  /** Number of days from the start of the year to the next leap boundary. */
  leap: number;
  /** Gregorian year in which the Jalali year starts. */
  gy: number;
  /** Gregorian March day on which the Jalali year starts (1-based). */
  march: number;
}

function jalCal(jy: number): JalCalResult {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

/** Jalali date → Julian Day Number. */
export function jalaliToJdn(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    gregorianToJdn(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1
  );
}

/** Julian Day Number → Jalali date. */
export function jdnToJalali(jdn: number): JalaliDate {
  const gy = jdnToGregorian(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = gregorianToJdn(gy, 3, r.march);

  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** Gregorian date → Julian Day Number. */
export function gregorianToJdn(gy: number, gm: number, gd: number): number {
  return (
    div((gy + div(gm - 8, 6) + 100_100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34_840_408 -
    div(div(gy + 100_100 + div(gm - 8, 6), 100) * 3, 4) +
    752
  );
}

/** Julian Day Number → Gregorian date. */
export function jdnToGregorian(jdn: number): {
  gy: number;
  gm: number;
  gd: number;
} {
  let j = 4 * jdn + 139_361_631;
  j = j + div(div(4 * jdn + 183_187_720, 146_097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100_100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** Convert a Gregorian `Date` (local time) to a `JalaliDate`. */
export function toJalali(date: Date): JalaliDate {
  return jdnToJalali(
    gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate()),
  );
}

/** Convert a `JalaliDate` to a local-time Gregorian `Date` (midnight). */
export function toGregorian(jalali: JalaliDate): Date {
  const { gy, gm, gd } = jdnToGregorian(
    jalaliToJdn(jalali.jy, jalali.jm, jalali.jd),
  );
  return new Date(gy, gm - 1, gd);
}

/** True when the Jalali year is a leap year (اسفند has 30 days). */
export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** Number of days in a Jalali month: 31, 30 or 29/30 for اسفند. */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * Weekday of a Jalali date as the JS `Date.getDay()` convention
 * (0 = Sunday … 6 = Saturday).
 */
export function jalaliWeekday(jalali: JalaliDate): number {
  const { gy, gm, gd } = jdnToGregorian(
    jalaliToJdn(jalali.jy, jalali.jm, jalali.jd),
  );
  return new Date(gy, gm - 1, gd).getDay();
}

/** Add (or subtract) days, crossing month/year boundaries as needed. */
export function addJalaliDays(jalali: JalaliDate, days: number): JalaliDate {
  return jdnToJalali(jalaliToJdn(jalali.jy, jalali.jm, jalali.jd) + days);
}

/** Validate a Jalali date struct against the real calendar rules. */
export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  return (
    Number.isInteger(jy) &&
    Number.isInteger(jm) &&
    Number.isInteger(jd) &&
    jy >= -61 &&
    jy <= 3177 &&
    jm >= 1 &&
    jm <= 12 &&
    jd >= 1 &&
    jd <= jalaliMonthLength(jy, jm)
  );
}
