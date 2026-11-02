import { describe, expect, it } from "vitest";

import {
  fromDateTime,
  fromJalaliMonthString,
  fromJalaliParts,
  readDayValue,
  toDateTime,
  toJalaliMonthString,
  toJalaliParts,
  toJalaliString,
  writeDayValue,
} from "../src/jalali/index.js";

describe("jalali field values", () => {
  it("writes a day as YYYY/MM/DD", () => {
    expect(toJalaliString({ jy: 1405, jm: 3, jd: 1 })).toBe("1405/03/01");
  });

  it("writes a month as YYYY/MM, ignoring the day", () => {
    expect(toJalaliMonthString({ jy: 1407, jm: 11, jd: 23 })).toBe("1407/11");
    expect(toJalaliMonthString({ jy: 1400, jm: 1, jd: 1 })).toBe("1400/01");
  });

  it("reads YYYY/MM back as that month's first day", () => {
    expect(fromJalaliMonthString("1407/11")).toBe("1407/11/01");
    expect(fromJalaliMonthString("1407-3")).toBe("1407/03/01");
  });

  it("round-trips a month", () => {
    const month = { jy: 1409, jm: 4, jd: 1 };
    expect(fromJalaliMonthString(toJalaliMonthString(month))).toBe(
      toJalaliString(month),
    );
  });

  it("rejects anything but a year and a month", () => {
    for (const value of ["", "07/11", "1407/13", "1407/00", "1407/11/01"]) {
      expect(fromJalaliMonthString(value)).toBeNull();
    }
  });

  it("reads and writes through a codec of the project's", () => {
    const codec = {
      read: (value: unknown) => (typeof value === "string" ? `14${value}/01` : null),
      write: (day: { jy: number; jm: number } | null) => (day ? `${day.jy % 100}/${String(day.jm).padStart(2, "0")}` : ""),
    };
    expect(readDayValue("05/03", codec)).toBe("1405/03/01");
    expect(writeDayValue({ jy: 1405, jm: 3, jd: 9 }, codec)).toBe("5/03");
  });

  it("writes a split day as the endpoint's year, month and day", () => {
    expect(toJalaliParts({ jy: 1405, jm: 6, jd: 31 })).toEqual({
      year: 1405,
      month: 6,
      day: 31,
    });
  });

  it("reads a split day back as the picker's text, extra fields aside", () => {
    expect(
      fromJalaliParts({ year: 1405, month: 6, monthName: "شهریور", day: 3 }),
    ).toBe("1405/06/03");
  });

  it("has no text for a split day missing a part", () => {
    expect(fromJalaliParts({ year: 1405, month: 6 })).toBeNull();
    expect(fromJalaliParts({})).toBeNull();
  });

  it("writes a day as its midnight date-time and reads it back", () => {
    const day = { jy: 1405, jm: 1, jd: 1 };
    expect(toDateTime(day)).toBe("2026-03-21T00:00:00Z");
    expect(fromDateTime("2026-03-21T00:00:00Z")).toBe("1405/01/01");
    expect(fromDateTime(toDateTime(day))).toBe(toJalaliString(day));
  });

  it("reads no day out of text that is not a date-time", () => {
    expect(fromDateTime("1405/01/01")).toBeNull();
  });
});
