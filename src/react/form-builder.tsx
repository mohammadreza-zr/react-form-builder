import {
  type ComponentType,
  type CSSProperties,
  Fragment,
  type ReactNode,
  memo,
  useCallback,
  useMemo,
} from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  type UseFormSetValue,
  get,
  useFieldArray,
  useFormState,
} from "react-hook-form";

import { rowDefaultsOf } from "../core/default-values.js";
import { applyFieldDefaults } from "../core/field-defaults.js";
import { prefixFields } from "../core/prefix-fields.js";
import type { FieldNode } from "../core/types.js";
import {
  type FieldRule,
  type ValidationMessages,
  fieldRules,
  validationMessage,
} from "../core/validation.js";
import { readDayValue } from "../jalali/value.js";
import { plainComponents } from "../plain/index.js";
import type {
  ArrayProps,
  FieldEntry,
  FieldProps,
  FormComponents,
  LabelPlacement,
  RenderFields,
  WrapperProps,
} from "./adapter.js";
import type { FieldExtras, FieldWidth, FormFieldConfig } from "./config.js";
import {
  FieldIdScopeContext,
  FormBuilderOptionsContext,
  InlineFieldContext,
  useFieldId,
  useFormBuilderOptions,
  useInlineField,
} from "./contexts.js";
import { fieldLayoutStyle } from "./field-layout.js";
import { useLoadedOptions } from "./use-loaded-options.js";
import { type UseFormFieldsOptions, useFormFields } from "./use-form-fields.js";

/** What every `FormBuilder` below a provider shares; props of a builder override it. */
export interface FormBuilderOptions<X extends FieldExtras = {}>
  extends Pick<
    UseFormFieldsOptions<FormFieldConfig<FieldValues, X>, FieldValues>,
    "can" | "locale" | "fallbackLocale" | "prepare" | "defaults" | "localizedKeys" | "warn"
  > {
  /** The components of the project; what is left out is drawn by the plain ones. */
  components?: FormComponents<FieldValues, X>;
  /** Validation messages over the package's; each may be one text per language. */
  messages?: Partial<ValidationMessages>;
}

const OPTION_KEYS = [
  "components",
  "can",
  "locale",
  "fallbackLocale",
  "prepare",
  "defaults",
  "localizedKeys",
  "messages",
  "warn",
] as const satisfies readonly (keyof FormBuilderOptions)[];

/** The options of `over` that are set, over those of `base`. */
function mergeOptions<X extends FieldExtras>(
  base: FormBuilderOptions<X>,
  over: FormBuilderOptions<X>,
): FormBuilderOptions<X> {
  const merged: Record<string, unknown> = { ...base };
  for (const key of OPTION_KEYS) {
    if (over[key] !== undefined) merged[key] = over[key];
  }
  return merged as FormBuilderOptions<X>;
}

/** The options of a provider or builder, kept while none of them changes. */
function useMergedOptions<X extends FieldExtras>(over: FormBuilderOptions<X>): FormBuilderOptions<X> {
  const inherited = useFormBuilderOptions<X>();
  return useMemo(
    () => mergeOptions(inherited, over),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inherited, ...OPTION_KEYS.map((key) => over[key])],
  );
}

/**
 * Sets the options (`components`, `can`, `locale`, …) of every `FormBuilder`
 * below it, including the ones a group, an array row or a segmented field
 * draws. A provider inside another overrides what it sets.
 */
