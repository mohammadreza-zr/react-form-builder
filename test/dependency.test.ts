/**
 * The condition language shared by field `dependencies` and by watch rules.
 *
 * Two behaviours are load-bearing beyond their own correctness: `filled`
 * keeping `0` and `false` as values (a longitude of 0 is the Gulf of Guinea,
 * not an empty box), and `when` accepting a list — a rule like «both
 * coordinates are filled» has no other way to say it.
 */
import { describe, expect, it } from "vitest";

import type { Condition } from "../src/core/types.js";
import {
  asConditionList,
  evaluateCondition,
  evaluateConditions,
  getValueByPath,
  isFilled,
  resolveFieldState,
} from "../src/core/dependency.js";
import { collectDependencyFields } from "../src/core/dependency-fields.js";

describe("isFilled", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
    ["a whitespace-only string", "   "],
    ["NaN", Number.NaN],
    ["an empty array", []],
  ])("treats %s as empty", (_label, value) => {
    expect(isFilled(value)).toBe(false);
  });

  it.each([
    ["zero", 0],
    ["false", false],
    ['the string "0"', "0"],
    ["a number", 46.2],
    ["a filled array", [1]],
    ["an object", { id: 3 }],
  ])("treats %s as a value", (_label, value) => {
    expect(isFilled(value)).toBe(true);
  });

  it("differs from truthy exactly where a coordinate or a checkbox is involved", () => {
    expect(isFilled(0)).toBe(true);
    expect(!!0).toBe(false);
    expect(isFilled(false)).toBe(true);
    expect(!!false).toBe(false);
  });
});

describe("evaluateCondition", () => {
  const values = { latitude: 37.4, longitude: 0, city: "", kind: "point" };

  it("reads filled through the field named by the condition", () => {
    expect(
      evaluateCondition(values, {
        field: "latitude",
        op: "filled",
      } as Condition),
    ).toBe(true);
    // 0 is a longitude, not a blank: `truthy` would have hidden the marker.
    expect(
      evaluateCondition(values, { field: "longitude", op: "filled" }),
    ).toBe(true);
    expect(evaluateCondition(values, { field: "city", op: "filled" })).toBe(
      false,
    );
  });

  it("reads empty as the negation", () => {
    expect(evaluateCondition(values, { field: "city", op: "empty" })).toBe(
      true,
    );
    expect(evaluateCondition(values, { field: "latitude", op: "empty" })).toBe(
      false,
    );
  });

  it("keeps the comparison operators working", () => {
    expect(
      evaluateCondition(values, { field: "kind", op: "eq", value: "point" }),
    ).toBe(true);
    expect(
      evaluateCondition(values, {
        field: "kind",
        op: "in",
        value: ["point", "line"],
      }),
    ).toBe(true);
    expect(
      evaluateCondition(values, { field: "latitude", op: "gt", value: 30 }),
    ).toBe(true);
  });
});

describe("evaluateConditions", () => {
  it("treats one condition and a one-element list alike", () => {
    const condition: Condition = { field: "a", op: "filled" };
    const values = { a: 1 };

    expect(evaluateConditions(values, condition)).toBe(true);
    expect(evaluateConditions(values, [condition])).toBe(true);
  });

  it("ands the list", () => {
    const values = { a: 1, b: "" };

    expect(
      evaluateConditions(values, [
        { field: "a", op: "filled" },
        { field: "b", op: "filled" },
      ]),
    ).toBe(false);

    expect(
      evaluateConditions({ a: 1, b: 2 }, [
        { field: "a", op: "filled" },
        { field: "b", op: "filled" },
      ]),
    ).toBe(true);
  });

  it("holds when there is nothing to hold", () => {
    expect(evaluateConditions({}, undefined)).toBe(true);
    expect(evaluateConditions({}, [])).toBe(true);
  });
});

describe("asConditionList", () => {
  it("normalises either spelling", () => {
    const condition: Condition = { field: "a", op: "filled" };

    expect(asConditionList(condition)).toEqual([condition]);
    expect(asConditionList([condition])).toEqual([condition]);
    expect(asConditionList(undefined)).toEqual([]);
  });
});

