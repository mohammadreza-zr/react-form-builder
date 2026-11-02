// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { type FormFieldConfig, Form, prefixFields } from "../src/index.js";
import { type Values, click, type } from "./harness.js";

let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

async function render(node: ReactNode) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
}

const field = (el: Element, name: string) => el.querySelector<HTMLInputElement>(`[name="${name}"]`);
const button = (el: Element, text: string) =>
  [...el.querySelectorAll("button")].find((node) => node.textContent === text || node.getAttribute("aria-label") === text)!;
const buttons = (el: Element, text: string) =>
  [...el.querySelectorAll("button")].filter((node) => node.textContent === text || node.getAttribute("aria-label") === text);
const alerts = (el: Element) => [...el.querySelectorAll('[role="alert"]')].map((node) => node.textContent);

const items: FormFieldConfig<Values> = {
  type: "array",
  name: "items",
  label: "Items",
  minRows: 1,
  maxRows: 3,
  sortable: true,
  fields: [
    { type: "text", name: "title", label: "Title", required: true },
    { type: "checkbox", name: "gift", label: "Gift" },
    { type: "text", name: "note", label: "Note", dependencies: [{ kind: "visible", when: { field: "gift", op: "truthy" } }] },
    {
      type: "text",
      name: "code",
      label: "Code",
      dependencies: [{ kind: "watch", when: { field: "title", op: "filled" }, then: { from: ({ title }) => `C-${String(title)}` } }],
    },
    { type: "text", name: "vat", label: "VAT", dependencies: [{ kind: "visible", when: { field: "/business", op: "truthy" } }] },
  ],
};

describe("an array field", () => {
  it("starts with minRows rows, adds up to maxRows, and removes down to minRows", async () => {
    const el = await render(<Form<Values> fields={[items]} onSubmit={() => {}} />);
    expect(field(el, "items.0.title")).not.toBeNull();
    expect(button(el, "Remove").disabled).toBe(true);

    await click(button(el, "Add"));
    await click(button(el, "Add"));
    expect(field(el, "items.2.title")).not.toBeNull();
    expect(button(el, "Add").disabled).toBe(true);

    await click(buttons(el, "Remove")[2]);
    expect(field(el, "items.2.title")).toBeNull();
    expect(button(el, "Add").disabled).toBe(false);
  });

  it("reads conditions and writes inside the row, and reaches the form with a leading slash", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values>
        fields={[{ type: "checkbox", name: "business", label: "Business" }, items]}
        onSubmit={(values) => void sent.push(values)}
      />,
    );
    await click(button(el, "Add"));
    expect(field(el, "items.0.note")).toBeNull();
    expect(field(el, "items.0.vat")).toBeNull();

    await click(field(el, "items.1.gift")!);
    expect(field(el, "items.1.note")).not.toBeNull();
    expect(field(el, "items.0.note")).toBeNull();

    await type(field(el, "items.0.title")!, "Pen");
    expect(field(el, "items.0.code")!.value).toBe("C-Pen");
    expect(field(el, "items.1.code")!.value).toBe("");

    await click(field(el, "business")!);
    expect(field(el, "items.0.vat")).not.toBeNull();
    expect(field(el, "items.1.vat")).not.toBeNull();
  });

  it("validates each row's fields and the number of rows", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values>
        fields={[{ ...items, minRows: 2 } as FormFieldConfig<Values>]}
        defaultValues={{ items: [{ title: "", gift: false, note: "", code: "", vat: "" }] }}
        onSubmit={(values) => void sent.push(values)}
      />,
    );
    await click(el.querySelector('button[type="submit"]')!);
    expect(sent).toEqual([]);
    expect(alerts(el)).toEqual(["Title is required.", "Items needs at least 2 rows."]);

    await type(field(el, "items.0.title")!, "Pen");
    await click(button(el, "Add"));
    await type(field(el, "items.1.title")!, "Ink");
    await click(el.querySelector('button[type="submit"]')!);
    expect(sent).toHaveLength(1);
    expect((sent[0].items as Values[]).map((row) => row.title)).toEqual(["Pen", "Ink"]);
  });

  it("moves a row", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values>
        fields={[{ type: "array", name: "list", sortable: true, fields: [{ type: "text", name: "t", label: "T" }] }]}
        defaultValues={{ list: [{ t: "a" }, { t: "b" }] }}
        onSubmit={(values) => void sent.push(values)}
      />,
    );
    await click(buttons(el, "Move down")[0]);
    await click(el.querySelector('button[type="submit"]')!);
    expect(sent[0].list).toEqual([{ t: "b" }, { t: "a" }]);
  });
});

describe("an array inside an array", () => {
  it("names the inner rows under the outer row", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values>
        fields={[
          {
            type: "array",
            name: "groups",
            minRows: 1,
            fields: [
              { type: "text", name: "title", label: "Title" },
              { type: "array", name: "members", minRows: 1, addLabel: "Add member", fields: [{ type: "text", name: "who", label: "Who" }] },
            ],
          },
        ]}
        onSubmit={(values) => void sent.push(values)}
      />,
    );
    await type(field(el, "groups.0.title")!, "A");
    await type(field(el, "groups.0.members.0.who")!, "Sara");
    await click(button(el, "Add member"));
    await type(field(el, "groups.0.members.1.who")!, "Ali");
    await click(el.querySelector('button[type="submit"]')!);
    expect(sent).toEqual([{ groups: [{ title: "A", members: [{ who: "Sara" }, { who: "Ali" }] }] }]);
  });
});

describe("prefixFields", () => {
  it("names a row's fields, conditions and targets under the row, and leaves absolute ones", () => {
    const [out] = prefixFields(
      [
        {
          type: "text",
          name: "a",
          optionsDeps: ["b", "/c"],
          dependencies: [
            { kind: "visible", when: [{ field: "b", op: "filled" }, { field: "/c", op: "truthy" }] },
            { kind: "watch", when: { field: "b", op: "filled" }, then: { to: "d", set: 1 }, reads: ["e"] },
          ],
        },
      ],
      "rows.2",
    ) as unknown as [{ name: string; optionsDeps: string[]; dependencies: Values[] }];
    expect(out.name).toBe("rows.2.a");
    expect(out.optionsDeps).toEqual(["rows.2.b", "c"]);
    expect(out.dependencies[0].when).toEqual([
      { field: "rows.2.b", op: "filled" },
      { field: "c", op: "truthy" },
    ]);
    expect(out.dependencies[1]).toMatchObject({ when: { field: "rows.2.b" }, then: { to: "rows.2.d" }, reads: ["rows.2.e"] });
  });
});
