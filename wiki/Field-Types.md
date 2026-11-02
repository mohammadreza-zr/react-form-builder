# Field types

Every field has `type` and `name`. These keys are on every field except `break` and `group`:

| Key | Meaning |
|---|---|
| `name` | The path of the value in the form, checked against the form's values |
| `label`, `description`, `hint`, `placeholder` | Texts of the field. `hint` may be a React node |
| `defaultValue` | The value the field starts with in a `Form`. Without it, the empty value of its type (below) |
| `required`, `minLen`, `maxLen`, `min`, `max`, `pattern`, `validate`, `messages` | Rules: [Validation](Validation) |
| `disabled` | Drawn disabled and not validated |
| `readOnly` | Drawn, submitted, not editable |
| `permission`, `writePermission` | [Access and language](Access-and-Language) |
| `dependencies` | [Dependencies](Dependencies) |
| `width`, `grow`, `colSpan`, `className` | [Layout](Layout) |
| `format`, `parse` | Convert between the stored value and what the control shows: store cents, show dollars |
| `inputProps` | Anything else the control takes. The plain components spread it on the element first, so what the form sets (`name`, `id`, `value`, `onChange`, …) wins over it |

## What each type holds

| `type` | Held value | Empty value | Own keys |
|---|---|---|---|
| `text`, `password`, `search`, `email`, `tel`, `url` | `string` | `""` | `normalize` (rewrites the typed text before it is stored) |
| `textarea` | `string` | `""` | `normalize`, `rows` |
| `number` | `number` | `undefined` | `step` |
| `select` | an option's `value`, or a list with `multiple` | `""`, or `[]` | [Options](Options), `multiple`, `clearable` |
| `radio` | an option's `value` | `""` | [Options](Options) |
| `combobox` | an option's `value`, a typed text with `creatable`, or a list with `multiple` | `""`, or `[]` | [Options](Options), `multiple`, `creatable`, `emptyText` |
| `tags` | `string[]` | `[]` | |
| `checkbox`, `switch` | `boolean` | `false` | |
| `slider` | `number` | `undefined` | `step`, `showValue` |
| `color` | `#RRGGBB` | `""` | `fallback` shown while empty |
| `file` | `File`, or `File[]` with `multiple` | `null`, or `[]` | `multiple`, `accept`, `maxSize` (bytes) |
| `otp` | `string` | `""` | `length`, `numeric` (digits only, default `true`) |
| `hidden` | anything | `undefined` | Not drawn; submitted |
| `date` | Jalali `YYYY/MM/DD` text, or per `valueFormat` | `""`, or `null` | `valueFormat`, `picker`, `minDate`, `maxDate`; [Jalali dates](Jalali-Dates) |
| `time` | `HH:mm` | `""` | |
| `datetime` | Jalali `YYYY/MM/DD HH:mm` | `""` | `minDate`, `maxDate` |
| `range-date`, `range-datetime` | `{ from, to }`, each end as `date` / `datetime` | `{ from: "", to: "" }` | `startLabel`, `endLabel`, `minDate`, `maxDate` |
| `segmented` | an option's `value`, or a `boolean` with no options | `""`, or `false` | [Options](Options), `trailing` (fields drawn inside the same box) |
| `custom` | whatever `render` binds | `undefined` | `render` |
| `array` | a list of rows | `[]`, or `minRows` rows | [Field arrays](Field-Arrays) |

`group` and `break` hold nothing: [Layout](Layout).

## `custom`

A `custom` field keeps the form's binding, rules, layout and error; you draw only the control:

```tsx
{
  type: "custom",
  name: "stars",
  label: "Stars",
  render: ({ field }) => <button type="button" onClick={() => field.onChange(5)}>{String(field.value ?? 0)}</button>,
}
```

`render` receives `field` and `fieldState` from react-hook-form, and `id`, `label`, `required`, `disabled` and `readOnly`. For a control you use in many forms, add a field type instead: [Writing components](Components).