describe("getValueByPath", () => {
  it("finds a snapshot keyed by the whole path", () => {
    // Dependency and watch snapshots are flat: `"items.0.title"` is one key, so
    // a walk that starts by looking for `items` would read `undefined` and make
    // every dependency on an array field silently false.
    const snapshot = { "items.0.title": "gate" };

    expect(getValueByPath(snapshot, "items.0.title")).toBe("gate");
  });

  it("still walks a real object graph", () => {
    expect(getValueByPath({ user: { name: "ali" } }, "user.name")).toBe("ali");
    expect(getValueByPath({ items: [{ title: "a" }] }, "items.0.title")).toBe(
      "a",
    );
  });
});

describe("collectDependencyFields", () => {
  it("subscribes to every field an AND reads", () => {
    const fields = [
      {
        name: "note",
        type: "text",
        dependencies: [
          {
            kind: "visible",
            when: [
              { field: "province", op: "filled" },
              { field: "city", op: "filled" },
            ],
          },
        ],
      },
    ] as never;

    expect(collectDependencyFields(fields)).toEqual(["province", "city"]);
  });

  it("subscribes to what a watch write reads, and to what it writes", () => {
    const fields = [
      {
        name: "slug",
        type: "text",
        dependencies: [
          {
            kind: "watch",
            when: { field: "title", op: "filled" },
            reads: ["kind"],
            then: { set: () => "x" },
          },
        ],
      },
    ] as never;

    // `title` and `kind` because the rule looks at them, `slug` because the
    // write is skipped when the target already holds the value — which can only
    // be decided from a snapshot that includes it.
    expect(collectDependencyFields(fields)).toEqual(["title", "kind", "slug"]);
  });

  it("returns null when nothing depends on anything", () => {
    const fields = [{ name: "note", type: "text" }] as never;

    expect(collectDependencyFields(fields)).toBeNull();
  });
});

describe("a `disabled` dependency", () => {
  const field = {
    name: "history",
    type: "switch" as const,
    dependencies: [
      {
        kind: "disabled" as const,
        when: { field: "pick", op: "empty" as const },
      },
    ],
  };

  it("disables the field while its condition holds and leaves it shown", () => {
    const state = resolveFieldState(field as never, { pick: "" } as never);
    expect(state.disabled).toBe(true);
    expect(state.visible).toBe(true);
  });

  it("enables it once the condition stops holding", () => {
    expect(
      resolveFieldState(field as never, { pick: "a" } as never).disabled,
    ).toBe(false);
  });

  it("subscribes to the field it reads", () => {
    expect(collectDependencyFields([field as never])).toEqual(["pick"]);
  });
});

describe("numeric operators", () => {
  it.each([
    ["an empty string", ""],
    ["null", null],
    ["undefined", undefined],
    ["text that is not a number", "abc"],
    ["a boolean", false],
  ])("hold for none of them on %s", (_, value) => {
    for (const op of ["gt", "gte", "lt", "lte"] as const) {
      expect(evaluateCondition({ n: value }, { field: "n", op, value: 5 })).toBe(false);
    }
  });

  it("compare numbers and numeric text", () => {
    expect(evaluateCondition({ n: "3" }, { field: "n", op: "lt", value: 5 })).toBe(true);
    expect(evaluateCondition({ n: 0 }, { field: "n", op: "lte", value: 0 })).toBe(true);
    expect(evaluateCondition({ n: 7 }, { field: "n", op: "gt", value: "5" })).toBe(true);
  });
});

describe("getValueByPath and the prototype", () => {
  it("reads own keys only", () => {
    expect(getValueByPath({}, "constructor")).toBeUndefined();
    expect(getValueByPath({ user: {} }, "user.toString")).toBeUndefined();
    expect(getValueByPath({ constructor: "x" }, "constructor")).toBe("x");
  });
});
