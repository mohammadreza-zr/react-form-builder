import type { FieldPropsOf, FormComponents } from "@mrzr/react-form-builder";
import type { FieldValues } from "react-hook-form";

import { plainComponents } from "@mrzr/react-form-builder/plain";

/** What this project adds to the field types: an `icon` on `text`, and a `rating` field. */
export type Extras = {
  text: { icon?: string };
  rating: { max: number };
};

function IconText({ config, field, id, fieldState }: FieldPropsOf<"text", Extras>) {
  return (
    <label htmlFor={id}>
      {config.icon} {config.label}
      <input
        {...field}
        id={id}
        value={(field.value as string | undefined) ?? ""}
        placeholder={config.placeholder}
        aria-invalid={fieldState.invalid}
      />
    </label>
  );
}

function Rating({ config, field, id }: FieldPropsOf<"rating", Extras>) {
  return (
    <div id={id} role="radiogroup" aria-label={config.label}>
      {Array.from({ length: config.max }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-pressed={field.value === index + 1}
          onClick={() => field.onChange(index + 1)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}

export const components: FormComponents<FieldValues, Extras> = {
  ...plainComponents,
  fields: { ...plainComponents.fields, text: IconText, rating: Rating },
};
