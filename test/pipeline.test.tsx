// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { type FieldProps, type FormFieldConfig, FormBuilder, FormBuilderProvider } from "../src/index.js";
import { plainComponents } from "../src/plain/index.js";
import { type Values, mount, type, unmount } from "./harness.js";

afterEach(unmount);

const input = (el: Element, name: string) => el.querySelector<HTMLInputElement>(`[name="${name}"]`)!;

describe("watch writes", () => {
  const fields: FormFieldConfig<Values>[] = [
    { type: "text", name: "title", label: "Title" },
    {
      type: "text",
      name: "slug",
      label: "Slug",
      dependencies: [
        {
          kind: "watch",
          when: { field: "title", op: "filled" },
          then: { skipIfDirty: true, from: ({ title }) => String(title).toLowerCase().replace(/ /g, "-") },
        },
      ],
    },
  ];

  it("follows the driver until the user edits the target", async () => {
    const { el, form } = await mount(fields);

    await type(input(el, "title"), "Hello World");
    expect(form.getValues("slug")).toBe("hello-world");

    await type(input(el, "slug"), "mine");
    await type(input(el, "title"), "Other");
    expect(form.getValues("slug")).toBe("mine");
  });

  it("warns once, and does not write, when the form's setValue is missing", async () => {
    const messages: string[] = [];
    const { el, form } = await mount(fields, {}, { withoutSetValue: true, warn: (m) => messages.push(m) });

    await type(input(el, "title"), "Hello");
    await type(input(el, "title"), "Hello again");

    expect(form.getValues("slug")).toBeUndefined();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("setValue");
  });
});

describe("dependencies on a field", () => {
  it("narrows options, disables, and tightens validation", async () => {
    const { el, form } = await mount(
      [
        { type: "text", name: "country", label: "Country" },
        {
          type: "select",
          name: "city",
          label: "City",
          options: [
            { value: "a", label: "Alpha" },
            { value: "b", label: "Beta" },
          ],
          dependencies: [
            { kind: "options", when: { field: "country", op: "eq", value: "x" }, then: { keep: ["a"] } },
            { kind: "validate", when: { field: "country", op: "filled" }, then: { required: true } },
            { kind: "disabled", when: { field: "country", op: "eq", value: "locked" } },
          ],
        },
      ],
      {},
    );
    const city = () => el.querySelector<HTMLSelectElement>("select")!;
    expect([...city().options].map((o) => o.value).filter(Boolean)).toEqual(["a", "b"]);
    expect(city().required).toBe(false);

    await type(input(el, "country"), "x");
    expect([...city().options].map((o) => o.value).filter(Boolean)).toEqual(["a"]);
    expect(city().required).toBe(true);

    await type(input(el, "country"), "locked");
    expect(city().disabled).toBe(true);
    expect(form.getValues("country")).toBe("locked");
  });
});

describe("access and language", () => {
  const fields: FormFieldConfig<Values>[] = [
    { type: "text", name: "open", label: { fa: "باز", en: "Open" } as never },
    { type: "text", name: "secret", label: "Secret", permission: "secret.read" },
    { type: "text", name: "locked", label: "Locked", writePermission: "locked.write" },
    {
      type: "select",
      name: "kind",
      label: "Kind",
      options: [{ value: "a", label: { fa: "الف", en: "Alpha" } as never }],
    },
  ];

  it("removes a field without its permission, locks one without write permission, and resets the removed value", async () => {
    const { el, form } = await mount(fields, { secret: "kept?", locked: "v" }, { can: () => false, locale: "en" });
    expect(el.textContent).not.toContain("Secret");
    expect(input(el, "locked").disabled).toBe(true);
    expect(form.getValues("secret")).toBe("kept?");
    await act(async () => {});
    expect(form.getValues("secret")).toBe("kept?");
  });

  it("puts a field the user loses access to back to its default", async () => {
    let revoke!: () => void;
    let setValue!: (name: string, value: unknown) => void;
    function Harness() {
      const [allowed, setAllowed] = useState(true);
      const form = useForm<Values>({ defaultValues: { secret: "default" } });
      revoke = () => setAllowed(false);
      setValue = form.setValue as never;
      valueOf = () => form.getValues("secret");
      return (
        <FormBuilder
          components={plainComponents}
          control={form.control}
          setValue={form.setValue}
          locale="en"
          can={allowed ? () => true : () => false}
          fields={[{ type: "text", name: "secret", label: "Secret", permission: "secret.read" }]}
        />
      );
    }
    let valueOf!: () => unknown;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<Harness />));
    await act(async () => setValue("secret", "typed"));
    expect(valueOf()).toBe("typed");

    await act(async () => revoke());
    expect(host.textContent).not.toContain("Secret");
    expect(valueOf()).toBe("default");
    act(() => root.unmount());
    host.remove();
  });

  it("allows everything when no check is given", async () => {
    const { el } = await mount(fields, {}, { locale: "en" });
    expect(el.textContent).toContain("Secret");
    expect(input(el, "locked").disabled).toBe(false);
  });

  it("resolves the texts to the locale, with a fallback", async () => {
    const { el } = await mount(fields, {}, { locale: "fa" });
    expect(el.textContent).toContain("باز");
    expect(el.textContent).toContain("الف");
    unmount();
    const en = await mount(fields, {}, { locale: "de", fallbackLocale: "en" });
    expect(en.el.textContent).toContain("Open");
    expect(en.el.textContent).toContain("Alpha");
  });
});

