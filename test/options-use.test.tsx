// @vitest-environment jsdom
import { StrictMode, act, useState } from "react";
import { createRoot } from "react-dom/client";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import {
  type FormFieldConfig,
  FormBuilder,
  type OptionsLoader,
} from "../src/index.js";
import { type Values, unmount } from "./harness.js";

afterEach(unmount);

const wait = (ms: number) =>
  act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
const optionTexts = (node: Element) =>
  [...node.querySelectorAll("option")].map(
    (option) => option.value || option.textContent,
  );

/** Slow like a request: answers after `ms`, and rejects when aborted. */
const slow =
  (ms: number, calls: string[]): OptionsLoader<Values> =>
  ({ signal }) =>
    new Promise((resolve, reject) => {
      calls.push("start");
      const timer = setTimeout(
        () => resolve([{ value: "1", label: "One" }]),
        ms,
      );
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        calls.push("abort");
        reject(new DOMException("aborted", "AbortError"));
      });
    });

describe("options as a form really uses them", () => {
  it("shows a slow answer under StrictMode, which mounts every effect twice", async () => {
    const calls: string[] = [];
    const loader = slow(30, calls);
    function Page() {
      const form = useForm<Values>({ defaultValues: { s: "" } });
      return (
        <FormBuilder
          control={form.control}
          fields={[
            { type: "select", name: "s", label: "S", loadOptions: loader },
          ]}
        />
      );
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () =>
      root.render(
        <StrictMode>
          <Page />
        </StrictMode>,
      ),
    );
    await wait(80);
    expect(optionTexts(host.querySelector("select")!)).toEqual(["", "1"]);
    act(() => root.unmount());
  });

  it("does not load again, or empty the list, when the parent draws fields again", async () => {
    const calls: string[] = [];
    const loader = slow(10, calls);
    let bump!: () => void;
    function Page() {
      const [, set] = useState(0);
      bump = () => set((n) => n + 1);
      const form = useForm<Values>({ defaultValues: { s: "", t: "" } });
      const fields: FormFieldConfig<Values>[] = [
        { type: "text", name: "t", label: "T" },
        {
          type: "select",
          name: "s",
          label: "S",
          loadOptions: loader,
          optionsDeps: ["t"],
          options: [],
        },
      ];
      return <FormBuilder control={form.control} fields={fields} />;
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<Page />));
    await wait(40);
    expect(optionTexts(host.querySelector("select")!)).toEqual(["", "1"]);
    for (let i = 0; i < 5; i++) await act(async () => bump());
    expect(optionTexts(host.querySelector("select")!)).toEqual(["", "1"]);
    await wait(40);
    expect(calls.filter((c) => c === "start")).toHaveLength(1);
    act(() => root.unmount());
  });

  it("asks again when the list is opened after a failed load", async () => {
    let fail = true;
    let calls = 0;
    const loader: OptionsLoader<Values> = () => {
      calls++;
      if (fail) throw new Error("down");
      return [{ value: "ok", label: "OK" }];
    };
    const opens: (() => void)[] = [];
    const Spy = (props: {
      optionsState: { open: () => void };
      options: unknown[];
    }) => {
      opens.push(props.optionsState.open);
      return <span data-count={props.options.length} />;
    };
    function Page() {
      const form = useForm<Values>({ defaultValues: { s: "" } });
      return (
        <FormBuilder
          control={form.control}
          components={{ fields: { select: Spy as never } }}
          fields={[
            { type: "select", name: "s", label: "S", loadOptions: loader },
          ]}
        />
      );
    }
    const host = document.createElement("div");
    const root = createRoot(host);
    await act(async () => root.render(<Page />));
    await wait(20);
    expect(calls).toBe(1);
    fail = false;
    await act(async () => opens.at(-1)!());
    await wait(20);
    expect(host.querySelector("span")!.getAttribute("data-count")).toBe("1");
    act(() => root.unmount());
  });
});
