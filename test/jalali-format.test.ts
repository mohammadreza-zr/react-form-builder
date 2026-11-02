import { describe, expect, it } from "vitest";

import { formatApiDate, toLatinDigits } from "../src/jalali/index.js";

describe("toLatinDigits", () => {
  it("maps the Persian keypad onto ASCII", () => {
    expect(toLatinDigits("۴۸.۱۲")).toBe("48.12");
  });

  it("maps the Arabic-Indic digits too", () => {
    expect(toLatinDigits("٤٨.١٢")).toBe("48.12");
  });

  it("leaves everything else alone, including the decimal separator", () => {
    expect(toLatinDigits("-48.12e2")).toBe("-48.12e2");
  });
});

describe("formatApiDate", () => {
  const moment = new Date(2026, 9, 18, 9, 5, 7);

  it("fills the clock tokens from the moment", () => {
    expect(formatApiDate(moment, "YYYY/MM/DD HH:mm:ss")).toBe(
      "۱۴۰۵/۰۷/۲۶ ۰۹:۰۵:۰۷",
    );
    expect(formatApiDate(moment.toISOString(), "YYYY/MM/DD HH:mm")).toBe(
      "۱۴۰۵/۰۷/۲۶ ۰۹:۰۵",
    );
  });

  it("drops the clock from a Jalali value, which carries none", () => {
    expect(formatApiDate("1405/07/26", "YYYY/MM/DD HH:mm")).toBe("۱۴۰۵/۰۷/۲۶");
  });

  it("reads a bare day as that calendar day in any time zone", () => {
    const zone = process.env.TZ;
    try {
      for (const tz of ["America/New_York", "Asia/Tehran", "Pacific/Auckland"]) {
        process.env.TZ = tz;
        expect(formatApiDate("2026-11-02", "YYYY/MM/DD", "latin")).toBe("1405/08/11");
      }
    } finally {
      if (zone === undefined) delete process.env.TZ;
      else process.env.TZ = zone;
    }
  });
});
