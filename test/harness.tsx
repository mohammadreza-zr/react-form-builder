import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { type UseFormReturn, useForm } from "react-hook-form";

import {
  FormBuilder,
  type FormBuilderProps,
  type FormFieldConfig,
} from "../src/index.js";
import { plainComponents } from "../src/plain/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export type Values = Record<string, unknown>;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

export function unmount() {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
}

type Extra = Partial<Omit<FormBuilderProps<Values>, "fields" | "control">>;

/** Mounts a plain-adapter form; `setValue` is passed unless `extra` says otherwise. */
export async function mount(
  fields: FormFieldConfig<Values>[],
  defaultValues: Values = {},
  extra: Extra & { withoutSetValue?: boolean } = {},
) {
  const form: { current: UseFormReturn<Values> | null } = { current: null };
  const { withoutSetValue, ...props } = extra;
  function Harness() {
    const methods = useForm<Values>({ defaultValues });
    form.current = methods;
    return (
      <FormBuilder
        components={plainComponents}
        control={methods.control}
        setValue={withoutSetValue ? undefined : methods.setValue}
        fields={fields}
        {...props}
      />
    );
  }
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(<Harness />);
  });
  return { el: host, form: form.current! };
}

/** Types into an input the way a user does, so React sees a change. */
export function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!;
  return act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

/** `HTMLElement.click()` like a user's click: a disabled control ignores it. */
export const click = (target: Element) =>
  act(async () => {
    (target as HTMLElement).click();
  });

export function select(el: HTMLSelectElement, ...values: string[]) {
  return act(async () => {
    for (const option of el.options) option.selected = values.includes(option.value);
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
