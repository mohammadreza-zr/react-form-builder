/**
 * Watch rules: the dependency language aimed at a surface instead of a field.
 *
 * What is pinned here is the *contract a caller relies on*: nothing is
 * published until the gate holds (so a half-typed coordinate pair never moves
 * a map), `0` counts as a value, and an explicit `when` replaces the default
 * gate rather than stacking onto it.
 */
import { describe, expect, it } from "vitest";

import type { FieldWatchRule } from "../src/core/types.js";
import {
  collectWatchFields,
  resolveWatchRule,
  toWatchSnapshot,
} from "../src/core/field-watch.js";

type Values = {
  latitude: string | number;
  longitude: string | number;
  kind: "point" | "area";
};

describe("collectWatchFields", () => {
  it("lists what the rule watches", () => {
    expect(
      collectWatchFields({
        watch: ["latitude", "longitude"],
      } as FieldWatchRule<Values>),
    ).toEqual(["latitude", "longitude"]);
  });

  it("adds the fields its conditions read", () => {
    const rule = {
      watch: ["latitude"],
      when: { field: "kind", op: "eq", value: "point" },
    } as FieldWatchRule<Values>;

    // `kind` is not published, but it decides whether anything is published, so
    // a change there has to wake the rule up.
    expect(collectWatchFields(rule)).toEqual(["latitude", "kind"]);
  });

  it("dedupes a field named in both places and keeps declaration order", () => {
    const rule = {
      watch: ["kind", "latitude"],
      when: [{ field: "latitude", op: "filled" }],
    } as FieldWatchRule<Values>;

    expect(collectWatchFields(rule)).toEqual(["kind", "latitude"]);
  });

  it("is empty for a rule that reads nothing", () => {
    expect(collectWatchFields({} as FieldWatchRule<Values>)).toEqual([]);
  });
});

describe("toWatchSnapshot", () => {
  it("pairs the names with useWatch's positional array", () => {
    expect(
      toWatchSnapshot<Values>(["latitude", "longitude"], ["37.4", 46.2]),
    ).toEqual({
      latitude: "37.4",
      longitude: 46.2,
    });
  });

  it("leaves a field absent when the subscription has no values yet", () => {
    expect(
      toWatchSnapshot<Values>(["latitude", "longitude"], undefined),
    ).toEqual({
      latitude: undefined,
      longitude: undefined,
    });
  });
});

describe("resolveWatchRule", () => {
  it("publishes nothing until every watched field holds a value", () => {
    const rule = { watch: ["latitude", "longitude"] } as FieldWatchRule<Values>;

    expect(
      resolveWatchRule<Values>({ latitude: "37.4", longitude: "" }, rule),
    ).toBeNull();
    expect(
      resolveWatchRule<Values>({ latitude: "37.4", longitude: 46.2 }, rule),
    ).toEqual({ latitude: "37.4", longitude: 46.2 });
  });

  it("counts zero as a coordinate, which is why the gate is not truthiness", () => {
    const rule = { watch: ["latitude", "longitude"] } as FieldWatchRule<Values>;

    expect(
      resolveWatchRule<Values>({ latitude: 0, longitude: 0 }, rule),
    ).not.toBeNull();
  });

  it("waits for a value to parse, not just to be typed", () => {
    const rule = { watch: ["latitude", "longitude"] } as FieldWatchRule<Values>;

    expect(
      resolveWatchRule<Values>({ latitude: "soon", longitude: 46.2 }, rule),
    ).not.toBeNull();
    // The rule asks "is there a value", which is the form's business; whether
    // that value is a *number* is what the surface's `select` decides, so a
    // preview can still refuse it.
    const numeric = {
      watch: ["latitude", "longitude"],
      select: ({ latitude, longitude }) =>
        [Number(latitude), Number(longitude)].every(Number.isFinite),
    } as FieldWatchRule<Values, boolean>;

    expect(
      resolveWatchRule({ latitude: "soon", longitude: 46.2 }, numeric),
    ).toBe(false);
    expect(resolveWatchRule({ latitude: "37", longitude: 46.2 }, numeric)).toBe(
      true,
    );
  });

  it("lets `when` say what the rule waits for instead", () => {
    const rule = {
      watch: ["latitude"],
      when: { field: "kind", op: "eq", value: "area" },
    } as FieldWatchRule<Values>;

    // A half-filled pair publishes, because this rule never asked for `filled`.
    expect(
      resolveWatchRule<Values>({ latitude: "", kind: "area" }, rule),
    ).toEqual({ latitude: "", kind: "area" });
    expect(
      resolveWatchRule<Values>({ latitude: "37.4", kind: "point" }, rule),
    ).toBeNull();
  });

  it("ands an explicit list of conditions", () => {
    const rule = {
      when: [
        { field: "latitude", op: "filled" },
        { field: "longitude", op: "filled" },
        { field: "kind", op: "eq", value: "point" },
      ],
    } as FieldWatchRule<Values>;

    expect(
      resolveWatchRule<Values>(
        { latitude: 1, longitude: 2, kind: "point" },
        rule,
      ),
    ).not.toBeNull();
    expect(
      resolveWatchRule<Values>(
        { latitude: 1, longitude: 2, kind: "area" },
        rule,
      ),
    ).toBeNull();
  });

  it("publishes the derived value, and only once the gate holds", () => {
    const rule = {
      watch: ["latitude", "longitude"],
      select: ({ latitude, longitude }) =>
        `${latitude ?? "—"} / ${longitude ?? "—"}`,
    } as FieldWatchRule<Values, string>;

    expect(
      resolveWatchRule<Values, string>(
        { latitude: "37.4", longitude: "" },
        rule,
      ),
    ).toBeNull();
    expect(
      resolveWatchRule<Values, string>(
        { latitude: "37.4", longitude: "46.2" },
        rule,
      ),
    ).toBe("37.4 / 46.2");
  });

  it("publishes an empty snapshot for a rule that reads nothing", () => {
    expect(resolveWatchRule<Values>({}, {} as FieldWatchRule<Values>)).toEqual(
      {},
    );
  });
});
