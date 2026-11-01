// @vitest-environment jsdom
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { act } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import { FormBuilder } from "../src/index.js";
import * as jalali from "../src/jalali/index.js";
import * as main from "../src/index.js";
import * as plain from "../src/plain/index.js";
import { components } from "../examples/basic/adapter.js";
import { SignupForm, type Values } from "../examples/basic/signup-form.js";
import { click, type, unmount } from "./harness.js";

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

describe("the example form", () => {
  afterEach(unmount);

  async function mountExample(onSubmit: (values: Values) => void) {
    const host = document.createElement("div");
    document.body.append(host);
    const mounted = createRoot(host);
    await act(async () => mounted.render(<SignupForm onSubmit={onSubmit} />));
    return {
      host,
      done: () => {
        act(() => mounted.unmount());
        host.remove();
      },
    };
  }

  it("follows the title with the slug, shows Company only for a company, and submits the values", async () => {
    const submitted: Values[] = [];
    const { host, done } = await mountExample((values) => submitted.push(values));
    const field = (name: string) => host.querySelector<HTMLInputElement>(`[name="${name}"]`);

    await type(field("title")!, "Hello World");
    expect(field("slug")!.value).toBe("hello-world");

    expect(field("company")).toBeNull();
    await act(async () => {
      const select = host.querySelector("select")!;
      select.value = "company";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(field("company")).not.toBeNull();

    await click(field("agree")!);
    await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(submitted).toEqual([
      { title: "Hello World", slug: "hello-world", kind: "company", company: "", agree: true },
    ]);
    done();
  });
});

describe("the example adapter", () => {
  it("draws a text field with the icon the project added, and a field type the package does not know", async () => {
    function Harness() {
      const { control } = useForm();
      return (
        <FormBuilder
          components={components}
          control={control}
          fields={[
            { type: "text", name: "name", label: "Name", icon: "👤" },
            { type: "rating", name: "stars", label: "Stars", max: 3 },
          ]}
        />
      );
    }
    const host = document.createElement("div");
    document.body.append(host);
    const mounted = createRoot(host);
    await act(async () => mounted.render(<Harness />));
    expect(host.querySelector("label")!.textContent).toContain("👤 Name");
    expect(host.querySelectorAll("[role=radiogroup] button")).toHaveLength(3);
    act(() => mounted.unmount());
    host.remove();
  });
});
