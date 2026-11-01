import { describe, expect, it } from "vitest";

import {
  fromNativeDateTime,
  fromNativeDay,
  readDayValue,
  toNativeDateTime,
  toNativeDay,
  writeDayValue,
} from "../src/jalali/index.js";

const day = { jy: 1405, jm: 5, jd: 21 };

describe("a date field's value", () => {
  it("holds the text by default, and \"\" once cleared", () => {
    expect(writeDayValue(day)).toBe("1405/05/21");
    expect(writeDayValue(null)).toBe("");
    expect(readDayValue("1405/05/21")).toBe("1405/05/21");
    expect(readDayValue("")).toBeNull();
  });

  it("holds the split day, and null once cleared", () => {
    expect(writeDayValue(day, "parts")).toEqual({ year: 1405, month: 5, day: 21 });
    expect(writeDayValue(null, "parts")).toBeNull();
    expect(readDayValue({ year: 1405, month: 5, day: 21 }, "parts")).toBe("1405/05/21");
    expect(readDayValue({ year: 1405 }, "parts")).toBeNull();
  });

  it("holds the day's midnight as a date-time, and null once cleared", () => {
    expect(writeDayValue(day, "date-time")).toBe("2026-08-12T00:00:00Z");
    expect(writeDayValue(null, "date-time")).toBeNull();
    expect(readDayValue("2026-08-12T00:00:00Z", "date-time")).toBe("1405/05/21");
  });

  it("holds a month as YY/MM", () => {
    expect(writeDayValue(day, "text", "month")).toBe("05/05");
    expect(readDayValue("05/05", "text", "month")).toBe("1405/05/01");
  });
});

describe("the browser's date inputs", () => {
  it("shows a Jalali day as the Gregorian day the input speaks", () => {
    expect(toNativeDay("1405/05/21")).toBe("2026-08-12");
    expect(toNativeDay("")).toBe("");
    expect(toNativeDay("nonsense")).toBe("");
    expect(fromNativeDay("2026-08-12")).toEqual(day);
    expect(fromNativeDay("")).toBeNull();
  });

  it("does the same for a day with a time", () => {
    expect(toNativeDateTime("1405/05/21 09:30")).toBe("2026-08-12T09:30");
    expect(toNativeDateTime("1405/05/21")).toBe("2026-08-12T00:00");
    expect(toNativeDateTime("")).toBe("");
    expect(fromNativeDateTime("2026-08-12T09:30")).toBe("1405/05/21 09:30");
    expect(fromNativeDateTime("")).toBe("");
  });
});
