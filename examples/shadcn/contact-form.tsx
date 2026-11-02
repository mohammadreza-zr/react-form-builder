import { Form, defineFields } from "./form-kit";

export type Values = {
  name: string;
  email: string;
  topic: string;
  message: string;
  copy: boolean;
};

export const fields = defineFields<Values>([
  { type: "text", name: "name", label: "Name", required: true },
  { type: "email", name: "email", label: "Email", required: true },
  {
    type: "select",
    name: "topic",
    label: "Topic",
    placeholder: "Choose a topic",
    required: true,
    colSpan: "full",
    options: [
      { value: "sales", label: "Sales" },
      { value: "support", label: "Support" },
    ],
  },
  { type: "textarea", name: "message", label: "Message", required: true, minLen: 10, rows: 4, colSpan: "full" },
  { type: "checkbox", name: "copy", label: "Send me a copy", colSpan: "full" },
]);

export function ContactForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return <Form<Values> fields={fields} onSubmit={onSubmit} columns={2} submitLabel="Send" className="grid gap-6" />;
}
