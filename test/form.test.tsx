// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { type Root, createRoot } from "react-dom/client";
import { useFormContext } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import {
  type FieldPropsOf,
  type FormComponents,
  type FormFieldConfig,
  type GroupProps,
  type TextField,
  type WrapperProps,
  Form,
  createFormBuilder,
} from "../src/index.js";
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

const field = (el: Element, name: string) => el.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
const submit = (el: Element) => click(el.querySelector('button[type="submit"]')!);
const alerts = (el: Element) => [...el.querySelectorAll('[role="alert"]')].map((node) => node.textContent);

describe("Form", () => {
  const fields: FormFieldConfig<Values>[] = [
    { type: "text", name: "name", label: "Name", required: true },
    { type: "email", name: "email", label: "Email" },
    { type: "checkbox", name: "agree", label: "I agree", required: true },
  ];

  it("starts every field from its type, blocks an invalid submit, and sends a valid one", async () => {
    const sent: Values[] = [];
    const el = await render(<Form<Values> fields={fields} onSubmit={(values) => void sent.push(values)} />);

    expect(field(el, "name").value).toBe("");
    expect(field(el, "agree").checked).toBe(false);

    await submit(el);
    expect(sent).toEqual([]);
    expect(alerts(el)).toEqual(["Name is required.", "I agree is required."]);

    await type(field(el, "name"), "Sara");
    await type(field(el, "email"), "not-an-email");
    await click(field(el, "agree"));
    await submit(el);
    expect(sent).toEqual([]);
    expect(alerts(el)).toEqual(["Enter a valid email address."]);

    await type(field(el, "email"), "sara@example.com");
    await submit(el);
    expect(sent).toEqual([{ name: "Sara", email: "sara@example.com", agree: true }]);
  });

  it("writes its messages and buttons in the form's language, and takes a field's own message", async () => {
    const el = await render(
      <Form<Values>
        locale="fa"
        fields={[
          { type: "text", name: "name", label: "نام", required: true },
          { type: "text", name: "code", label: "کد", required: true, messages: { required: { fa: "کد را بنویسید." } } },
        ]}
        onSubmit={() => {}}
      />,
    );
    expect(el.querySelector('button[type="submit"]')!.textContent).toBe("ثبت");
    await submit(el);
    expect(alerts(el)).toEqual(["نام الزامی است.", "کد را بنویسید."]);
  });

  it("checks lengths, ranges, patterns, addresses, codes, lists and its own rule", async () => {
    const el = await render(
      <Form<Values>
        fields={[
          { type: "text", name: "short", label: "Short", minLen: 3 },
          { type: "number", name: "age", label: "Age", min: 18 },
          { type: "text", name: "zip", label: "Zip", pattern: "^\\d{5}$" },
          { type: "url", name: "site", label: "Site" },
          { type: "otp", name: "code", label: "Code", length: 4 },
          { type: "tags", name: "tags", label: "Tags", maxLen: 1, defaultValue: ["a", "b"] },
          { type: "text", name: "nick", label: "Nick", validate: (value) => value !== "admin" || "Taken." },
        ]}
        onSubmit={() => {}}
      />,
    );
    await type(field(el, "short"), "ab");
    await type(field(el, "age"), "12");
    await type(field(el, "zip"), "12a");
    await type(field(el, "site"), "example");
    await type(field(el, "code"), "12");
    await type(field(el, "nick"), "admin");
    await submit(el);
    expect(alerts(el)).toEqual([
      "Short needs at least 3 characters.",
      "Age must be at least 18.",
      "Zip is not in the expected format.",
      "Enter a valid web address.",
      "Code needs exactly 4 characters.",
      "Choose at most 1 for Tags.",
      "Taken.",
    ]);
  });

  it("checks a date's bounds through its value format", async () => {
    const el = await render(
      <Form<Values>
        fields={[{ type: "date", name: "day", label: "Day", valueFormat: "parts", minDate: "1405/01/01" }]}
        defaultValues={{ day: { year: 1404, month: 12, day: 29 } }}
        onSubmit={() => {}}
      />,
    );
    await submit(el);
    expect(alerts(el)).toEqual(["Day cannot be before 1405/01/01."]);
  });

  it("leaves validation to a schema with rules: false", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values> rules={false} fields={[{ type: "text", name: "a", label: "A", required: true }]} onSubmit={(v) => void sent.push(v)} />,
    );
    expect(el.textContent).toContain("A *");
    await submit(el);
    expect(alerts(el)).toEqual([]);
    expect(sent).toEqual([{ a: "" }]);
  });

  it("validates a disabled field by none of its rules", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values> fields={[{ type: "text", name: "a", label: "A", required: true, disabled: true }]} onSubmit={(v) => void sent.push(v)} />,
    );
    await submit(el);
    expect(sent).toEqual([{ a: "" }]);
  });

  it("puts the project's defaults under each field's config", async () => {
    const el = await render(
      <Form<Values>
        defaults={{ "*": { required: true }, text: { placeholder: "Type here" } }}
        fields={[
          { type: "text", name: "a", label: "A" },
          { type: "text", name: "b", label: "B", required: false },
        ]}
        onSubmit={() => {}}
      />,
    );
    expect(field(el, "a").placeholder).toBe("Type here");
    await submit(el);
    expect(alerts(el)).toEqual(["A is required."]);
  });

  it("lays the fields on a grid when it has columns", async () => {
    const el = await render(
      <Form<Values>
        columns={3}
        fields={[
          { type: "text", name: "a", label: "A" },
          { type: "text", name: "b", label: "B", colSpan: 2 },
          { type: "text", name: "c", label: "C", colSpan: "full" },
        ]}
        onSubmit={() => {}}
      />,
    );
    const list = el.querySelector<HTMLElement>('[data-slot="field-list"]')!;
    expect(list.style.display).toBe("grid");
    const spans = [...el.querySelectorAll<HTMLElement>('[data-slot="field"]')].map((node) => node.style.gridColumn);
    expect(spans).toEqual(["span 1", "span 2", "1 / -1"]);
  });

  it("shows the stored value through format and stores what the control gives through parse", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values>
        fields={[
          {
            type: "text",
            name: "price",
            label: "Price",
            format: (cents) => (typeof cents === "number" ? String(cents / 100) : ""),
            parse: (text) => Math.round(Number(text) * 100),
          },
        ]}
        defaultValues={{ price: 1250 }}
        onSubmit={(v) => void sent.push(v)}
      />,
    );
    expect(field(el, "price").value).toBe("12.5");
    await type(field(el, "price"), "3.4");
    await submit(el);
    expect(sent).toEqual([{ price: 340 }]);
  });
});

