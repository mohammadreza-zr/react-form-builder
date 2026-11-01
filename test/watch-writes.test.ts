/**
 * The `watch` dependency kind: a rule that writes into an input.
 *
 * Everything here guards the one property that makes a write safe to run from a
 * resolver — it settles. A write notifies the watchers, the resolver runs again,
 * and the second pass has to produce nothing.
 */
import { describe, expect, it } from "vitest";

import { resolveFieldState } from "../src/core/dependency.js";
import { isStructurallyEqual } from "../src/core/watch-writes.js";

function watchField(dependencies: unknown[]) {
  return {
    name: "slug",
    type: "text",
    label: " Slug",
    dependencies,
  } as never;
}

describe("isStructurallyEqual", () => {
  it("compares plain data by shape", () => {
    expect(isStructurallyEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toBe(
      true,
    );
    expect(isStructurallyEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(isStructurallyEqual([1, 2], [1, 2])).toBe(true);
    expect(isStructurallyEqual([1, 2], [2, 1])).toBe(false);
  });

  it("treats NaN as equal to itself, where === would not", () => {
    expect(isStructurallyEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it("falls back to identity for values it cannot open", () => {
    const date = new Date(0);

    expect(isStructurallyEqual(date, date)).toBe(true);
    // Two dates an hour apart are not "the same value" — which is exactly why
    // `WatchPatch.set` is documented to return plain data instead.
    expect(isStructurallyEqual(date, new Date(3_600_000))).toBe(false);
  });
});

describe("resolveFieldState — watch kind", () => {
  it("asks for the write when its condition holds", () => {
    const state = resolveFieldState(
      watchField([
        {
          kind: "watch",
          when: { field: "title", op: "filled" },
          then: { set: "hello-world" },
        },
      ]),
      { title: "hello world", slug: "" },
    );

    expect(state.writes).toEqual([
      { name: "slug", value: "hello-world", options: undefined },
    ]);
  });

  it("says nothing when the target already holds that value", () => {
    const state = resolveFieldState(
      watchField([
        {
          kind: "watch",
          when: { field: "title", op: "filled" },
          then: { set: "hello-world" },
        },
      ]),
      { title: "hello world", slug: "hello-world" },
    );

    // This is the settle. Without it the write feeds the resolver that feeds the
    // write.
    expect(state.writes).toBeUndefined();
  });

  it("derives the value from the watched snapshot", () => {
    const state = resolveFieldState(
      watchField([
        {
          kind: "watch",
          when: { field: "title", op: "filled" },
          then: {
            // The test input bypasses `FormFieldConfig`, so this parameter has no
            // contextual type to borrow.
            from: ({ title }: { title?: unknown }) =>
              String(title).trim().toLowerCase().replace(/\s+/g, "-"),
          },
        },
      ]),
      { title: "  Main Station ", slug: "" },
    );

    expect(state.writes?.[0]?.value).toBe("main-station");
  });

  it("keeps out of the user's way with `onlyIfEmpty`", () => {
    const dependencies = [
      {
        kind: "watch",
        when: { field: "title", op: "filled" },
        then: { set: "auto", onlyIfEmpty: true },
      },
    ];

    expect(
      resolveFieldState(watchField(dependencies), {
        title: "x",
        slug: "",
      }).writes,
    ).toHaveLength(1);

    // The field now holds something the user typed, so the rule stops.
    expect(
      resolveFieldState(watchField(dependencies), {
        title: "x",
        slug: "mine",
      }).writes,
    ).toBeUndefined();
  });

  it("writes another field when `to` names one", () => {
    // The classic cascade: the city goes back to empty when the province it
    // belonged to is cleared. `slug` merely declares the rule; `city` is the
    // field it edits.
    const state = resolveFieldState(
      watchField([
        {
          kind: "watch",
          when: { field: "province", op: "empty" },
          then: { set: "", to: "city" },
        },
      ]),
      { province: "", city: { id: 3, name: "Tabriz" }, slug: "" },
    );

    expect(state.writes).toEqual([
      { name: "city", value: "", options: undefined },
    ]);
  });

  it("does not fire while its condition is unmet", () => {
    const state = resolveFieldState(
      watchField([
        {
          kind: "watch",
          when: [
            { field: "title", op: "filled" },
            { field: "city", op: "filled" },
          ],
          then: { set: "both" },
        },
      ]),
      { title: "x", slug: "" },
    );

    expect(state.writes).toBeUndefined();
  });
});
