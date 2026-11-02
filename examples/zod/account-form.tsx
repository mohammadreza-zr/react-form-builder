import { zodResolver } from "@hookform/resolvers/zod";
import { Form, type FormFieldConfig } from "@mrzr/react-form-builder";
import { z } from "zod";

export const schema = z
  .object({
    username: z.string().min(3, "At least 3 characters."),
    password: z.string().min(8, "At least 8 characters."),
    confirm: z.string(),
    role: z.enum(["viewer", "editor"]),
  })
  .refine((account) => account.password === account.confirm, {
    path: ["confirm"],
    message: "The passwords differ.",
  });

export type Values = z.infer<typeof schema>;

/** The schema validates; the configs say what each field is and mark the required ones. */
export const fields: FormFieldConfig<Values>[] = [
  { type: "text", name: "username", label: "Username", required: true },
  { type: "password", name: "password", label: "Password", required: true },
  { type: "password", name: "confirm", label: "Repeat the password", required: true },
  {
    type: "radio",
    name: "role",
    label: "Role",
    defaultValue: "viewer",
    options: [
      { value: "viewer", label: "Viewer" },
      { value: "editor", label: "Editor" },
    ],
  },
];

export function AccountForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return <Form<Values> fields={fields} resolver={zodResolver(schema)} onSubmit={onSubmit} submitLabel="Create" />;
}
