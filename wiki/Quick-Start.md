# Quick start

The whole example is `examples/basic/signup-form.tsx` in the repository; its tests run in CI, so what is written here works.

## The fields

A field is an object with a `type` and a `name`. `FormFieldConfig<Values>` checks the name against the form's values and the other keys against the type:

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
export type Values = {
  title: string;
  slug: string;
  email: string;
  kind: string;
  company: string;
  agree: boolean;
};
```

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
  { type: "email", name: "email", label: "Email", required: true },
  {
    type: "select",
    name: "kind",
    label: "Kind",
    defaultValue: "person",
    options: [
      { value: "person", label: "Person" },
      { value: "company", label: "Company" },
    ],
  },
  {
    type: "text",
    name: "company",
    label: "Company",
    required: true,
    dependencies: [{ kind: "visible", when: { field: "kind", op: "eq", value: "company" } }],
  },
  { type: "checkbox", name: "agree", label: "I agree", required: true, colSpan: "full" },
```

- `slug` has a `watch` dependency: while `title` is filled it is set from the title, until the user edits it themselves (`skipIfDirty`).
- `email` is checked as an email address, and `required` fields must be filled; a `checkbox` that is `required` must be ticked.
- `kind` starts as `person` (`defaultValue`); every other field starts from the empty value of its type.
- `company` has a `visible` dependency: it is in the form only while `kind` is `company`. When it leaves, it goes back to its starting value and is not validated.

## The form

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
export function SignupForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return <Form<Values> fields={fields} onSubmit={onSubmit} columns={2} submitLabel="Sign up" />;
}
```

`columns={2}` lays the fields on a two-column grid; `colSpan: "full"` puts the checkbox on a row of its own. Submitting empty shows `Title is required.`, `Email is required.` and `I agree is required.` under the fields. Submitting after typing `Hello World` as the title, an email, choosing Company and naming it, and ticking the box calls `onSubmit` with `{ title: "Hello World", slug: "hello-world", email: "…", kind: "company", company: "…", agree: true }`.

## Next

- Draw with your own components: [Configuration](Configuration) and [Writing components](Components).
- Use a form you made with `useForm`: pass it as `form`, or draw with `FormBuilder` ([Hooks](Hooks)).
- Rows of fields, loaded options, and validation: [Field arrays](Field-Arrays), [Options](Options), [Validation](Validation).
