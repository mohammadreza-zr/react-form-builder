# @mrzr/react-form-builder

Build a React form from a list of field configs, with react-hook-form. Fields can show, hide, disable and fill each other, depending on the other values of the form; a field can need a permission; and you supply the components that draw each field type.

```bash
npm install @mrzr/react-form-builder react-hook-form
```

---

## Quick start

A list of fields, and the `FormBuilder` that draws it. `plainComponents` draws every field type with native HTML:

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
export const fields: FormFieldConfig<Values>[] = [
  { type: "text", name: "title", label: "Title", required: true, width: 240 },
  {
    type: "text",
    name: "slug",
    label: "Slug",
    width: 240,
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
  …
];
```

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
        <FormBuilder
          components={plainComponents}
          control={form.control}
          setValue={form.setValue}
          fields={fields}
        />
```

In this form the slug follows the title until the user edits it, and Company appears only when Kind is Company. The whole file is in [Quick start](https://github.com/mohammadreza-zr/react-form-builder/wiki/Quick-Start).

---

## What it does

- **Field types**: text, number, password, search, textarea, select, radio, switch, checkbox, slider, color, date, time, datetime, range-date, range-datetime, segmented, custom; `break` and `group` for layout
- **Dependencies**: `visible`, `disabled`, `validate`, `options` and `watch` rules that read other fields
- **Access**: a field with a `permission` is in the form only if the user has it; one with a `writePermission` is read-only without it
- **Languages**: any text of a field can be written in several languages and is resolved to one
- **Your components**: you give one component per field type, with your own extra keys on the configs
- **Jalali dates**: date fields hold Jalali text, `{ year, month, day }` or an ISO date-time, and the calendar functions are in `@mrzr/react-form-builder/jalali`
- **Hooks**: `useFormFields` does everything but the drawing, `useFieldWatch` reads fields from outside the form

---

## Documentation

Everything is in the **[Wiki](https://github.com/mohammadreza-zr/react-form-builder/wiki)**:

- **Start:** [Installation](${R}/Installation) · [Quick start](${R}/Quick-Start)
- **Guides:** [Field types](${R}/Field-Types) · [Layout](${R}/Layout) · [Dependencies](${R}/Dependencies) · [Access and language](${R}/Access-and-Language) · [Writing components](${R}/Components) · [Hooks](${R}/Hooks) · [Jalali dates](${R}/Jalali-Dates)
- **Reference:** [API](${R}/API-Reference)
- **Help:** [Troubleshooting](${R}/Troubleshooting) · [Contributing](${R}/Contributing)

## Requirements

React 18 or newer (tested with 19) and react-hook-form 7.

## License

MIT
