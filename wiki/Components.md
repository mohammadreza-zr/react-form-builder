# Writing components

`FormBuilder` does the form's work and binds each field with react-hook-form. A component only draws the field. You give one per field type in `components`:

```tsx
<FormBuilder components={components} … />
```

`components` is `{ fields, group?, break?, fallback? }`. `fields` maps a field `type` to a component; `group` and `break` draw those two layout items; `fallback` draws a `type` that has no component (without it, nothing is drawn). Start from `plainComponents` and replace what you need.

## What a field component receives

| Prop | Meaning |
|---|---|
| `config` | The field's config after dependencies, access and language |
| `field` | react-hook-form's `field` (`name`, `value`, `onChange`, `onBlur`, `ref`) |
| `fieldState` | react-hook-form's `fieldState` (`invalid`, `error`, …) |
| `control` | The form's control, for a field that keeps its value in more than one form field: `useController({ control, name })` binds another |
| `id` | The element id, with the form's `idScope` |
| `inline` | `true` when drawn inside another field's box |
| `disabled`, `required` | Resolved flags: the config's and the form's |
| `renderFields(fields, { inline? })` | Draws other fields through the same builder, for a field that nests others |

The component is wrapped in a `Controller` and memoised by the builder: a field whose config does not change does not re-render when another field changes. Apply `config.width` and `config.grow` with `fieldLayoutStyle`.

## Adding to the field types

The config types take a second type argument, the extras. This one adds an `icon` to `text` and a `rating` type the package does not know:

<!-- verbatim: examples/basic/adapter.tsx -->
```tsx
export type Extras = {
  text: { icon?: string };
  rating: { max: number };
};
```

`FieldPropsOf<"text", Extras>` is the props of the component for `text`, with the extras in its `config`:

<!-- verbatim: examples/basic/adapter.tsx -->
```tsx
function IconText({ config, field, id, fieldState }: FieldPropsOf<"text", Extras>) {
  return (
    <label htmlFor={id}>
      {config.icon} {config.label}
      <input
        {...field}
        id={id}
        value={(field.value as string | undefined) ?? ""}
        placeholder={config.placeholder}
        aria-invalid={fieldState.invalid}
      />
    </label>
  );
}
```

<!-- verbatim: examples/basic/adapter.tsx -->
```tsx
export const components: FormComponents<FieldValues, Extras> = {
  ...plainComponents,
  fields: { ...plainComponents.fields, text: IconText, rating: Rating },
};
```

Give the extras to the fields too: `FormFieldConfig<Values, Extras>[]`. `FormBuilder` does not infer them from `fields`, so a list typed as `FormFieldConfig<Values>[]` does not accept `icon`. A field of a type the extras add, such as `rating`, takes the keys of every field plus its own.

## One set of options for many forms

`FormBuilderProvider` takes the options a builder takes and gives them to every `FormBuilder` below it, including the builders that draw a group or a `trailing` slot. Options on a builder win:

```tsx
<FormBuilderProvider components={components} locale="fa" can={can}>
  <App />
</FormBuilderProvider>
```

A project usually wraps `FormBuilder` once with its provider and uses the wrapper everywhere.
