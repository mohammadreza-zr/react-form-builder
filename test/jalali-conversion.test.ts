import { describe, expect, it } from "vitest";

import {
  addJalaliDays,
  addJalaliMonths,
  compareJalali,
  firstWeekdayOfMonth,
  formatJalali,
  formatJalaliLong,
  isJalaliLeapYear,
  isValidJalaliDate,
  jalaliMonthLength,
  jalaliToday,
  normalizeDateLike,
  toGregorian,
  toJalali,
  toPersianDigits,
} from "../src/jalali/index.js";

describe("conversion", () => {
  it("knows the first day of the year", () => {
    expect(toJalali(new Date(2026, 2, 21))).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(toGregorian({ jy: 1405, jm: 1, jd: 1 })).toEqual(new Date(2026, 2, 21));
  });

  it("converts a day in the middle of the year, both ways", () => {
    expect(toJalali(new Date(2026, 7, 12))).toEqual({ jy: 1405, jm: 5, jd: 21 });
    expect(toGregorian({ jy: 1405, jm: 5, jd: 21 })).toEqual(new Date(2026, 7, 12));
  });

  it("round-trips every day of a decade", () => {
    for (let day = new Date(2020, 0, 1); day < new Date(2030, 0, 1); day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
      expect(toGregorian(toJalali(day))).toEqual(day);
    }
  });

  it("gives a leap year an 30-day Esfand", () => {
    expect(isJalaliLeapYear(1403)).toBe(true);
    expect(isJalaliLeapYear(1404)).toBe(false);
    expect(jalaliMonthLength(1403, 12)).toBe(30);
    expect(jalaliMonthLength(1404, 12)).toBe(29);
    expect(jalaliMonthLength(1404, 1)).toBe(31);
    expect(jalaliMonthLength(1404, 7)).toBe(30);
  });

  it("validates a date against the real calendar", () => {
    expect(isValidJalaliDate(1403, 12, 30)).toBe(true);
    expect(isValidJalaliDate(1404, 12, 30)).toBe(false);
    expect(isValidJalaliDate(1404, 13, 1)).toBe(false);
    expect(isValidJalaliDate(1404, 1, 0)).toBe(false);
  });

  it("adds days and months across boundaries", () => {
    expect(addJalaliDays({ jy: 1404, jm: 12, jd: 29 }, 1)).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(addJalaliMonths({ jy: 1404, jm: 6, jd: 31 }, 1)).toEqual({ jy: 1404, jm: 7, jd: 30 });
    expect(addJalaliMonths({ jy: 1404, jm: 1, jd: 15 }, -1)).toEqual({ jy: 1403, jm: 12, jd: 15 });
  });

  it("knows the weekday a month starts on", () => {
    // 1405/01/01 is Saturday 2026-03-21.
    expect(firstWeekdayOfMonth(1405, 1)).toBe(6);
  });

  it("compares days", () => {
    expect(compareJalali({ jy: 1405, jm: 1, jd: 1 }, { jy: 1405, jm: 1, jd: 2 })).toBeLessThan(0);
    expect(compareJalali({ jy: 1405, jm: 2, jd: 1 }, { jy: 1405, jm: 1, jd: 31 })).toBeGreaterThan(0);
  });

  it("takes today from the local date", () => {
    expect(toGregorian(jalaliToday()).toDateString()).toBe(new Date().toDateString());
  });
});

describe("reading and writing a day", () => {
  it("reads text in any digits and separator, and nothing for an impossible day", () => {
    expect(normalizeDateLike("۱۴۰۵/۵/۲۱")).toEqual({ jy: 1405, jm: 5, jd: 21 });
    expect(normalizeDateLike("1405-05-21")).toEqual({ jy: 1405, jm: 5, jd: 21 });
    expect(normalizeDateLike("1404/12/30")).toBeNull();
    expect(normalizeDateLike("nonsense")).toBeNull();
    expect(normalizeDateLike("")).toBeNull();
    expect(normalizeDateLike(new Date(2026, 7, 12))).toEqual({ jy: 1405, jm: 5, jd: 21 });
  });

  it("formats in Persian digits, or Latin on request", () => {
    const day = { jy: 1405, jm: 5, jd: 21 };
    expect(formatJalali(day)).toBe("۱۴۰۵/۰۵/۲۱");
    expect(formatJalali(day, "YYYY/MM/DD", "latin")).toBe("1405/05/21");
    expect(formatJalaliLong(day)).toBe("چهارشنبه ۲۱ مرداد ۱۴۰۵");
    expect(toPersianDigits("12:30")).toBe("۱۲:۳۰");
  });
});
