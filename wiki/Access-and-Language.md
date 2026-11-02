# Access and language

Both are options of the setup ([Configuration](Configuration)), of `Form` and `FormBuilder`, and of `FormBuilderProvider`.

## Access

```tsx
<FormBuilder can={(permission) => user.permissions.includes(permission)} … />
```

| On the field | Without the permission |
|---|---|
| `permission: "report.read"` | The field is not in the form, and its value goes back to its default |
| `writePermission: "report.edit"` | The field is drawn disabled |

A group with a `permission` the user lacks leaves with its fields, and a group left with no fields leaves too. Fields in `trailing` and in array rows follow the same rules. Without `can` every field is allowed. The `permission` keys are removed from the config the component receives.

## Language

```tsx
<FormBuilder locale="fa" fallbackLocale="en" … />
```

With `locale`, any text can be a string or an object with one text per language:

```tsx
{ type: "text", name: "name", label: { fa: "نام", en: "Name" } as never }
```

The text is taken in `locale`, then in `fallbackLocale` (default: `locale`), then the first language that has one. The texts resolved are the `LOCALIZED_KEYS` (`label`, `placeholder`, `hint`, `description`, `startLabel`, `endLabel`, `addLabel`, `removeLabel`, `emptyText`), the keys named in `localizedKeys` (texts your own field types add), the `label` of each option, and a group's `title` and `description`. Validation messages are resolved the same way ([Validation](Validation)), and the plain components draw their own few words (Add, Remove, …) in English or Persian by `locale`. A component receives a plain string for each text written as a string or a `{ language: text }` object; a React element (a `hint` with a link) is passed as written. Without `locale` the texts are left as written.

The config types say `string` for these texts, so an object needs a cast, as above.

## `prepare`

`prepare(fields)` runs on the fields first, before [defaults](Configuration), access and language. Use it to add what the project adds to every config, such as icons.