describe("layout", () => {
  it("draws a group, a break, and a segmented field's trailing fields", async () => {
    const { el } = await mount([
      { type: "group", title: "Box", fields: [{ type: "text", name: "inner", label: "Inner" }] },
      { type: "break" },
      {
        type: "segmented",
        name: "mode",
        label: "Mode",
        options: [{ value: "a", label: "A" }],
        trailing: [{ type: "text", name: "extra", label: "Extra" }],
      },
      { type: "group", inline: true, fields: [{ type: "text", name: "bare", label: "Bare" }] },
    ]);
    expect(el.querySelector("fieldset legend")?.textContent).toBe("Box");
    expect(el.querySelector("fieldset [name=inner]")).not.toBeNull();
    expect(el.querySelector("[data-slot=form-break]")).not.toBeNull();
    expect(el.querySelector('[data-inline] [name=extra]')).not.toBeNull();
    expect(el.querySelector('[data-inline] [name=bare]')).not.toBeNull();
    expect(el.querySelector('[name=inner]')!.closest("[data-inline]")).toBeNull();
  });

  it("applies the field's width and grow to its wrapper", async () => {
    const { el } = await mount([{ type: "text", name: "a", label: "A", width: 200, grow: true, className: "wide" }]);
    const field = el.querySelector<HTMLElement>("[data-slot=field]")!;
    expect(field.className).toBe("wide");
    expect(field.style.width).toBe("min(200px, 100%)");
    expect(field.style.flexGrow).toBe("1");
  });

  it("prefixes ids with the idScope, so two forms of the same names do not share them", async () => {
    const { el } = await mount([{ type: "text", name: "a", label: "A" }], {}, { idScope: "dialog" });
    expect(input(el, "a").id).toBe("dialog-a");
    expect(el.querySelector("label")!.htmlFor).toBe("dialog-a");
  });

  it("keeps the scope of the form a group is drawn in", async () => {
    const { el } = await mount(
      [{ type: "group", fields: [{ type: "text", name: "inner", label: "Inner" }] }],
      {},
      { idScope: "dialog" },
    );
    expect(input(el, "inner").id).toBe("dialog-inner");
  });

  it("shows the error of a field", async () => {
    const { el, form } = await mount([{ type: "text", name: "a", label: "A" }]);
    await act(async () => form.setError("a", { message: "Too short" }));
    expect(el.querySelector("[role=alert]")?.textContent).toBe("Too short");
    expect(input(el, "a").getAttribute("aria-invalid")).toBe("true");
  });
});

describe("options from a provider", () => {
  it("reaches the builders a group draws", async () => {
    function Harness() {
      const { control } = useForm<Values>();
      return (
        <FormBuilderProvider components={plainComponents} locale="fa">
          <FormBuilder
            control={control}
            fields={[{ type: "group", fields: [{ type: "text", name: "n", label: { fa: "نام", en: "Name" } as never }] }]}
          />
        </FormBuilderProvider>
      );
    }
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<Harness />));
    expect(host.querySelector("fieldset label")?.textContent).toBe("نام");
    act(() => root.unmount());
    host.remove();
  });

  it("draws nothing for a type without a component, or the fallback", async () => {
    const { el } = await mount([{ type: "plate", name: "p" } as never]);
    expect(el.textContent).toBe("");
    unmount();
    const withFallback = await mount([{ type: "plate", name: "p" } as never], {}, {
      components: { ...plainComponents, fallback: ({ type }) => <i>no {type}</i> },
    });
    expect(withFallback.el.textContent).toBe("no plate");
  });
});

describe("the form's control", () => {
  it("lets a component bind a second form field", async () => {
    const { useController } = await import("react-hook-form");
    function Pair({ config, field, control }: FieldProps<{ label?: string }>) {
      const other = useController({ control, name: "other" });
      return (
        <button
          type="button"
          data-slot="pair"
          onClick={() => {
            field.onChange("main");
            other.field.onChange("second");
          }}
        >
          {config.label}
        </button>
      );
    }
    const { el, form } = await mount([{ type: "pair", name: "main", label: "Pair" } as never], {}, {
      components: { ...plainComponents, fields: { ...plainComponents.fields, pair: Pair } as never },
    });
    await act(async () => el.querySelector<HTMLElement>("[data-slot=pair]")!.click());
    expect(form.getValues()).toEqual({ main: "main", other: "second" });
  });
});
