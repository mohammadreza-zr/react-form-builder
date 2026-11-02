// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsForm, type Values as SettingsValues } from "../examples/i18n-access/settings-form.js";
import { ProfileForm, type Values as ProfileValues } from "../examples/own-form/profile-form.js";
import { ContactForm, type Values as ContactValues } from "../examples/shadcn/contact-form.js";
import { AccountForm, type Values as AccountValues } from "../examples/zod/account-form.js";
import { click, select, type } from "./harness.js";

let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

async function show(node: ReactNode) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  const el = host;
  return {
    el,
    field: (name: string) => el.querySelector<HTMLInputElement>(`[name="${name}"]`)!,
    submit: () => click(el.querySelector('button[type="submit"]')!),
    alerts: () => [...el.querySelectorAll('[role="alert"]')].map((node) => node.textContent),
  };
}

describe("own-form: FormBuilder with useForm, and useFieldWatch", () => {
  it("greets once both names are typed, narrows the cities, and asks for an email only for the newsletter", async () => {
    const saved: ProfileValues[] = [];
    const { el, field, submit } = await show(<ProfileForm onSave={(values) => saved.push(values)} />);
    const greeting = () => el.querySelector('[data-testid="greeting"]')!.textContent;

    expect(greeting()).toBe("Who are you?");
    await type(field("firstName"), "Sara");
    expect(greeting()).toBe("Who are you?");
    await type(field("lastName"), "Ahmadi");
    expect(greeting()).toBe("Hello, Sara Ahmadi");

    await select(field("country") as unknown as HTMLSelectElement, "ir");
    const cities = [...el.querySelectorAll<HTMLOptionElement>('[name="city"] option')].map((o) => o.value);
    expect(cities).toEqual(["", "tehran", "shiraz"]);
    await select(field("city") as unknown as HTMLSelectElement, "shiraz");

    expect(field("email")).toBeNull();
    await click(field("newsletter"));
    await type(field("email"), "sara@example.com");
    await submit();
    expect(saved).toEqual([
      { firstName: "Sara", lastName: "Ahmadi", country: "ir", city: "shiraz", newsletter: true, email: "sara@example.com" },
    ]);
  });
});

describe("zod: a schema validates", () => {
  it("shows the schema's messages and sends what it outputs", async () => {
    const sent: AccountValues[] = [];
    const { field, submit, alerts } = await show(<AccountForm onSubmit={(values) => sent.push(values)} />);
    await type(field("username"), "sa");
    await type(field("password"), "secret-1");
    await type(field("confirm"), "secret-2");
    await submit();
    expect(sent).toEqual([]);
    expect(alerts()).toEqual(["At least 3 characters.", "The passwords differ."]);

    await type(field("username"), "sara");
    await type(field("confirm"), "secret-1");
    await submit();
    expect(sent).toEqual([{ username: "sara", password: "secret-1", confirm: "secret-1", role: "viewer" }]);
  });
});

describe("i18n-access: language and permissions", () => {
  it("writes the texts in the form's language and hides or locks by permission", async () => {
    const fa = await show(<SettingsForm locale="fa" permissions={[]} onSubmit={() => {}} />);
    expect(fa.el.textContent).toContain("نام سایت");
    expect(fa.el.textContent).toContain("ثبت");
    expect(fa.field("maxUsers").disabled).toBe(true);
    expect(fa.field("apiKey")).toBeNull();
    act(() => root?.unmount());

    const sent: SettingsValues[] = [];
    const en = await show(
      <SettingsForm locale="en" permissions={["settings.edit", "settings.secrets"]} onSubmit={(values) => sent.push(values)} />,
    );
    expect(en.el.textContent).toContain("Site name");
    expect(en.field("maxUsers").disabled).toBe(false);
    await type(en.field("siteName"), "Main");
    await type(en.field("maxUsers"), "900");
    await en.submit();
    expect(en.alerts()).toEqual(["Maximum users must be at most 500."]);
  });
});

describe("shadcn: the project's components", () => {
  // Radix measures its checkbox; jsdom has no ResizeObserver, so the real
  // implementation of the polyfill stands in for the browser's.
  globalThis.ResizeObserver ??= ResizeObserver;

  it("draws shadcn/ui's input, select, textarea and checkbox, and validates by the configs", async () => {
    const sent: ContactValues[] = [];
    const { el, field, submit, alerts } = await show(<ContactForm onSubmit={(values) => sent.push(values)} />);
    expect(el.querySelector('[data-slot="input"]')).not.toBeNull();
    expect(el.querySelector('[data-slot="select-trigger"]')).not.toBeNull();
    expect(el.querySelector('[data-slot="textarea"]')).not.toBeNull();
    expect(el.querySelector('[data-slot="checkbox"]')).not.toBeNull();

    await submit();
    expect(alerts()).toEqual(["Name is required.", "Email is required.", "Topic is required.", "Message is required."]);

    await type(field("name"), "Sara");
    await type(field("email"), "sara@example.com");
    await type(el.querySelector<HTMLTextAreaElement>('[name="message"]')!, "Hello");
    await submit();
    expect(alerts()).toContain("Message needs at least 10 characters.");
    expect(sent).toEqual([]);
  });
});
