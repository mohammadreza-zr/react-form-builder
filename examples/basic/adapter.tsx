import { type FieldPropsOf, type WrapperProps, createFormBuilder } from "@mrzr/react-form-builder";

/** The one place a project draws a field's label, help and error. */
function Field({ config, id, label, required, error, style, children }: WrapperProps) {
  return (
    <div className="field" style={style}>
      {label === "wrapper" && config.label ? (
        <label htmlFor={id}>
          {config.label}
          {required ? " *" : ""}
        </label>
      ) : null}
      {children}
      {config.description ? <p className="field-help">{config.description}</p> : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** `text` with an `icon` key the package does not have. */
function IconText({ config, field, id, describedBy, invalid }: FieldPropsOf<"text", { text: { icon?: string } }>) {
  return (
    <span className="input">
      {config.icon}
      <input
        id={id}
        name={field.name}
        ref={field.ref}
        value={(field.value as string | undefined) ?? ""}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
        placeholder={config.placeholder}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    </span>
  );
}

/** A field type of the project's own: `rating`, with a `max`. */
function Rating({ config, field, id }: FieldPropsOf<"rating", { rating: { max: number } }>) {
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

export const { Form, FormBuilder, defineFields } = createFormBuilder({
  components: {
    wrapper: Field,
    fields: { text: IconText, rating: { component: Rating, label: "none" } },
  },
  defaults: { select: { clearable: true } },
  messages: { required: { en: "Please fill in {label}.", fa: "{label} را پر کنید." } },
});