export function FormBuilderProvider<X extends FieldExtras = {}>({
  children,
  ...options
}: FormBuilderOptions<X> & { children: ReactNode }) {
  const merged = useMergedOptions(options);
  return (
    <FormBuilderOptionsContext.Provider value={merged as FormBuilderOptions<never>}>
      {children}
    </FormBuilderOptionsContext.Provider>
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
  /** Lay the fields on a grid of this many columns; without it a wrapping row. */
  columns?: number;
}

/** Where a type's label goes when its entry does not say. */
const DEFAULT_LABEL: Record<string, LabelPlacement> = {
  checkbox: "control",
  switch: "control",
  radio: "group",
  segmented: "group",
  "range-date": "group",
  "range-datetime": "group",
  hidden: "none",
};

type Entry = { component: ComponentType<FieldProps<any, any, any>>; label: LabelPlacement; wrapper: boolean };

function entryOf(type: string, entry: FieldEntry<any> | undefined): Entry | null {
  if (!entry) return null;
  const label = DEFAULT_LABEL[type] ?? "wrapper";
  const wrapper = type !== "hidden";
  if (typeof entry === "object" && "component" in entry) {
    return { component: entry.component, label: entry.label ?? label, wrapper: entry.wrapper ?? wrapper };
  }
  return { component: entry, label, wrapper };
}

/** The project's components over the plain ones, type by type. */
export function resolveComponents<X extends FieldExtras = {}>(
  components: FormComponents<FieldValues, X> | undefined,
): FormComponents<FieldValues, X> {
  const base = plainComponents as FormComponents<FieldValues, X>;
  if (!components) return base;
  return { ...base, ...components, fields: { ...base.fields, ...components.fields } as FormComponents<FieldValues, X>["fields"] };
}

type Placed = { width?: FieldWidth; grow?: boolean; colSpan?: number | "full" };

/** A field's place in its list: a grid span when the list has columns, else its width. */
function placeOf(config: Placed, columns: number | undefined): CSSProperties | undefined {
  if (columns) {
    const span = config.colSpan === "full" ? "1 / -1" : `span ${Math.min(config.colSpan ?? 1, columns)}`;
    return { gridColumn: span, minWidth: 0 };
  }
  return fieldLayoutStyle(config.width, config.grow);
}

type ControlledConfig = FieldNode &
  Placed & {
    name: string;
    label?: string;
    description?: string;
    hint?: ReactNode;
    readOnly?: boolean;
    className?: string;
    valueFormat?: never;
    picker?: never;
    format?: (value: unknown) => unknown;
    parse?: (value: unknown) => unknown;
  };

type RuleContext = Pick<FormBuilderOptions, "messages" | "locale" | "fallbackLocale">;

const FieldController = memo(function FieldController({
  config,
  control,
  entry,
  Wrapper,
  renderFields,
  columns,
  messages,
  locale,
  fallbackLocale,
}: RuleContext & {
  config: ControlledConfig;
  control: Control<FieldValues>;
  entry: Entry;
  Wrapper: ComponentType<WrapperProps> | null | undefined;
  renderFields: RenderFields<FieldValues, any>;
  columns: number | undefined;
}) {
  const id = useFieldId(config.name);
  const inline = useInlineField();
  const { options, state } = useLoadedOptions(control, config as never);
  const style = useMemo(() => placeOf(config, columns), [config, columns]);

  const rules = useMemo(() => {
    const dayOf =
      config.type === "date"
        ? (value: unknown) => readDayValue(value, config.valueFormat, config.picker)
        : undefined;
    return { validate: fieldRules(config as never, { messages, locale, fallbackLocale, dayOf }) };
  }, [config, messages, locale, fallbackLocale]);

  const Component = entry.component;
  const wrapped = entry.wrapper ? Wrapper : null;

  return (
    <Controller
      name={config.name}
      control={control}
      rules={rules as never}
      render={({ field, fieldState }) => {
        const bound =
          config.format || config.parse
            ? {
                ...field,
                value: config.format ? config.format(field.value) : field.value,
                onChange: (value: unknown) => field.onChange(config.parse ? config.parse(value) : value),
              }
            : field;
        const describedBy =
          [
            config.description || config.hint ? `${id}-description` : null,
            fieldState.invalid ? `${id}-error` : null,
          ]
            .filter(Boolean)
            .join(" ") || undefined;
        const disabled = Boolean(config.disabled || field.disabled);
        const required = Boolean(config.required);
        const drawn = (
          <Component
            config={config}
            field={bound}
            fieldState={fieldState}
            control={control}
            id={id}
            describedBy={describedBy}
            inline={inline}
            disabled={disabled}
            readOnly={Boolean(config.readOnly)}
            required={required}
            invalid={fieldState.invalid}
            options={options}
            optionsState={state}
            style={wrapped ? undefined : style}
            renderFields={renderFields}
          />
        );
        if (!wrapped) return drawn;
        const Wrap = wrapped;
        return (
          <Wrap
            config={config}
            id={id}
            label={entry.label}
            required={required}
            disabled={disabled}
            invalid={fieldState.invalid}
            error={fieldState.error?.message}
            inline={inline}
            style={style}
          >
            {drawn}
          </Wrap>
        );
      }}
    />
  );
});

type ArrayConfig = FieldNode &
  Placed & {
    name: string;
    fields: FieldNode[];
    label?: string;
    required?: boolean;
    disabled?: boolean;
    minRows?: number;
    maxRows?: number;
    sortable?: boolean;
    columns?: number;
    messages?: Partial<ValidationMessages>;
    validate?: FieldRule;
    newRow?: () => Record<string, unknown>;
  };

/** One row's fields under their full names, drawn by a builder of their own. */
const ArrayRowFields = memo(function ArrayRowFields({
  fields,
  prefix,
  disabled,
  renderFields,
  columns,
}: {
  fields: FieldNode[];
  prefix: string;
  disabled: boolean;
  renderFields: RenderFields<FieldValues, any>;
  columns: number | undefined;
}) {
  const named = useMemo(() => {
    const prefixed = prefixFields(fields, prefix);
    return disabled ? prefixed.map((field) => ({ ...field, disabled: true })) : prefixed;
  }, [fields, prefix, disabled]);
  return <>{renderFields(named as never, { columns })}</>;
});

function ArrayController({
  config,
  control,
  Component,
  renderFields,
  columns,
  options,
}: {
  config: ArrayConfig;
  control: Control<FieldValues>;
  Component: ComponentType<ArrayProps<any, any>>;
  renderFields: RenderFields<FieldValues, any>;
  columns: number | undefined;
  options: FormBuilderOptions<any>;
}) {
  const id = useFieldId(config.name);
  const { messages, locale, fallbackLocale, defaults } = options;

  const rules = useMemo(() => {
    const text = (key: keyof ValidationMessages, vars: Record<string, unknown> = {}) =>
      validationMessage(key, vars, config, { messages, locale, fallbackLocale });
    const custom = config.validate;
    return {
      validate: {
        rows: (rows: unknown[] | undefined) => {
          if (config.disabled) return true;
          const count = rows?.length ?? 0;
          if (config.required && count === 0) return text("required");
          if (config.minRows !== undefined && count < config.minRows) return text("minRows", { min: config.minRows });
          if (config.maxRows !== undefined && count > config.maxRows) return text("maxRows", { max: config.maxRows });
          return true;
        },
        ...(custom && { custom: (rows: unknown, values: Record<string, unknown>) => custom(rows, values) }),
      },
    };
  }, [config, messages, locale, fallbackLocale]);

  const { fields: rows, append, remove, move } = useFieldArray({ control, name: config.name, rules: rules as never });
  const { errors } = useFormState({ control, name: config.name });
  const own = get(errors, config.name) as { root?: { message?: string }; message?: string } | undefined;
  const error = own?.root?.message ?? own?.message;

  const disabled = Boolean(config.disabled);
  const count = rows.length;
  const canAppend = !disabled && (config.maxRows === undefined || count < config.maxRows);
  const canRemove = !disabled && count > (config.minRows ?? 0);
  const rowFields = config.fields;
  const newRow = useCallback(
    () => config.newRow?.() ?? rowDefaultsOf({ ...config, fields: applyFieldDefaults(rowFields, defaults) }),
    [config, rowFields, defaults],
  );

  return (
    <Component
      config={config as never}
      id={id}
      disabled={disabled}
      required={Boolean(config.required || config.minRows)}
      error={error}
      canAppend={canAppend}
      append={() => append(newRow())}
      style={placeOf(config, columns)}
      rows={rows.map((row, index) => ({
        key: row.id,
        index,
        canRemove,
        remove: () => remove(index),
        moveUp: config.sortable && index > 0 && !disabled ? () => move(index, index - 1) : undefined,
        moveDown: config.sortable && index < count - 1 && !disabled ? () => move(index, index + 1) : undefined,
        children: (
          <ArrayRowFields
            fields={rowFields}
            prefix={`${config.name}.${index}`}
            disabled={disabled}
            renderFields={renderFields}
            columns={config.columns}
          />
        ),
      }))}
    />
  );
}

/**
 * Draws a form from a list of field configs, with the components of a project
 * (see `FormComponents`) over the plain ones. The logic — defaults,
 * dependencies, access, language, writes — is `useFormFields`; this binds each
 * field with a `Controller` and the rules its config sets, and hands it to the
 * component of its `type` inside the wrapper.
 *
 * Each field owns its subscription, so typing re-renders that field, not the
 * list. Do not read `form.watch()` in a parent that renders this: it puts the
 * whole form back on one subscription.
 */
export function FormBuilder<T extends FieldValues, X extends FieldExtras = {}>(
  props: FormBuilderProps<T, X>,
) {
  const { control, fields: inputFields, setValue, idScope, columns } = props;
  const options = useMergedOptions<X>(props);
  const components = useMemo(() => resolveComponents(options.components), [options.components]);
  // Built once per set of components, so a memoised field keeps its props.
  const entries = useMemo(() => {
    const out: Record<string, Entry> = {};
    for (const [type, entry] of Object.entries(components.fields ?? {})) {
      const resolved = entryOf(type, entry as FieldEntry<any>);
      if (resolved) out[type] = resolved;
    }
    return out;
  }, [components]);

  const items = useFormFields<FormFieldConfig<T, X>, T>(control, inputFields as never, {
    setValue,
    can: options.can,
    locale: options.locale,
    fallbackLocale: options.fallbackLocale,
    prepare: options.prepare as never,
    defaults: options.defaults,
    localizedKeys: options.localizedKeys,
    warn: options.warn,
  });

  const renderFields = useCallback<RenderFields<T, X>>(
    (fields, { inline = false, columns: inner } = {}) => {
      const list = <FormBuilder<T, X> control={control} setValue={setValue} fields={fields as never} columns={inner} />;
      return inline ? <InlineFieldContext.Provider value>{list}</InlineFieldContext.Provider> : list;
    },
    [control, setValue],
  );

  const inline = useInlineField();

  const rendered = items.map(({ key, visible, resolved }) => {
    if (!visible) return null;
    // The union is open to types the package does not know, so `type`
    // alone does not narrow it: read the layout items by shape.
    const field = resolved as unknown as FieldNode & Placed & { inline?: boolean; columns?: number };
    if (field.type === "break") {
      const Break = components.break;
      return Break ? <Break key={key} /> : null;
    }

    if (field.type === "group") {
      const Group = components.group;
      const children = renderFields(field.fields as never, { inline: field.inline, columns: field.columns });
      return Group ? (
        <Group key={key} config={field as never} style={placeOf(field, columns)}>
          {children}
        </Group>
      ) : (
        <Fragment key={key}>{children}</Fragment>
      );
    }

    if (field.type === "array") {
      const ArrayComponent = components.array;
      return ArrayComponent ? (
        <ArrayController
          key={key}
          config={field as never}
          control={control as never}
          Component={ArrayComponent}
          renderFields={renderFields as never}
          columns={columns}
          options={options}
        />
      ) : null;
    }

    const entry = entries[field.type];
    if (!entry) {
      const Fallback = components.fallback;
      return Fallback ? <Fallback key={key} type={field.type} /> : null;
    }

    return (
      <FieldController
        key={key}
        config={field as never}
        control={control as never}
        entry={entry}
        Wrapper={components.wrapper}
        renderFields={renderFields as never}
        columns={columns}
        messages={options.messages}
        locale={options.locale}
        fallbackLocale={options.fallbackLocale}
      />
    );
  });

  const Layout = components.layout;
  const laid = Layout ? (
    <Layout columns={columns} inline={inline}>
      {rendered}
    </Layout>
  ) : (
    <>{rendered}</>
  );

  // Provide the merged options so a group's, a row's or a trailing slot's
  // builder below this one reads the same ones, whether they came by props
  // or context.
  const provided = (
    <FormBuilderOptionsContext.Provider value={options as FormBuilderOptions<never>}>
      {laid}
    </FormBuilderOptionsContext.Provider>
  );

  // Without a scope of its own the form keeps the one it is nested in.
  if (!idScope) return provided;
  return <FieldIdScopeContext.Provider value={idScope}>{provided}</FieldIdScopeContext.Provider>;
}
