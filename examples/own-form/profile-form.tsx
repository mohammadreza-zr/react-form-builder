import { FormBuilder, type FormFieldConfig, defaultValuesOf, useFieldWatch } from "@mrzr/react-form-builder";
import { type Control, useForm } from "react-hook-form";

export type Values = {
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  newsletter: boolean;
  email: string;
};

export const fields: FormFieldConfig<Values>[] = [
  { type: "text", name: "firstName", label: "First name", required: true },
  { type: "text", name: "lastName", label: "Last name", required: true },
  {
    type: "select",
    name: "country",
    label: "Country",
    options: [
      { value: "de", label: "Germany" },
      { value: "ir", label: "Iran" },
    ],
  },
  {
    type: "select",
    name: "city",
    label: "City",
    resetOn: ["country"],
    options: [
      { value: "berlin", label: "Berlin" },
      { value: "hamburg", label: "Hamburg" },
      { value: "tehran", label: "Tehran" },
      { value: "shiraz", label: "Shiraz" },
    ],
    dependencies: [
      { kind: "options", when: { field: "country", op: "eq", value: "de" }, then: { keep: ["berlin", "hamburg"] } },
      { kind: "options", when: { field: "country", op: "eq", value: "ir" }, then: { keep: ["tehran", "shiraz"] } },
    ],
  },
  { type: "switch", name: "newsletter", label: "Send me the newsletter", colSpan: "full" },
  {
    type: "email",
    name: "email",
    label: "Email",
    required: true,
    colSpan: "full",
    dependencies: [{ kind: "visible", when: { field: "newsletter", op: "truthy" } }],
  },
];

/** A part of the page that is not a field, following two fields of the form. */
function Greeting({ control }: { control: Control<Values> }) {
  const name = useFieldWatch(control, {
    watch: ["firstName", "lastName"],
    select: ({ firstName, lastName }) => `${String(firstName)} ${String(lastName)}`,
  });
  return <p data-testid="greeting">{name ? `Hello, ${name}` : "Who are you?"}</p>;
}

export function ProfileForm({ onSave }: { onSave: (values: Values) => void }) {
  const form = useForm<Values>({ defaultValues: defaultValuesOf(fields) as Values });
  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <Greeting control={form.control} />
      <FormBuilder control={form.control} setValue={form.setValue} fields={fields} columns={2} />
      <button type="submit">Save</button>
    </form>
  );
}
