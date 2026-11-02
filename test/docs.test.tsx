// @vitest-environment jsdom
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import * as jalali from "../src/jalali/index.js";
import * as main from "../src/index.js";
import * as plain from "../src/plain/index.js";
import { Form as AppForm, defineFields } from "../examples/basic/adapter.js";
import { OrderForm, type Values as OrderValues } from "../examples/basic/order-form.js";
import { SignupForm, type Values as SignupValues } from "../examples/basic/signup-form.js";
import { click, select, type, unmount } from "./harness.js";

// Vitest runs from the repository root.
const root = process.cwd();
const wiki = path.join(root, "wiki");
const pages = [
  path.join(root, "README.md"),
  ...readdirSync(wiki)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(wiki, name)),
];

const MARKER = /<!-- verbatim: (\S+) -->\n```[^\n]*\n([\s\S]*?)```/g;

describe("the docs", () => {
  // Every non-empty line of a marked block must be a line of the named file, in
  // order. A line that is only "…" stands for lines left out.
  it("quote the real example files in the marked blocks", () => {
    let checked = 0;
    for (const page of pages) {
      const text = readFileSync(page, "utf8");
      for (const [, file, block] of text.matchAll(MARKER)) {
        const real = readFileSync(path.join(root, file), "utf8").split("\n").map((line) => line.trimEnd());
        let at = 0;
        for (const line of block.split("\n").map((l) => l.trimEnd())) {
          if (line.trim() === "" || line.trim() === "…") continue;
          const found = real.indexOf(line, at);
          expect(found, `${path.basename(page)}: not a line of ${file}, in order: ${line}`).toBeGreaterThanOrEqual(0);
          at = found + 1;
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("link only to pages that exist", () => {
    const names = new Set(readdirSync(wiki).map((name) => name.replace(/\.md$/, "")));
    for (const page of pages.filter((p) => p.startsWith(wiki))) {
      for (const [, target] of readFileSync(page, "utf8").matchAll(/\]\(([A-Za-z-]+)(?:#[^)]*)?\)/g)) {
        expect(names.has(target), `${path.basename(page)} links to a missing page: ${target}`).toBe(true);
      }
    }
  });
});

describe("the API reference", () => {
  it("names every exported function, component and constant", () => {
    const reference = readFileSync(path.join(wiki, "API-Reference.md"), "utf8") + readFileSync(path.join(wiki, "Jalali-Dates.md"), "utf8");
    for (const [entry, exports] of Object.entries({ main, plain, jalali })) {
      for (const name of Object.keys(exports)) {
        expect(reference, `${name} (${entry}) is not in the API reference`).toMatch(new RegExp(`\\b${name}\\b`));
      }
    }
  });
});

describe("the examples", () => {
  afterEach(unmount);

  async function show(node: ReactNode) {
    const host = document.createElement("div");
    document.body.append(host);
    const mounted = createRoot(host);
    await act(async () => mounted.render(node));
    return {
      host,
      field: (name: string) => host.querySelector<HTMLInputElement>(`[name="${name}"]`),
      submit: () => click(host.querySelector('button[type="submit"]')!),
      alerts: () => [...host.querySelectorAll('[role="alert"]')].map((node) => node.textContent),
      done: () => {
        act(() => mounted.unmount());
        host.remove();
      },
    };
  }

  it("signup: follows the title with the slug, shows Company only for a company, and submits the values", async () => {
    const submitted: SignupValues[] = [];
    const { host, field, submit, alerts, done } = await show(<SignupForm onSubmit={(values) => submitted.push(values)} />);

    await submit();
    expect(alerts()).toEqual(["Title is required.", "Email is required.", "I agree is required."]);

    await type(field("title")!, "Hello World");
    expect(field("slug")!.value).toBe("hello-world");
    await type(field("email")!, "hello@example.com");

    expect(field("company")).toBeNull();
    await select(host.querySelector("select")!, "company");
    expect(field("company")).not.toBeNull();
    await type(field("company")!, "Acme");

    await click(field("agree")!);
    await submit();
    expect(submitted).toEqual([
      { title: "Hello World", slug: "hello-world", email: "hello@example.com", kind: "company", company: "Acme", agree: true },
    ]);
    done();
  });

  it("adapter: draws through the project's wrapper and components, with its messages", async () => {
    const fields = defineFields<Record<string, unknown>>([
      { type: "text", name: "name", label: "Name", icon: "👤", required: true },
      { type: "rating", name: "stars", label: "Stars", max: 3 },
    ]);
    const { host, submit, alerts, done } = await show(<AppForm fields={fields} onSubmit={() => {}} />);
    expect(host.querySelector(".field label")!.textContent).toBe("Name *");
    expect(host.querySelector(".input")!.textContent).toContain("👤");
    expect(host.querySelectorAll("[role=radiogroup] button")).toHaveLength(3);
    await submit();
    expect(alerts()).toEqual(["Please fill in Name."]);
    done();
  });

  it("order: loads the cities of the chosen country and takes a line per row", async () => {
    const submitted: OrderValues[] = [];
    const { host, field, submit, done } = await show(<OrderForm onSubmit={(values) => submitted.push(values)} />);
    const cities = () => [...host.querySelectorAll<HTMLOptionElement>('[name="city"] option')].map((o) => o.textContent);

    await type(field("customer")!, "Sara");
    await select(field("country") as unknown as HTMLSelectElement, "ir");
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(cities()).toEqual(["", "Tehran", "Shiraz"]);
    await select(field("city") as unknown as HTMLSelectElement, "shz");

    await type(field("lines.0.product")!, "Book");
    await type(field("lines.0.quantity")!, "2");
    expect(field("lines.0.message")).toBeNull();
    await click(field("lines.0.gift")!);
    await type(host.querySelector<HTMLTextAreaElement>('[name="lines.0.message"]')!, "Enjoy");

    await submit();
    expect(submitted).toEqual([
      { customer: "Sara", country: "ir", city: "shz", lines: [{ product: "Book", quantity: 2, gift: true, message: "Enjoy" }] },
    ]);
    done();
  });
});
