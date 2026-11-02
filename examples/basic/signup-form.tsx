import { Form, type FormFieldConfig } from "@mrzr/react-form-builder";

export type Values = {
  title: string;
  slug: string;
  email: string;
  kind: string;
  company: string;
  agree: boolean;
};

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
];

export function SignupForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return <Form<Values> fields={fields} onSubmit={onSubmit} columns={2} submitLabel="Sign up" />;
}
