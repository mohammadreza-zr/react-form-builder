# Writing components

The builder does the form's work: it binds each field with react-hook-form, applies its rules, and places it. Your components only draw. You give them once, in the setup ([Configuration](Configuration)):

```tsx
createFormBuilder({ components: { wrapper, fields: { text, select }, group, array, layout, actions } });
```

Every key is optional. What you leave out is drawn by the plain components, so you can replace one field type today and the rest later.

| Key | Draws |
|---|---|
| `fields` | One component per field `type` |
| `wrapper` | Around every field: label, help, error, and the field's place in the layout. `null` draws the fields bare |
| `group`, `break` | The two layout items ([Layout](Layout)) |
| `array` | An array field's rows and buttons ([Field arrays](Field-Arrays)) |
| `layout` | The container of a list of fields: a form, a group's body, an array row |
| `actions` | The buttons under a `Form` |
| `fallback` | A `type` with no component (without it, nothing) |

## The wrapper

The wrapper is the one place a field's frame is drawn, so a change to how labels or errors look is one change. It receives:

| Prop | Meaning |
|---|---|
| `config` | The field's config (`label`, `description`, `hint`, `className`, …) |
| `id` | The control's id: a `label` points at it with `htmlFor` |
| `label` | Where the label goes (below) |
| `required`, `disabled`, `invalid`, `inline` | The field's state |
| `error` | The message to show |
| `style` | The field's place: its width, or its grid span |
| `children` | The field's control |

Help text gets the id `<id>-description` and the error `<id>-error`; the control's `describedBy` names them.

## A field component

| Prop | Meaning |
|---|---|
| `config` | The field's config after defaults, dependencies, access and language |
| `field` | react-hook-form's `field` (`name`, `value`, `onChange`, `onBlur`, `ref`), through the config's `format` and `parse` |
| `fieldState` | react-hook-form's `fieldState` (`invalid`, `error`, …) |
| `control` | The form's control, for a field that keeps its value in more than one form field: `useController({ control, name })` binds another |
| `id`, `describedBy` | The element id, and the ids for `aria-describedby` |
| `disabled`, `readOnly`, `required`, `invalid`, `inline` | The field's state, resolved |
| `options`, `optionsState` | The options after dependencies and loading, and the loading state ([Options](Options)) |
| `style` | The field's place, only when it is drawn without a wrapper |
| `renderFields(fields, { inline?, columns? })` | Draws other fields through the same builder, for a field that nests others |

The builder wraps the component in a `Controller` and memoises it: a field whose config does not change does not re-render when another field changes.

## Where the label goes

A field type's entry is a component, or `{ component, label?, wrapper? }`:

| `label` | The label is |
|---|---|
| `"wrapper"` | Drawn by the wrapper above the control, as a `label` for `id`. The default |
| `"group"` | Drawn by the wrapper as a caption with the id `<id>-label`; the control is a group that points at it with `aria-labelledby`. The default for `radio`, `segmented` and the ranges |
| `"control"` | Drawn by the control itself, as a checkbox does after its box. The default for `checkbox` and `switch` |
| `"none"` | Not drawn. The default for `hidden` |

`wrapper: false` draws the component without the wrapper; `hidden` has no wrapper by default.

## Adding to the field types

The keys a component reads from `config` become keys of the configs. This component adds an `icon` to `text`:

<!-- verbatim: examples/basic/adapter.tsx -->
```tsx
/** `text` with an `icon` key the package does not have. */
function IconText({ config, field, id, describedBy, invalid }: FieldPropsOf<"text", { text: { icon?: string } }>) {
```

and this one adds a field type, `rating`, with a `max`:

<!-- verbatim: examples/basic/adapter.tsx -->
```tsx
function Rating({ config, field, id }: FieldPropsOf<"rating", { rating: { max: number } }>) {
```

`FieldPropsOf<K, Extras>` is the props of the component for the type `K`, with `Extras` in its `config`. `createFormBuilder` reads them from the components: the `Form` it returns takes `{ type: "text", icon: "👤" }` and `{ type: "rating", max: 5 }`, and rejects `{ type: "rating", max: "5" }`. `defineFields<Values>([...])` types a list written outside JSX the same way. A field of an added type takes the keys of every field plus its own.

An extra key cannot depend on the form's values, so one that names another field is typed as a plain string.

## Without the setup

`FormComponents<T, Extras>` is the type of `components`; pass it to `Form`, `FormBuilder` or `FormBuilderProvider` as a prop. The extras are then not inferred: type the fields as `FormFieldConfig<Values, Extras>[]`.

## shadcn/ui, or another library

A component of the package's contract is a thin function around the library's own. With shadcn/ui, the wrapper draws `Label` and the message, and a `text` field is `Input`:

```tsx
function Field({ config, id, label, required, error, style, children }: WrapperProps) {
  return (
    <div className="grid gap-2" style={style}>
      {label === "wrapper" && config.label ? <Label htmlFor={id}>{config.label}{required && " *"}</Label> : null}
      {children}
      {config.description ? <p className="text-muted-foreground text-sm">{config.description}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}

function Text({ config, field, id, describedBy, invalid, disabled, readOnly }: FieldPropsOf<"text">) {
  return <Input {...field} id={id} value={String(field.value ?? "")} placeholder={config.placeholder} aria-invalid={invalid} aria-describedby={describedBy} disabled={disabled} readOnly={readOnly} />;
}
```

The components live in your project, so they import from wherever your library is.
