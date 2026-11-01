import { useForm } from "react-hook-form";

import { FormBuilder, type FormFieldConfig } from "@mrzr/react-form-builder";
import { plainComponents } from "@mrzr/react-form-builder/plain";

export type Values = {
  title: string;
  slug: string;
  kind: string;
  company: string;
  agree: boolean;
};

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
];

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
