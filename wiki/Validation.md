# Validation

A field's config sets its rules; the builder gives them to react-hook-form. An empty value passes every rule but `required`, and a disabled or hidden field is not validated.

| Key | Rule |
|---|---|
| `required` | The field holds a value. A `checkbox` or `switch` must be `true`; a list must not be empty; a range needs both ends |
| `minLen`, `maxLen` | Characters of a text, or items of a list (`tags`, a `multiple` choice, files) |
| `min`, `max` | A number's bounds |
| `pattern` | A text matches it: a `RegExp`, or a string made into one |
| `type: "email"`, `type: "url"` | The text is an email address / an `http` or `https` address |
| `length` on `otp` | The code has exactly this many characters |
| `maxSize` on `file` | Each file is at most this many bytes |
| `minDate`, `maxDate` | A day (Jalali `YYYY/MM/DD`) is not before / after; read through the field's `valueFormat` |
| `validate(value, values)` | Your own rule: return `true` when the value is fine, or the message. It may be async |

A `validate` [dependency](Dependencies) changes `required`, `minLen`, `maxLen`, `min` and `max` while its condition holds, and the rules follow.

## Messages

Each message is a text, or one text per language. `{label}` is the field's label, and `{min}`, `{max}` and `{length}` the bound:

| Key | English |
|---|---|
| `required` | `{label} is required.` |
| `minLen`, `maxLen` | `{label} needs at least {min} characters.` / `{label} takes at most {max} characters.` |
| `minItems`, `maxItems` | `Choose at least {min} for {label}.` / `Choose at most {max} for {label}.` |
| `min`, `max` | `{label} must be at least {min}.` / `{label} must be at most {max}.` |
| `pattern` | `{label} is not in the expected format.` |
| `email`, `url` | `Enter a valid email address.` / `Enter a valid web address.` |
| `length` | `{label} needs exactly {length} characters.` |
| `maxSize` | `Each file of {label} can be at most {max}.` (`{max}` as `2 MB`) |
| `minRows`, `maxRows` | `{label} needs at least {min} rows.` / `{label} takes at most {max} rows.` |
| `minDate`, `maxDate` | `{label} cannot be before {min}.` / `{label} cannot be after {max}.` |
| `field` | `This field`: what `{label}` is for a field without a label |

The package has them in English (`en`) and Persian (`fa`), in `defaultMessages`. Change one for the whole project with `messages` in the setup ([Configuration](Configuration)), and for one field with the field's own `messages`:

```tsx
{ type: "text", name: "code", label: "Code", required: true, messages: { required: { en: "Enter the code from the email." } } }
```

## A schema instead

Give `Form` a `resolver` (zod, yup, …) and react-hook-form validates with it; the rules of the configs are then not used. `required` still marks the field. Use a schema when the rules are shared with a server, and the configs when the form is the only place they live.

A project whose forms all use schemas sets `rules: false` in its setup: the configs then only mark the fields (`required` still draws the mark).

`fieldRules(config, options)` returns a config's rules as react-hook-form `validate` functions, and `validationMessage(key, vars, config, options)` one message, for a project that draws fields without the builder.
