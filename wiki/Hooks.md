# Hooks

## `useFormFields(control, fields, options)`

Everything `FormBuilder` does to the list of fields, without drawing it. Use it to draw the list yourself.

```tsx
const items = useFormFields(form.control, fields, { setValue: form.setValue, can, locale: "fa" });
```

It applies access and language, follows the dependencies, writes what `watch` rules ask for, and puts hidden and denied fields back to their defaults. It returns one item per field:

| Key | Meaning |
|---|---|
| `key` | The field's name, else its position |
| `field` | The field before its dependencies were applied |
| `visible` | `false` when a `visible` rule takes it out |
| `resolved` | The field with its dependencies applied (validation, options, disabled) |

Options: `setValue`, `can`, `locale`, `fallbackLocale`, `prepare`, and `warn` (where the missing-`setValue` message goes; default `console.warn`).

## `useFieldWatch(control, rule)`

Reads fields from a component that is not a field, such as a map, a live summary or a preview. It uses the same conditions as `dependencies`:

```tsx
const location = useFieldWatch(control, { watch: ["latitude", "longitude"] });
```

`location` is `null` until the rule holds, then `{ latitude, longitude }`. Only the component that calls it subscribes, and only to the names in the rule.

| Key of `rule` | Meaning |
|---|---|
| `watch` | The fields to subscribe to. Defaults to the fields `when` reads |
| `when` | Conditions that must hold. Defaults to every watched field being `filled` |
| `select(values)` | Derives what the component receives. Defaults to the values themselves. It runs when a watched value or a condition changes, not on every render, so an inline function is fine |

The result is a new object when a watched field changes, and not on any other render. Do not read `form.watch()` in a parent instead: it puts the whole form on one subscription.
