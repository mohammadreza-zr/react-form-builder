# Access and language

Both are options of `FormBuilder` (or of `FormBuilderProvider`, for every builder below it).

## Access

```tsx
<FormBuilder can={(permission) => user.permissions.includes(permission)} … />
```

| On the field | Without the permission |
|---|---|
| `permission: "report.read"` | The field is not in the form, and its value goes back to its default |
| `writePermission: "report.edit"` | The field is drawn disabled |

A group that is left with no fields leaves too. Fields in `trailing` follow the same rules. Without `can` every field is allowed. The `permission` keys are removed from the config the component receives.

## Language

```tsx
<FormBuilder locale="fa" fallbackLocale="en" … />
```

With `locale`, any text can be a string or an object with one text per language:

```tsx
{ type: "text", name: "name", label: { fa: "نام", en: "Name" } as never }
```

The text is taken in `locale`, then in `fallbackLocale` (default: `locale`), then the first language that has one. The texts resolved are `label`, `placeholder`, `hint`, `description`, `startLabel`, `endLabel`, `trailingText`, the `label` of each option, and a group's `title` and `description`. A component always receives plain strings. Without `locale` the texts are left as written.

The config types say `string` for these texts, so an object needs a cast, as above.

## `prepare`

`prepare(fields)` runs on the fields before access and language. Use it to add what the project adds to every config, such as icons.
