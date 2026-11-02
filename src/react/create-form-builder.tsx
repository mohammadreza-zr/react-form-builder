import type { ComponentType, ReactNode } from "react";
import type { FieldValues } from "react-hook-form";

import type { FieldEntry, FormComponents } from "./adapter.js";
import type { FormFieldConfig } from "./config.js";
import { Form, type FormProps } from "./form.js";
import {
  FormBuilder,
  type FormBuilderOptions,
  type FormBuilderProps,
  FormBuilderProvider,
} from "./form-builder.js";

type PropsOfEntry<E> = E extends { component: ComponentType<infer P> }
  ? P
  : E extends ComponentType<infer P>
    ? P
    : never;

type ExtraOf<P> = P extends { config: infer C }
  ? unknown extends C
    ? {}
    : Omit<C, "type" | "name" | "dependencies" | "fields" | "trailing">
  : {};

/**
 * The keys a project's components add to each field type, read from the
 * `config` prop each component declares: a `text` component that takes
 * `FieldProps<TextField & { icon?: ReactNode }>` adds `icon` to `text`, and a
 * `plate` component adds the field type `plate`.
 */
export type ExtrasOf<F> = { [K in keyof F & string]: ExtraOf<PropsOfEntry<F[K]>> };

/** One place for everything a project's forms share. */
export interface FormBuilderConfig<F extends Record<string, FieldEntry<any>> = {}>
  extends Omit<FormBuilderOptions<any>, "components"> {
  components?: Omit<FormComponents<FieldValues, any>, "fields"> & { fields?: F };
}

/**
 * The forms of a project, set up once: its components (over the plain ones),
 * per-type defaults, validation messages, permissions and language. Gives the
 * `Form`, `FormBuilder` and `FormBuilderProvider` bound to that setup, with
 * the field configs typed by what the components take.
 *
 * ```tsx
 * export const { Form, defineFields } = createFormBuilder({
 *   components: { fields: { text: MyInput, select: MySelect }, wrapper: MyField },
 *   defaults: { select: { clearable: true } },
 * });
 * ```
 */
export function createFormBuilder<const F extends Record<string, FieldEntry<any>> = {}>(
  config: FormBuilderConfig<F> = {},
) {
  type X = ExtrasOf<F>;
  const options = config as FormBuilderOptions<any>;

  function BoundProvider({ children }: { children: ReactNode }) {
    return <FormBuilderProvider {...options}>{children}</FormBuilderProvider>;
  }

  function BoundForm<T extends FieldValues>(props: FormProps<T, X>) {
    return (
      <BoundProvider>
        <Form<T, X> {...props} />
      </BoundProvider>
    );
  }

  function BoundFormBuilder<T extends FieldValues>(props: FormBuilderProps<T, X>) {
    return (
      <BoundProvider>
        <FormBuilder<T, X> {...props} />
      </BoundProvider>
    );
  }

  /** Types a field list outside JSX: `defineFields<Values>([...])`. */
  function defineFields<T extends FieldValues = FieldValues>(fields: FormFieldConfig<T, X>[]) {
    return fields;
  }

  return {
    Form: BoundForm,
    FormBuilder: BoundFormBuilder,
    FormBuilderProvider: BoundProvider,
    defineFields,
    config,
  };
}
