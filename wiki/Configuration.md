# Configuration

A project sets up its forms once, with `createFormBuilder`, and uses what it returns everywhere:

<!-- verbatim: examples/basic/adapter.tsx -->
```tsx
export const { Form, FormBuilder, defineFields } = createFormBuilder({
  components: {
    wrapper: Field,
    fields: { text: IconText, rating: { component: Rating, label: "none" } },
  },
  defaults: { select: { clearable: true } },
  messages: { required: { en: "Please fill in {label}.", fa: "{label} را پر کنید." } },
});
```

It returns:

| Name | Is |
|---|---|
| `Form` | `Form` with this setup ([Quick start](Quick-Start)) |
| `FormBuilder` | `FormBuilder` with this setup ([Hooks](Hooks)) |
| `FormBuilderProvider` | Gives this setup to every plain `Form` and `FormBuilder` below it |
| `defineFields<Values>(fields)` | Returns `fields`, typed with the keys this setup's components add, for a list written outside JSX |
| `config` | The object you passed |

## What the setup takes

| Key | Meaning |
|---|---|
| `components` | The project's components ([Writing components](Components)). Each key is optional: a field type, the wrapper or a layout piece you leave out is drawn by the plain components |
| `defaults` | Config keys every field of a type starts with (below) |
| `messages` | Validation messages over the package's ([Validation](Validation)) |
| `locale`, `fallbackLocale` | The language texts and messages are resolved to ([Access and language](Access-and-Language)) |
| `can` | Whether the user holds a permission ([Access and language](Access-and-Language)) |
| `localizedKeys` | Text keys of your own field types to resolve to `locale` too |
| `prepare(fields)` | Runs on every list of fields first: add icons, expand shorthands |
| `warn(message)` | Where the builder's warnings go. Default: `console.warn` |

The same keys are props of `Form`, `FormBuilder` and `FormBuilderProvider`. A prop wins over a provider above it, and a provider wins over one further up. `locale` and `can` usually come from the app at run time, so a project often passes them through a provider in its layout:

```tsx
<FormBuilderProvider locale={i18n.language} can={(permission) => user.can(permission)}>
  <App />
</FormBuilderProvider>
```

## Defaults

`defaults` holds config keys by field type. `"*"` applies to every field with a name; a type's own entry comes after it, and the field's own config after both:

```tsx
createFormBuilder({
  defaults: {
    "*": { width: 320 },
    select: { clearable: true, placeholder: "Choose…" },
    textarea: { rows: 4 },
    array: { sortable: true },
  },
});
```

A change to how every select behaves is one line here. A field that needs something else says so in its own config. Defaults apply inside groups, array rows and `trailing` fields too, and to the starting values `Form` computes.

## Without `createFormBuilder`

`Form` and `FormBuilder` work without any setup: they draw with the plain components, in English. The same options can be passed as props, or through `FormBuilderProvider`.
