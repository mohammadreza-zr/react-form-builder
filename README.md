# @mrzr/react-form-builder

Build React forms from a list of field configs, with react-hook-form. A config says what a field holds, how it is validated, when it is shown, disabled or filled from other fields, and who may see it. The fields are drawn by native HTML out of the box, or by your own components, given once for the whole project.

```bash
npm install @mrzr/react-form-builder react-hook-form
```

---

## Quick start

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
export const fields: FormFieldConfig<Values>[] = [
  { type: "text", name: "title", label: "Title", required: true },
  {
    type: "text",
    name: "slug",
    label: "Slug",
    dependencies: [
      {
        kind: "watch",
        when: { field: "title", op: "filled" },
        then: {
          skipIfDirty: true,
          from: ({ title }) => String(title).toLowerCase().replaceAll(" ", "-"),
        },
      },
    ],
  },
  { type: "email", name: "email", label: "Email", required: true },
  …
];

export function SignupForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return <Form<Values> fields={fields} onSubmit={onSubmit} columns={2} submitLabel="Sign up" />;
}
```

`Form` makes the react-hook-form form, starts each field from its type, checks the rules the configs set, and draws the fields and a submit button. The slug follows the title until the user edits it. The whole file is in [Quick start](https://github.com/mohammadreza-zr/react-form-builder/wiki/Quick-Start).

## Your components, once

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

`wrapper` draws every field's label, help and error; each field component draws only its control. A type you give no component to keeps the native one. The keys your components read (`icon`, `max`) become typed keys of the configs.

---

## What it does

- **Field types**: text, password, search, email, tel, url, textarea, number, select, radio, combobox, tags, checkbox, switch, slider, color, file, otp, hidden, date, time, datetime, range-date, range-datetime, segmented, custom, and `array` for repeated rows; `group` and `break` for layout
- **Validation from the config**: `required`, lengths, ranges, `pattern`, email and URL formats, file size, date bounds, your own `validate`, with messages in several languages; or a schema resolver
- **Dependencies**: `visible`, `disabled`, `validate`, `options` and `watch` rules that read other fields
- **Options**: fixed, narrowed by other fields, or loaded by a function, with search
- **Field arrays**: rows of fields with add, remove, move, and row limits; rules inside a row read the row
- **Layout**: a grid of `columns` with `colSpan`, or widths in a wrapping row
- **Access**: a field with a `permission` is in the form only if the user has it; one with a `writePermission` is read-only without it
- **Languages**: texts and messages written in several languages, resolved to one
- **Defaults**: config keys every field of a type starts with, set once
- **Jalali dates**: date fields hold Jalali text, `{ year, month, day }`, an ISO date-time, or your own shape; the calendar functions are in `@mrzr/react-form-builder/jalali`

---

## Documentation

Everything is in the **[Wiki](https://github.com/mohammadreza-zr/react-form-builder/wiki)**:

- **Start:** [Installation](https://github.com/mohammadreza-zr/react-form-builder/wiki/Installation) · [Quick start](https://github.com/mohammadreza-zr/react-form-builder/wiki/Quick-Start) · [Configuration](https://github.com/mohammadreza-zr/react-form-builder/wiki/Configuration)
- **Guides:** [Field types](https://github.com/mohammadreza-zr/react-form-builder/wiki/Field-Types) · [Validation](https://github.com/mohammadreza-zr/react-form-builder/wiki/Validation) · [Layout](https://github.com/mohammadreza-zr/react-form-builder/wiki/Layout) · [Dependencies](https://github.com/mohammadreza-zr/react-form-builder/wiki/Dependencies) · [Options](https://github.com/mohammadreza-zr/react-form-builder/wiki/Options) · [Field arrays](https://github.com/mohammadreza-zr/react-form-builder/wiki/Field-Arrays) · [Access and language](https://github.com/mohammadreza-zr/react-form-builder/wiki/Access-and-Language) · [Writing components](https://github.com/mohammadreza-zr/react-form-builder/wiki/Components) · [Hooks](https://github.com/mohammadreza-zr/react-form-builder/wiki/Hooks) · [Jalali dates](https://github.com/mohammadreza-zr/react-form-builder/wiki/Jalali-Dates)
- **Reference:** [API](https://github.com/mohammadreza-zr/react-form-builder/wiki/API-Reference)
- **Help:** [Troubleshooting](https://github.com/mohammadreza-zr/react-form-builder/wiki/Troubleshooting) · [Contributing](https://github.com/mohammadreza-zr/react-form-builder/wiki/Contributing)

## Requirements

React 18 or newer (tested with 19) and react-hook-form 7.

## License

MIT
