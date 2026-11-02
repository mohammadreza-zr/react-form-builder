import { Form, type FormFieldConfig } from "@mrzr/react-form-builder";

export type Values = {
  siteName: string;
  maxUsers: number | undefined;
  retention: string;
  apiKey: string;
};

/** A text in both languages; the form shows the one of its `locale`. */
const text = (fa: string, en: string) => ({ fa, en }) as unknown as string;

export const fields: FormFieldConfig<Values>[] = [
  { type: "text", name: "siteName", label: text("نام سایت", "Site name"), required: true },
  {
    type: "number",
    name: "maxUsers",
    label: text("حداکثر کاربر", "Maximum users"),
    min: 1,
    max: 500,
    writePermission: "settings.edit",
  },
  {
    type: "select",
    name: "retention",
    label: text("نگهداری داده", "Data retention"),
    writePermission: "settings.edit",
    options: [
      { value: "30", label: text("۳۰ روز", "30 days") },
      { value: "90", label: text("۹۰ روز", "90 days") },
    ],
  },
  { type: "password", name: "apiKey", label: text("کلید API", "API key"), permission: "settings.secrets" },
];

/**
 * The same fields for every user: the language comes from `locale`, and what
 * the user may see and change from `can`.
 */
export function SettingsForm({
  locale,
  permissions,
  onSubmit,
}: {
  locale: "fa" | "en";
  permissions: string[];
  onSubmit: (values: Values) => void;
}) {
  return (
    <Form<Values>
      fields={fields}
      locale={locale}
      fallbackLocale="en"
      can={(permission) => permissions.includes(permission)}
      onSubmit={onSubmit}
    />
  );
}
