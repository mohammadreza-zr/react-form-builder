// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import type { FormFieldConfig } from "../src/index.js";
import { type Values, click, mount, select, type, unmount } from "./harness.js";

afterEach(unmount);

const OPTIONS = [
  { value: "1", label: "One" },
  { value: "2", label: "Two" },
];

const FIELDS: FormFieldConfig<Values>[] = [
  { type: "text", name: "title", label: "Title", placeholder: "Name", normalize: (v) => v.toUpperCase() },
  { type: "number", name: "count", label: "Count" },
  { type: "password", name: "secret", label: "Secret" },
  { type: "search", name: "query", label: "Query" },
  { type: "textarea", name: "notes", label: "Notes" },
  { type: "select", name: "plan", label: "Plan", options: OPTIONS, numeric: true },
  { type: "select", name: "tags", label: "Tags", options: OPTIONS, multiple: true },
  { type: "radio", name: "pick", label: "Pick", options: OPTIONS },
  { type: "switch", name: "on", label: "On" },
  { type: "checkbox", name: "agree", label: "Agree", required: true },
  { type: "slider", name: "level", label: "Level", min: 0, max: 10, showValue: true },
  { type: "color", name: "tint", label: "Tint" },
  { type: "date", name: "day", label: "Day" },
  { type: "time", name: "hour", label: "Hour" },
  { type: "datetime", name: "moment", label: "Moment" },
  { type: "range-date", name: "days", label: "Days", startLabel: "From", endLabel: "To" },
  { type: "segmented", name: "mode", label: "Mode", options: OPTIONS },
  { type: "segmented", name: "active", label: "Active" },
  {
    type: "custom",
    name: "stars",
    label: "Stars",
    render: ({ field }) => (
      <button type="button" data-slot="stars" onClick={() => field.onChange(5)}>
        {String(field.value ?? 0)}
      </button>
    ),
  },
];

const input = (el: Element, name: string) =>
  el.querySelector<HTMLInputElement>(`[name="${name}"]`)!;

describe("plain adapter", () => {
  it("draws every field type through its own component", async () => {
    const { el } = await mount(FIELDS);
    for (const label of ["Title", "Count", "Secret", "Query", "Notes", "Plan", "Tags", "Pick", "On", "Agree", "Level", "Tint", "Day", "Hour", "Moment", "Days", "From", "To", "Mode", "Active", "Stars"]) {
      expect(el.textContent, label).toContain(label);
    }
    expect(input(el, "secret").type).toBe("password");
    expect(input(el, "query").type).toBe("search");
    expect(input(el, "day").type).toBe("date");
    expect(input(el, "hour").type).toBe("time");
    expect(input(el, "moment").type).toBe("datetime-local");
    expect(input(el, "tint").type).toBe("color");
    expect(input(el, "level").type).toBe("range");
    expect(el.querySelector("[role=switch]")).not.toBeNull();
    expect(el.querySelectorAll("[role=radiogroup]")).toHaveLength(2);
  });

  it("binds what the user types", async () => {
    const { el, form } = await mount(FIELDS);

    await type(input(el, "title"), "abc");
    expect(form.getValues("title")).toBe("ABC");

    await type(input(el, "count"), "42");
    expect(form.getValues("count")).toBe(42);
    await type(input(el, "count"), "");
    expect(form.getValues("count")).toBeUndefined();

    await type(el.querySelector<HTMLTextAreaElement>("textarea")!, "body");
    expect(form.getValues("notes")).toBe("body");

    await type(input(el, "tint"), "#ff0000");
    expect(form.getValues("tint")).toBe("#ff0000");

    await type(input(el, "day"), "2026-08-12");
    expect(form.getValues("day")).toBe("1405/05/21");

    await type(input(el, "hour"), "09:30");
    expect(form.getValues("hour")).toBe("09:30");

    await type(input(el, "moment"), "2026-08-12T09:30");
    expect(form.getValues("moment")).toBe("1405/05/21 09:30");

    await type(input(el, "level"), "7");
    expect(form.getValues("level")).toBe(7);
    expect(el.querySelector("output")?.textContent).toBe("7");
  });

  it("binds choices", async () => {
    const { el, form } = await mount(FIELDS);

    await select(el.querySelector<HTMLSelectElement>("select:not([multiple])")!, "2");
    expect(form.getValues("plan")).toBe(2);

    await select(el.querySelector<HTMLSelectElement>("select[multiple]")!, "1", "2");
    expect(form.getValues("tags")).toEqual(["1", "2"]);

    await click(el.querySelector('[name="pick"][value="2"]')!);
    expect(form.getValues("pick")).toBe("2");

    await click(el.querySelector("[role=switch]")!);
    expect(form.getValues("on")).toBe(true);

    await click(input(el, "agree"));
    expect(form.getValues("agree")).toBe(true);

    await click(el.querySelector('[name="mode"][value="1"]')!);
    expect(form.getValues("mode")).toBe("1");

    await click(input(el, "active"));
    expect(form.getValues("active")).toBe(true);
  });

  it("binds a range as { from, to }", async () => {
    const { el, form } = await mount(FIELDS);
    await type(input(el, "days.from"), "2026-08-01");
    await type(input(el, "days.to"), "2026-08-03");
    expect(form.getValues("days")).toEqual({ from: "1405/05/10", to: "1405/05/12" });
  });

  it("lets a custom field bind through its render", async () => {
    const { el, form } = await mount(FIELDS);
    await click(el.querySelector("[data-slot=stars]")!);
    expect(form.getValues("stars")).toBe(5);
  });

  it("shows a bound value", async () => {
    const { el } = await mount(FIELDS, {
      title: "Loaded",
      plan: 1,
      pick: "1",
      on: true,
      day: "1405/05/21",
      moment: "1405/05/21 09:30",
      days: { from: "1405/05/10", to: "1405/05/12" },
    });
    expect(input(el, "day").value).toBe("2026-08-12");
    expect(input(el, "moment").value).toBe("2026-08-12T09:30");
    expect(input(el, "days.from").value).toBe("2026-08-01");
    expect(input(el, "title").value).toBe("Loaded");
    expect(el.querySelector<HTMLSelectElement>("select")!.value).toBe("1");
    expect(el.querySelector<HTMLInputElement>('[name="pick"][value="1"]')!.checked).toBe(true);
    expect(el.querySelector<HTMLInputElement>("[role=switch]")!.checked).toBe(true);
    expect(input(el, "days.to").value).toBe("2026-08-03");
  });

  it("marks a required field and keeps inputProps without letting them unbind the field", async () => {
    const { el, form } = await mount(
      [{ type: "text", name: "code", label: "Code", required: true, inputProps: { inputMode: "numeric", value: "ignored" } }],
      { code: "A1" },
    );
    expect(el.textContent).toContain("*");
    expect(input(el, "code").inputMode).toBe("numeric");
    expect(input(el, "code").value).toBe("A1");
    await type(input(el, "code"), "B2");
    expect(form.getValues("code")).toBe("B2");
  });
});

