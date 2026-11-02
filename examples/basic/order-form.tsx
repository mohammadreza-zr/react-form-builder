import { Form, type FieldOption, type FormFieldConfig, type OptionsLoader } from "@mrzr/react-form-builder";

export type Line = { product: string; quantity: number | undefined; gift: boolean; message: string };

export type Values = {
  customer: string;
  country: string;
  city: string;
  lines: Line[];
};

/** Stands in for a server: the cities of a country. */
const CITIES: Record<string, FieldOption[]> = {
  ir: [
    { value: "thr", label: "Tehran" },
    { value: "shz", label: "Shiraz" },
  ],
  de: [{ value: "ber", label: "Berlin" }],
};

const loadCities: OptionsLoader<Values> = async ({ values }) => CITIES[String(values.country)] ?? [];

export const fields: FormFieldConfig<Values>[] = [
  { type: "text", name: "customer", label: "Customer", required: true, colSpan: "full" },
  {
    type: "select",
    name: "country",
    label: "Country",
    required: true,
    options: [
      { value: "ir", label: "Iran" },
      { value: "de", label: "Germany" },
    ],
  },
  {
    type: "select",
    name: "city",
    label: "City",
    required: true,
    loadOptions: loadCities,
    optionsDeps: ["country"],
    resetOn: ["country"],
  },
  {
    type: "array",
    name: "lines",
    label: "Lines",
    minRows: 1,
    maxRows: 10,
    columns: 3,
    colSpan: "full",
    fields: [
      { type: "text", name: "product", label: "Product", required: true },
      { type: "number", name: "quantity", label: "Quantity", required: true, min: 1 },
      { type: "checkbox", name: "gift", label: "Gift wrap" },
      {
        type: "textarea",
        name: "message",
        label: "Gift message",
        colSpan: "full",
        dependencies: [{ kind: "visible", when: { field: "gift", op: "truthy" } }],
      },
    ],
  },
];

export function OrderForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  return <Form<Values> fields={fields} onSubmit={onSubmit} columns={2} />;
}
