import {
  type ComponentType,
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  type UseFormSetValue,
} from "react-hook-form";

import type { FieldProps, FormComponents, RenderFields } from "./adapter.js";
import type { FieldExtras, FormFieldConfig } from "./config.js";
import {
  FieldIdScopeContext,
  InlineFieldContext,
  useFieldId,
  useInlineField,
} from "./contexts.js";
import { type UseFormFieldsOptions, useFormFields } from "./use-form-fields.js";

/** What every `FormBuilder` below a provider shares; props of a builder override it. */
export interface FormBuilderOptions<X extends FieldExtras = {}>
  extends Pick<
    UseFormFieldsOptions<FormFieldConfig<FieldValues, X>, FieldValues>,
    "can" | "locale" | "fallbackLocale" | "prepare" | "warn"
  > {
  /** The component of each field type, and the layout items. */
  components?: FormComponents<FieldValues, X>;
}

const FormBuilderOptionsContext = createContext<FormBuilderOptions<never>>({});

/**
 * Sets the options (`components`, `can`, `locale`, …) of every `FormBuilder`
 * below it, including the ones a group or a segmented field draws.
 */
export function FormBuilderProvider<X extends FieldExtras = {}>({
  children,
  ...options
}: FormBuilderOptions<X> & { children: React.ReactNode }) {
  return (
    <FormBuilderOptionsContext value={options as FormBuilderOptions<never>}>
      {children}
    </FormBuilderOptionsContext>
  );
}

export interface FormBuilderProps<
  T extends FieldValues,
  X extends FieldExtras = {},
> extends FormBuilderOptions<X> {
  fields: FormFieldConfig<T, NoInfer<X>>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a variance wildcard
  control: Control<T, any, any>;
  /** Required by `watch` and `visible` dependencies; see `useFormFields`. */
  setValue?: UseFormSetValue<T>;
  /** Prefixes every field's element id, for two forms of the same names on one page. */
  idScope?: string;
}

type LayoutItem = { type: string; fields?: unknown[]; inline?: boolean };

type AnyComponent = ComponentType<FieldProps<any, any, any>>;

const FieldController = memo(function FieldController({
  config,
  control,
  component: Component,
  renderFields,
}: {
  config: FormFieldConfig<FieldValues, any> & { name: string };
  control: Control<FieldValues>;
  component: AnyComponent;
  renderFields: RenderFields<FieldValues, any>;
}) {
  const id = useFieldId(config.name);
  const inline = useInlineField();

  return (
    <Controller
      name={config.name}
      control={control}
      render={({ field, fieldState }) => (
        <Component
          config={config}
          field={field}
          fieldState={fieldState}
          id={id}
          inline={inline}
          disabled={Boolean(config.disabled || field.disabled)}
          required={Boolean(config.required)}
          renderFields={renderFields}
        />
      )}
    />
  );
});

/**
 * Draws a form from a list of field configs, with the components of a project
 * (see `FormComponents`). The logic — dependencies, access, language, writes —
 * is `useFormFields`; this binds each field with a `Controller` and hands it
 * to the component of its `type`.
 *
 * Each field owns its subscription, so typing re-renders that field, not the
 * list. Do not read `form.watch()` in a parent that renders this: it puts the
 * whole form back on one subscription.
 */
export function FormBuilder<T extends FieldValues, X extends FieldExtras = {}>(
  props: FormBuilderProps<T, X>,
) {
  const { control, fields: inputFields, setValue, idScope } = props;
  const inherited = useContext(FormBuilderOptionsContext) as unknown as FormBuilderOptions<X>;

  const options = useMemo(
    () => ({
      components: props.components ?? inherited.components,
      can: props.can ?? inherited.can,
      locale: props.locale ?? inherited.locale,
      fallbackLocale: props.fallbackLocale ?? inherited.fallbackLocale,
      prepare: props.prepare ?? inherited.prepare,
      warn: props.warn ?? inherited.warn,
    }),
    [props.components, props.can, props.locale, props.fallbackLocale, props.prepare, props.warn, inherited],
  );
  const { components } = options;

  const items = useFormFields<FormFieldConfig<T, X>, T>(control, inputFields as never, {
    setValue,
    can: options.can,
    locale: options.locale,
    fallbackLocale: options.fallbackLocale,
    prepare: options.prepare as never,
    warn: options.warn,
  });

  const renderFields = useCallback<RenderFields<T, X>>(
    (fields, { inline = false } = {}) => {
      const list = <FormBuilder<T, X> control={control} setValue={setValue} fields={fields as never} />;
      return inline ? <InlineFieldContext value>{list}</InlineFieldContext> : list;
    },
    [control, setValue],
  );

  const rendered = (
    <>
      {items.map(({ key, field: item, visible, resolved }) => {
        if (!visible) return null;
        // The union is open to types the package does not know, so `type`
        // alone does not narrow it: read the layout items by shape.
        const field = item as unknown as LayoutItem;
        if (field.type === "break") {
          const Break = components?.break;
          return Break ? <Break key={key} /> : null;
        }

        if (field.type === "group") {
          const Group = components?.group;
          const children = renderFields(field.fields as never, { inline: field.inline });
          return Group ? (
            <Group key={key} config={field as never}>
              {children}
            </Group>
          ) : (
            <span key={key}>{children}</span>
          );
        }

        const Component = components?.fields[field.type as never] as AnyComponent | undefined;
        if (!Component) {
          const Fallback = components?.fallback;
          return Fallback ? <Fallback key={key} type={field.type} /> : null;
        }

        return (
          <FieldController
            key={key}
            config={resolved as never}
            control={control as never}
            component={Component}
            renderFields={renderFields as never}
          />
        );
      })}
    </>
  );

  // Provide the merged options so a group's or a trailing slot's builder
  // below this one reads the same ones, whether they came by props or context.
  const provided = (
    <FormBuilderOptionsContext value={options as FormBuilderOptions<never>}>
      {rendered}
    </FormBuilderOptionsContext>
  );

  // Without a scope of its own the form keeps the one it is nested in.
  if (!idScope) return provided;
  return <FieldIdScopeContext value={idScope}>{provided}</FieldIdScopeContext>;
}
