// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { FormFieldConfig } from "../src/index.js";
import { type Values, mount, unmount } from "./harness.js";

afterEach(unmount);

const when = { field: "mode", op: "eq", value: "on" } as const;

const FIELDS: FormFieldConfig<Values>[] = [
  { type: "text", name: "mode", label: "Mode" },
  { type: "text", name: "note", label: "Note", dependencies: [{ kind: "visible", when }] },
  { type: "text", name: "owner", label: "Owner", dependencies: [{ kind: "visible", when }] },
  { type: "text", name: "shared", label: "Shared (on)", dependencies: [{ kind: "visible", when }] },
  {
    type: "text",
    name: "shared",
    label: "Shared (off)",
    dependencies: [{ kind: "visible", when: { field: "mode", op: "neq", value: "on" } }],
  },
];

const DEFAULTS = { mode: "on", note: "", owner: "", shared: "" };

describe("hidden fields", () => {
  it("puts a field its visible rule hides back to its default", async () => {
    const { form } = await mount(FIELDS, DEFAULTS);

    await act(async () => {
      form.setValue("note", "typed");
      form.setValue("owner", "me");
    });
    expect(form.getValues("note")).toBe("typed");

    await act(async () => form.setValue("mode", "off"));

    expect(form.getValues()).toEqual({ mode: "off", note: "", owner: "", shared: "" });
  });

  it("keeps what a hidden field held while it is shown", async () => {
    const { form } = await mount(FIELDS, DEFAULTS);

    await act(async () => form.setValue("note", "typed"));
    await act(async () => form.setValue("mode", "on"));

    expect(form.getValues("note")).toBe("typed");
  });

  it("leaves a name another shown field still renders", async () => {
    const { form } = await mount(FIELDS, DEFAULTS);

    await act(async () => form.setValue("shared", "kept"));
    await act(async () => form.setValue("mode", "off"));

    expect(form.getValues("shared")).toBe("kept");
  });

  it("draws only the fields whose rule holds", async () => {
    const { el } = await mount(FIELDS, DEFAULTS);
    expect(el.textContent).toContain("Note");
    expect(el.textContent).toContain("Shared (on)");
    expect(el.textContent).not.toContain("Shared (off)");
  });
});
