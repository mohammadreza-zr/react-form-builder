import { describe, expect, it } from "vitest";

import { collectHiddenNames } from "../src/core/hidden-fields.js";

const text = (name: string, extra: object = {}) =>
  ({ name, type: "text", label: name, ...extra }) as never;

describe("collectHiddenNames", () => {
  it("names the hidden fields and leaves the visible ones", () => {
    expect(
      collectHiddenNames([
        { field: text("title"), visible: true },
        { field: text("validity"), visible: false },
      ]),
    ).toEqual(["validity"]);
  });

  it("takes the fields nested in a hidden one with it", () => {
    const match = text("plateMatch", {
      trailing: [text("plateParts"), text("plateCode")],
    });

    expect(collectHiddenNames([{ field: match, visible: false }])).toEqual([
      "plateMatch",
      "plateParts",
      "plateCode",
    ]);
  });

  it("keeps a name another visible field still renders", () => {
    expect(
      collectHiddenNames([
        { field: text("plateParts"), visible: false },
        { field: text("plateParts"), visible: true },
        { field: text("plateCode"), visible: false },
        { field: text("plateCode"), visible: false },
      ]),
    ).toEqual(["plateCode"]);
  });

  it("is empty when nothing is hidden", () => {
    expect(
      collectHiddenNames([{ field: text("title"), visible: true }]),
    ).toEqual([]);
  });
});