describe("rendering", () => {
  it("re-renders only the field being typed in", async () => {
    const renders: Record<string, number> = {};
    function Counted(props: FieldPropsOf<"text">) {
      renders[props.field.name] = (renders[props.field.name] ?? 0) + 1;
      return <input name={props.field.name} value={String(props.field.value ?? "")} onChange={(e) => props.field.onChange(e.target.value)} />;
    }
    const el = await render(
      <Form<Values>
        components={{ fields: { text: Counted } }}
        fields={[
          { type: "text", name: "a", label: "A", required: true },
          { type: "text", name: "b", label: "B" },
          { type: "text", name: "c", label: "C", dependencies: [{ kind: "visible", when: { field: "b", op: "filled" } }] },
        ]}
        onSubmit={() => {}}
      />,
    );
    const before = { ...renders };
    await type(field(el, "a"), "x");
    await type(field(el, "a"), "xy");
    expect(renders.a - before.a).toBeGreaterThan(0);
    expect(renders.b).toBe(before.b);
    expect(field(el, "c")).toBeNull();
  });
});

describe("resetOn and hidden fields", () => {
  it("puts a field back when a field it names changes, and keeps both when both change", async () => {
    const forms: { current: { reset: (values: Values) => void } | null } = { current: null };
    const el = await render(
      <Form<Values>
        fields={[
          { type: "text", name: "province", label: "Province" },
          { type: "text", name: "city", label: "City", resetOn: ["province"] },
        ]}
        defaultValues={{ province: "Fars", city: "" }}
        onSubmit={() => {}}
        actions={<Capture into={forms} />}
      />,
    );
    await type(field(el, "city"), "Shiraz");
    await type(field(el, "province"), "Tehran");
    expect(field(el, "city").value).toBe("");

    await type(field(el, "city"), "Rey");
    await act(async () => forms.current!.reset({ province: "Gilan", city: "Rasht" }));
    expect(field(el, "province").value).toBe("Gilan");
    expect(field(el, "city").value).toBe("Rasht");
  });

  it("does not validate a field a rule hides", async () => {
    const sent: Values[] = [];
    const el = await render(
      <Form<Values>
        fields={[
          { type: "checkbox", name: "company", label: "Company" },
          { type: "text", name: "name", label: "Name", required: true, dependencies: [{ kind: "visible", when: { field: "company", op: "truthy" } }] },
        ]}
        onSubmit={(values) => void sent.push(values)}
      />,
    );
    await submit(el);
    expect(alerts(el)).toEqual([]);
    expect(sent).toEqual([{ company: false, name: "" }]);

    await click(field(el, "company"));
    await submit(el);
    expect(alerts(el)).toEqual(["Name is required."]);
  });
});

