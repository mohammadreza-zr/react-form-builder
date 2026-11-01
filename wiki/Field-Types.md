# Field types

Every field has `type` and `name`. These keys are on every field except `break` and `group`:

| Key | Meaning |
|---|---|
| `name` | The path of the value in the form, checked against the form's values |
| `label`, `description` | Texts of the field |
| `required`, `disabled` | Flags. `required` marks the field; the form's schema decides what is valid |
| `minLen`, `maxLen`, `min`, `max` | Limits that `validate` dependencies can change |
| `permission`, `writePermission` | See [Access and language](Access-and-Language) |
| `dependencies` | See [Dependencies](Dependencies) |
| `width`, `grow`, `className` | See [Layout](Layout) |
| `inputProps` | Anything else the control takes. `plainComponents` spreads it on the element first, so `name`, `id`, `value`, `onChange`, `onBlur` and `ref` of the form win over it |

## What each type holds

| `type` | Held value | Extra keys |
|---|---|---|
| `text`, `password`, `search`, `textarea` | `string` | `placeholder`, `hint`, `normalize` (rewrites the typed text before it is stored) |
| `number` | `number`, or `""` while empty | as `text` |
| `select` | `string`, `number` with `numeric`, or an array with `multiple` | `options`, `placeholder`, `multiple`, `numeric`, `clearable`, `hint` |
| `radio` | `string`, or `number` with `numeric` | `options`, `numeric` |
| `switch`, `checkbox` | `boolean` | |
| `slider` | `number` | `min`, `max`, `step`, `showValue` |
| `color` | `#RRGGBB` string | `fallback` shown while empty |
| `date` | Jalali `YYYY/MM/DD` text, or per `valueFormat` | `valueFormat`, `picker`; see [Jalali dates](Jalali-Dates) |
| `time` | `HH:mm` | |
| `datetime` | `YYYY/MM/DD HH:mm` (Jalali), `""` while empty | |
| `range-date`, `range-datetime` | `{ from, to }`, each end as `date` / `datetime` | `startLabel`, `endLabel` |
| `segmented` | the chosen option's `value`, or a `boolean` with no `options` | `options`, `numeric`, `trailing` (fields drawn inside the same box) |
| `custom` | whatever `render` binds | `render` |

`options` are `{ value, label, disabled?, icon? }` objects.

A `custom` field keeps the form's binding, layout and error; you draw only the control:

```tsx
{
  type: "custom",
  name: "stars",
  label: "Stars",
  render: ({ field }) => <button type="button" onClick={() => field.onChange(5)}>{String(field.value ?? 0)}</button>,
}
```

`render` receives `field` and `fieldState` from react-hook-form, and `label`, `required` and `disabled`.

For other types, add them yourself: [Writing components](Components).
