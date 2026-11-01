import { describe, expect, it } from "vitest";

import type { FieldNode } from "../src/core/types.js";
import { applyFieldAccess } from "../src/core/field-access.js";
import { collectDeniedNames } from "../src/core/hidden-fields.js";

const held = new Set(["search.filter.road", "camera.edit.name"]);
const can = (name: string) => held.has(name);

describe("applyFieldAccess", () => {
  it("drops a field whose permission is not held", () => {
    const fields: FieldNode[] = [
      { name: "road", type: "text", permission: "search.filter.road" },
      { name: "site", type: "text", permission: "search.filter.site" },
      { name: "free", type: "text" },
    ];
    expect(
      applyFieldAccess(fields, can).map((f) => "name" in f && f.name),
    ).toEqual(["road", "free"]);
  });

  it("disables a field whose write permission is not held", () => {
    const fields: FieldNode[] = [
      { name: "name", type: "text", writePermission: "camera.edit.name" },
      { name: "ip", type: "text", writePermission: "camera.edit.ip" },
    ];
    const [name, ip] = applyFieldAccess(fields, can);
    expect(name).toEqual({ name: "name", type: "text", disabled: false });
    expect(ip).toEqual({ name: "ip", type: "text", disabled: true });
  });

  it("removes a group left with no fields", () => {
    const fields: FieldNode[] = [
      {
        type: "group",
        fields: [
          { name: "site", type: "text", permission: "search.filter.site" },
        ],
      },
    ];
    expect(applyFieldAccess(fields, can)).toEqual([]);
  });

  it("applies the rules to the fields inside another", () => {
    const fields: FieldNode[] = [
      {
        name: "type",
        type: "segmented",
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
        trailing: [
          {
            name: "pass",
            type: "checkbox",
            permission: "search.filter.temporaryPass",
          },
        ],
      },
    ];
    expect(applyFieldAccess(fields, can)[0]).toMatchObject({ trailing: [] });
  });

  it("names the fields it took out, so their values can be reset", () => {
    const fields: FieldNode[] = [
      { name: "road", type: "text", permission: "search.filter.road" },
      { name: "site", type: "text", permission: "search.filter.site" },
    ];
    expect(collectDeniedNames(fields, applyFieldAccess(fields, can))).toEqual([
      "site",
    ]);
  });
});
