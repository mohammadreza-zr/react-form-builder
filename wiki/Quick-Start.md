# Quick start

The whole example is `examples/basic/signup-form.tsx` in the repository; its tests run in CI, so what is written here works.

## The fields

A field is an object with a `type` and a `name`. `FormFieldConfig<Values>` checks the name against the form's values and the other keys against the type:

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
export type Values = {
  title: string;
  slug: string;
  kind: string;
  company: string;
  agree: boolean;
};
```

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
  { type: "break" },
  {
    type: "select",
    name: "kind",
    label: "Kind",
    width: 240,
    options: [
      { value: "person", label: "Person" },
      { value: "company", label: "Company" },
    ],
  },
  {
    type: "text",
    name: "company",
    label: "Company",
    width: 240,
    dependencies: [{ kind: "visible", when: { field: "kind", op: "eq", value: "company" } }],
  },
  { type: "checkbox", name: "agree", label: "I agree" },
```

- `slug` has a `watch` dependency: while `title` is filled it is set from the title, until the user edits it themselves (`skipIfDirty`).
- `company` has a `visible` dependency: it is in the form only while `kind` is `company`. When it leaves, it goes back to its default value.
- `break` ends the row, so `kind` starts a new line.

## The form

`FormBuilder` takes the form's `control`, and `setValue` for the rules that write. The components come from `plainComponents`. The builder draws the fields without a wrapper, as the fields of a wrapping row, so you give it the container:

<!-- verbatim: examples/basic/signup-form.tsx -->
```tsx
export function SignupForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({
    defaultValues: { title: "", slug: "", kind: "person", company: "", agree: false },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <FormBuilder
          components={plainComponents}
          control={form.control}
          setValue={form.setValue}
          fields={fields}
        />
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
```

Submitting after typing `Hello World` as the title, choosing Company and ticking the box gives `{ title: "Hello World", slug: "hello-world", kind: "company", company: "", agree: true }`.

To draw the fields with your own components, see [Writing components](Components).
