import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { resolveLocalizedField, resolveLocalizedText } from "../src/core/localized-field.js";
import type { FieldNode } from "../src/core/types.js";

describe("resolveLocalizedText", () => {
  it("returns a plain string as it is, and a number or boolean as text", () => {
    expect(resolveLocalizedText("Name", "fa")).toBe("Name");
    expect(resolveLocalizedText(5, "fa")).toBe("5");
    expect(resolveLocalizedText(false, "fa")).toBe("false");
  });

  it("returns an empty string for nothing", () => {
    expect(resolveLocalizedText(undefined, "fa")).toBe("");
    expect(resolveLocalizedText(null, "fa")).toBe("");
  });

  it("picks the language asked for", () => {
    expect(resolveLocalizedText({ fa: "نام", en: "Name" }, "en")).toBe("Name");
    expect(resolveLocalizedText({ fa: "نام", en: "Name" }, "fa")).toBe("نام");
  });

  it("falls back to the fallback language when the language is missing or blank", () => {
    expect(resolveLocalizedText({ fa: "نام" }, "en", "fa")).toBe("نام");
    expect(resolveLocalizedText({ fa: "نام", en: "  " }, "en", "fa")).toBe("نام");
  });

  it("falls back to the language itself when no fallback is given, and then to the first text", () => {
    expect(resolveLocalizedText({ de: "Name" }, "en")).toBe("Name");
    expect(resolveLocalizedText({ de: "", fr: "Nom" }, "en", "es")).toBe("Nom");
  });

  it("returns an empty string for a dictionary with no text, an array or an element", () => {
    expect(resolveLocalizedText({ fa: "", en: " " }, "en")).toBe("");
    expect(resolveLocalizedText(["a"], "en")).toBe("");
    expect(resolveLocalizedText({ $$typeof: Symbol.for("react.transitional.element"), type: "b", props: {} }, "en")).toBe("");
  });
});

describe("resolveLocalizedField", () => {
  const field = {
    type: "text",
    name: "title",
    label: { fa: "عنوان", en: "Title" },
    placeholder: { fa: "بنویسید", en: "Write" },
    hint: { en: "Short" },
    description: { fa: "توضیح", en: "About" },
    options: [{ value: "a", label: { fa: "الف", en: "A" } }],
  } as unknown as FieldNode;

  it("resolves every text of a field to the language", () => {
    const out = resolveLocalizedField(field, "en") as unknown as Record<string, unknown>;
    expect(out.label).toBe("Title");
    expect(out.placeholder).toBe("Write");
    expect(out.hint).toBe("Short");
    expect(out.description).toBe("About");
    expect(out.options).toEqual([{ value: "a", label: "A" }]);
  });

  it("uses the fallback language for a text the language does not have", () => {
    const out = resolveLocalizedField(field, "en", "fa") as unknown as Record<string, unknown>;
    expect((out as { hint: string }).hint).toBe("Short");
    const fa = resolveLocalizedField(field, "fa") as unknown as Record<string, unknown>;
    expect(fa.label).toBe("عنوان");
    expect(fa.hint).toBe("Short");
  });

  it("does not touch a key the field does not have, and does not change the input", () => {
    const copy = JSON.stringify(field);
    const out = resolveLocalizedField({ type: "text", name: "a" } as FieldNode, "en");
    expect(out).toEqual({ type: "text", name: "a" });
    resolveLocalizedField(field, "en");
    expect(JSON.stringify(field)).toBe(copy);
  });

  it("resolves the start and end labels and the trailing text", () => {
    const slider = { type: "slider", name: "s", startLabel: { en: "Low", fa: "کم" }, endLabel: { en: "High", fa: "زیاد" }, trailingText: { en: "km", fa: "کیلومتر" } } as unknown as FieldNode;
    const out = resolveLocalizedField(slider, "fa") as unknown as Record<string, string>;
    expect([out.startLabel, out.endLabel, out.trailingText]).toEqual(["کم", "زیاد", "کیلومتر"]);
  });

  it("resolves a group's title and description and the fields inside it", () => {
    const group = {
      type: "group",
      title: { fa: "گروه", en: "Group" },
      description: { fa: "شرح", en: "Details" },
      fields: [field],
    } as unknown as FieldNode;
    const out = resolveLocalizedField(group, "en") as unknown as Record<string, unknown>;
    expect(out.title).toBe("Group");
    expect(out.description).toBe("Details");
    expect(((out.fields as Record<string, unknown>[])[0]).label).toBe("Title");
  });

  it("resolves a group's texts whatever its variant", () => {
    const box = { type: "group", variant: "box", title: { en: "Box" }, fields: [field] } as unknown as FieldNode;
    const out = resolveLocalizedField(box, "en") as unknown as Record<string, unknown>;
    expect(out.title).toBe("Box");
    expect(((out.fields as Record<string, unknown>[])[0]).label).toBe("Title");
  });

  it("leaves a React element as written", () => {
    const hint = createElement("i", null, "help");
    const title = createElement("b", null, "Group");
    const option = createElement("span", null, "One");
    const out = resolveLocalizedField(
      { type: "select", name: "a", hint, options: [{ value: "1", label: option }] } as unknown as FieldNode,
      "en",
    ) as unknown as Record<string, unknown>;
    expect(out.hint).toBe(hint);
    expect((out.options as { label: unknown }[])[0].label).toBe(option);
    const group = resolveLocalizedField({ type: "group", title, fields: [] } as unknown as FieldNode, "en");
    expect((group as unknown as Record<string, unknown>).title).toBe(title);
  });

  it("gives an empty text, not the object, when no language has one", () => {
    const out = resolveLocalizedField(
      { type: "select", name: "a", options: [{ value: "1", label: { en: "" } }] } as unknown as FieldNode,
      "en",
    ) as unknown as { options: { label: unknown }[] };
    expect(out.options[0].label).toBe("");
  });
});
