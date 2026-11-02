// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { FieldOption, FormFieldConfig, OptionsLoader } from "../src/index.js";
import { type Values, click, mount, select, type, unmount } from "./harness.js";

afterEach(unmount);

const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
const wait = (ms: number) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
const input = (el: Element, name: string) => el.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
const optionTexts = (node: Element) => [...node.querySelectorAll("option")].map((option) => option.value || option.textContent);

const CITIES: Record<string, FieldOption[]> = {
  teh: [
    { value: "1", label: "Tehran" },
    { value: "2", label: "Rey" },
  ],
  fars: [{ value: "3", label: "Shiraz" }],
};

describe("loaded options", () => {
  it("loads on mount, again when an input changes, and shares one request between fields", async () => {
    const calls: unknown[] = [];
    const loadCities: OptionsLoader<Values> = async ({ values }) => {
      calls.push(values.province);
      return CITIES[String(values.province)] ?? [];
    };
    const fields: FormFieldConfig<Values>[] = [
      { type: "text", name: "province", label: "Province" },
      { type: "select", name: "city", label: "City", loadOptions: loadCities, optionsDeps: ["province"] },
      { type: "select", name: "city2", label: "City 2", loadOptions: loadCities, optionsDeps: ["province"] },
    ];
    const { el } = await mount(fields, { province: "teh", city: "", city2: "" });
    await settle();
    expect(optionTexts(input(el, "city"))).toEqual(["", "1", "2"]);
    expect(optionTexts(input(el, "city2"))).toEqual(["", "1", "2"]);
    expect(calls).toEqual(["teh"]);

    await type(input(el, "province"), "fars");
    await settle();
    expect(optionTexts(input(el, "city"))).toEqual(["", "3"]);
    expect(calls).toEqual(["teh", "fars"]);
  });

  it("loads for what is typed into a combobox, after a pause", async () => {
    const searches: string[] = [];
    const loader: OptionsLoader<Values> = ({ search }) => {
      searches.push(search);
      return [{ value: "x", label: `Result for ${search || "nothing"}` }];
    };
    const { el, form } = await mount([{ type: "combobox", name: "pick", label: "Pick", loadOptions: loader }], { pick: "" });
    await settle();
    await type(input(el, "pick"), "ab");
    await type(input(el, "pick"), "abc");
    await wait(300);
    expect(searches).toEqual(["", "abc"]);
    expect(optionTexts(el.querySelector("datalist")!)).toEqual(["Result for abc"]);

    await type(input(el, "pick"), "Result for abc");
    expect(form.getValues("pick")).toBe("x");
  });

  it("keeps an option's value as it is written, a number included", async () => {
    const { el, form } = await mount(
      [
        {
          type: "select",
          name: "level",
          label: "Level",
          options: [
            { value: 1, label: "One" },
            { value: 2, label: "Two" },
          ],
        },
      ],
      { level: "" },
    );
    await select(input(el, "level") as unknown as HTMLSelectElement, "2");
    expect(form.getValues("level")).toBe(2);
  });
});

describe("the new field types", () => {
  it("picks a combobox option by its label, keeps a created value, and adds to a multiple one with Enter", async () => {
    const options = [
      { value: "r", label: "Red" },
      { value: "g", label: "Green" },
    ];
    const { el, form } = await mount(
      [
        { type: "combobox", name: "one", label: "One", options },
        { type: "combobox", name: "own", label: "Own", options, creatable: true },
        { type: "combobox", name: "many", label: "Many", options, multiple: true },
      ],
      { one: "", own: "", many: [] },
    );
    await type(input(el, "one"), "Green");
    expect(form.getValues("one")).toBe("g");
    await type(input(el, "own"), "Blue");
    expect(form.getValues("own")).toBe("Blue");

    const many = input(el, "many");
    await type(many, "Red");
    await act(async () => many.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(form.getValues("many")).toEqual(["r"]);
    await click(el.querySelector('[aria-label="Remove Red"]')!);
    expect(form.getValues("many")).toEqual([]);
  });

  it("adds tags with Enter and removes the last with Backspace", async () => {
    const { el, form } = await mount([{ type: "tags", name: "tags", label: "Tags" }], { tags: [] });
    const box = input(el, "tags");
    const key = (k: string) => act(async () => box.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })));
    await type(box, "one");
    await key("Enter");
    await type(box, "two");
    await key(",");
    expect(form.getValues("tags")).toEqual(["one", "two"]);
    await key("Backspace");
    expect(form.getValues("tags")).toEqual(["one"]);
  });

  it("keeps only digits in a code, holds a file, and submits a hidden value without drawing it", async () => {
    const { el, form } = await mount(
      [
        { type: "otp", name: "code", label: "Code", length: 6 },
        { type: "file", name: "doc", label: "Doc" },
        { type: "hidden", name: "token" },
      ],
      { code: "", doc: null, token: "abc" },
    );
    await type(input(el, "code"), "12a3");
    expect(form.getValues("code")).toBe("123");
    expect(input(el, "code").maxLength).toBe(6);

    const doc = input(el, "doc");
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    Object.defineProperty(doc, "files", { value: [file] });
    await act(async () => doc.dispatchEvent(new Event("change", { bubbles: true })));
    expect(form.getValues("doc")).toBe(file);
    expect(el.textContent).toContain("a.txt");

    expect(input(el, "token").type).toBe("hidden");
    expect(el.querySelectorAll('[data-slot="field"]')).toHaveLength(2);
  });

  it("marks a read-only field, which keeps its value", async () => {
    const { el } = await mount([{ type: "text", name: "id", label: "ID", readOnly: true }], { id: "42" });
    expect(input(el, "id").readOnly).toBe(true);
    expect(input(el, "id").value).toBe("42");
  });
});