describe("a disabled field cannot be changed", () => {
  it("disables every control and keeps every value", async () => {
    const disabled = FIELDS.filter((f) => f.type !== "custom").map((f) => ({ ...f, disabled: true })) as FormFieldConfig<Values>[];
    const defaults = { title: "T", count: 1, plan: 1, tags: ["1"], pick: "1", on: true, agree: true, level: 3, mode: "1", active: true, days: { from: "a", to: "b" } };
    const { el, form } = await mount(disabled, defaults);

    const controls = el.querySelectorAll<HTMLElement>("input, textarea, select, button");
    expect(controls.length).toBeGreaterThan(20);
    expect([...controls].filter((c) => !c.hasAttribute("disabled")).map((c) => c.outerHTML.slice(0, 80))).toEqual([]);

    for (const control of controls) await click(control);
    expect(form.getValues()).toMatchObject(defaults);
  });
});

describe("a date field's value format", () => {
  const DAY = "2026-08-12";

  it("holds the split day, or the date-time, and null once cleared", async () => {
    const { el, form } = await mount([
      { type: "date", name: "parts", valueFormat: "parts" },
      { type: "date", name: "stamp", valueFormat: "date-time" },
    ]);
    await type(input(el, "parts"), DAY);
    await type(input(el, "stamp"), DAY);
    expect(form.getValues("parts")).toEqual({ year: 1405, month: 5, day: 21 });
    expect(form.getValues("stamp")).toBe("2026-08-12T00:00:00Z");
    expect(input(el, "parts").value).toBe(DAY);
    expect(input(el, "stamp").value).toBe(DAY);

    await type(input(el, "parts"), "");
    await type(input(el, "stamp"), "");
    expect(form.getValues("parts")).toBeNull();
    expect(form.getValues("stamp")).toBeNull();
  });

  it("holds a month as YYYY/MM", async () => {
    const { el, form } = await mount([{ type: "date", name: "valid", picker: "month" }], { valid: "1405/05" });
    expect(input(el, "valid").value).toBe("1405/05");
    await type(input(el, "valid"), "1406/07");
    expect(form.getValues("valid")).toBe("1406/07");
  });
});
