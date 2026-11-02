import { type ReactNode, useMemo } from "react";
import {
  type Control,
  type DefaultValues,
  type FieldValues,
  FormProvider,
  type Mode,
  type Resolver,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormReturn,
  useForm,
  useFormState,
} from "react-hook-form";

import { defaultValuesOf } from "../core/default-values.js";
import { applyFieldDefaults } from "../core/field-defaults.js";
import { resolveLocalizedText } from "../core/localized-field.js";
import type { FieldExtras, FormFieldConfig } from "./config.js";
import { useFormBuilderOptions } from "./contexts.js";
import { FormBuilder, type FormBuilderOptions, resolveComponents } from "./form-builder.js";

export interface FormProps<T extends FieldValues, X extends FieldExtras = {}> extends FormBuilderOptions<X> {
  fields: FormFieldConfig<T, NoInfer<X>>[];
  onSubmit: SubmitHandler<T>;
  onError?: SubmitErrorHandler<T>;
  /** Over the values the configs start with (`defaultValue`, else the empty value of each type). */
  defaultValues?: DefaultValues<T>;
  /** Values that replace the form's whenever they change — a record loaded for editing. */
  values?: T;
  /** A schema resolver (zod, yup, …); the rules the configs set are then not used. */
  resolver?: Resolver<T>;
  /** When fields are validated. Defaults to `"onTouched"`. */
  mode?: Mode;
  /** A form made with `useForm`, used instead of one of the `Form`'s own. */
  form?: UseFormReturn<T>;
  /** Defaults to "Submit", in `locale`. */
  submitLabel?: string;
  /** Shows a reset button with this text. */
  resetLabel?: string;
  /** `false` draws no buttons; a node is drawn in their place. */
  actions?: false | ReactNode;
  /** Lay the fields on a grid of this many columns. */
  columns?: number;
  idScope?: string;
  id?: string;
  className?: string;
  /** Drawn after the fields, before the buttons. */
  children?: ReactNode;
}

const SUBMIT = { en: "Submit", fa: "ثبت" };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

/** `over` on `base`, object by object; lists and other values are replaced whole. */
function mergeValues(base: Record<string, unknown>, over: Record<string, unknown> | undefined) {
  if (!over) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key]) ? mergeValues(base[key], value) : value;
  }
  return out;
}

/**
 * A whole form from field configs: it makes the react-hook-form form (or uses
 * the one in `form`), starts every field from its config, validates by the
 * configs' rules (or `resolver`), and draws the fields and the buttons.
 *
 * ```tsx
 * <Form fields={fields} onSubmit={(values) => save(values)} />
 * ```
 */
export function Form<T extends FieldValues, X extends FieldExtras = {}>(props: FormProps<T, X>) {
  return props.form ? <FormView {...props} form={props.form} /> : <OwnForm {...props} />;
}

function OwnForm<T extends FieldValues, X extends FieldExtras>(props: FormProps<T, X>) {
  const inherited = useFormBuilderOptions<X>();
  const prepare = props.prepare ?? inherited.prepare;
  const defaults = props.defaults ?? inherited.defaults;
  const { fields, defaultValues } = props;
  const start = useMemo(() => {
    const prepared = prepare ? prepare(fields as never) : fields;
    return mergeValues(defaultValuesOf(applyFieldDefaults(prepared as never, defaults)), defaultValues as never);
  }, [fields, prepare, defaults, defaultValues]);
  const form = useForm<T>({
    defaultValues: start as DefaultValues<T>,
    values: props.values,
    resolver: props.resolver,
    mode: props.mode ?? "onTouched",
  });
  return <FormView {...props} form={form} />;
}

function FormView<T extends FieldValues, X extends FieldExtras>({
  form,
  fields,
  onSubmit,
  onError,
  submitLabel,
  resetLabel,
  actions,
  columns,
  idScope,
  id,
  className,
  children,
  components,
  can,
  locale,
  fallbackLocale,
  prepare,
  defaults,
  localizedKeys,
  messages,
  warn,
}: FormProps<T, X> & { form: UseFormReturn<T> }) {
  const inherited = useFormBuilderOptions<X>();
  const language = locale ?? inherited.locale ?? "en";
  const fallback = fallbackLocale ?? inherited.fallbackLocale ?? "en";
  return (
    <FormProvider {...form}>
      <form id={id} className={className} noValidate onSubmit={form.handleSubmit(onSubmit, onError)}>
        <FormBuilder<T, X>
          control={form.control}
          setValue={form.setValue}
          fields={fields}
          columns={columns}
          idScope={idScope}
          components={components}
          can={can}
          locale={locale}
          fallbackLocale={fallbackLocale}
          prepare={prepare}
          defaults={defaults}
          localizedKeys={localizedKeys}
          messages={messages}
          warn={warn}
        />
        {children}
        {actions === false ? null : actions !== undefined ? (
          actions
        ) : (
          <FormActions
            control={form.control}
            onReset={() => form.reset()}
            submitLabel={submitLabel ?? resolveLocalizedText(SUBMIT, language, fallback)}
            resetLabel={resetLabel}
            components={components ?? inherited.components}
          />
        )}
      </form>
    </FormProvider>
  );
}

/** The buttons, in a component of their own so only they follow `isSubmitting` and `isDirty`. */
function FormActions<T extends FieldValues>({
  control,
  onReset,
  submitLabel,
  resetLabel,
  components,
}: {
  control: Control<T>;
  onReset: () => void;
  submitLabel: string;
  resetLabel?: string;
  components: FormBuilderOptions<any>["components"];
}) {
  const { isSubmitting, isDirty } = useFormState({ control });
  const Actions = resolveComponents(components).actions;
  if (!Actions) return null;
  return (
    <Actions
      submitLabel={submitLabel}
      resetLabel={resetLabel}
      submitting={isSubmitting}
      dirty={isDirty}
      onReset={onReset}
    />
  );
}