function Capture({ into }: { into: { current: unknown } }) {
  into.current = useFormContext();
  return null;
}

describe("createFormBuilder", () => {
  function Wrapper({ config, id, children, error }: WrapperProps) {
    return (
      <div data-slot="my-field">
        <label htmlFor={id}>[{config.label}]</label>
        {children}
        {error ? <em role="alert">{error}</em> : null}
      </div>
    );
  }
  function IconText({ config, field, id }: FieldPropsOf<"text", { text: { icon?: string } }>) {
    return (
      <span>
        {config.icon}
        <input id={id} name={field.name} value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value)} />
      </span>
    );
  }
  function Plate({ config, field }: FieldPropsOf<"plate", { plate: { region: string } }>) {
    return <output data-region={config.region}>{String(field.value ?? "")}</output>;
  }

  const { Form: AppForm, defineFields } = createFormBuilder({
    components: { fields: { text: IconText, plate: Plate }, wrapper: Wrapper },
    defaults: { text: { required: true } },
    messages: { required: { en: "Fill in {label}." } },
  });

  it("draws with the project's components over the plain ones, its defaults and its messages", async () => {
    const fields = defineFields<Values>([
      { type: "text", name: "name", label: "Name", icon: "👤" },
      { type: "plate", name: "plate", label: "Plate", region: "11" },
      { type: "number", name: "count", label: "Count" },
    ]);
    const el = await render(<AppForm<Values> fields={fields} defaultValues={{ plate: "12B345" }} onSubmit={() => {}} />);
    expect(el.querySelectorAll('[data-slot="my-field"]')).toHaveLength(3);
    expect(el.textContent).toContain("👤");
    expect(el.querySelector("output")!.dataset.region).toBe("11");
    expect(field(el, "count").type).toBe("number");
    await submit(el);
    expect(alerts(el)).toEqual(["Fill in Name."]);
  });

  it("places components written for their own extras in a set with more", () => {
    type SegmentedExtras = { segmented: { tone?: string } };
    type GroupExtras = { group: { variant?: "card" | "box" } };
    type AllExtras = SegmentedExtras & GroupExtras & { rating: { max: number }; text: { icon?: string } };
    function Segmented({ config, renderFields }: FieldPropsOf<"segmented", SegmentedExtras>) {
      return <>{config.trailing ? renderFields(config.trailing, { inline: true }) : config.tone}</>;
    }
    function Group({ config, children }: GroupProps<Values, GroupExtras>) {
      return <section data-variant={config.variant}>{children}</section>;
    }
    const components: FormComponents<Values, AllExtras> = { fields: { segmented: Segmented }, group: Group };
    expect(components.group).toBe(Group);
  });

  it("types the keys a component adds", () => {
    defineFields<Values>([
      { type: "text", name: "a", icon: "x" },
      // @ts-expect-error -- `region` is a string
      { type: "plate", name: "p", region: 11 },
    ]);
  });
});

export type { TextField };
