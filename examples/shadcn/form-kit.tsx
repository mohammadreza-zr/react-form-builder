import {
  type ActionsProps,
  type FieldPropsOf,
  type WrapperProps,
  createFormBuilder,
} from "@mrzr/react-form-builder";

import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { cn } from "./lib/utils";

/** Label, control, help and error of every field, in shadcn/ui's form layout. */
function Field({ config, id, label, required, error, style, children }: WrapperProps) {
  return (
    <div data-slot="form-item" className={cn("grid gap-2", config.className)} style={style}>
      {label === "wrapper" && config.label ? (
        <Label htmlFor={id} className={cn(error && "text-destructive")}>
          {config.label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {config.description ? (
        <p id={`${id}-description`} className="text-muted-foreground text-sm">
          {config.description}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** text, email, password, tel, url */
function TextInput({ config, field, id, describedBy, invalid, disabled, readOnly }: FieldPropsOf<"text">) {
  return (
    <Input
      id={id}
      name={field.name}
      ref={field.ref}
      type={config.type}
      value={(field.value as string | undefined) ?? ""}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
      placeholder={config.placeholder}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}

function NumberInput({ config, field, id, describedBy, invalid, disabled, readOnly }: FieldPropsOf<"number">) {
  return (
    <Input
      id={id}
      name={field.name}
      ref={field.ref}
      type="number"
      value={typeof field.value === "number" ? field.value : ""}
      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
      onBlur={field.onBlur}
      min={config.min}
      max={config.max}
      step={config.step}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}

function TextareaInput({ config, field, id, describedBy, invalid, disabled, readOnly }: FieldPropsOf<"textarea">) {
  return (
    <Textarea
      id={id}
      name={field.name}
      ref={field.ref}
      rows={config.rows}
      value={(field.value as string | undefined) ?? ""}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
      placeholder={config.placeholder}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      disabled={disabled}
      readOnly={readOnly}
    />
  );
}

/** Radix's select speaks text: the chosen option's own value goes back to the form. */
function SelectInput({ config, field, id, invalid, disabled, options, optionsState }: FieldPropsOf<"select">) {
  const value = field.value === undefined || field.value === null || field.value === "" ? undefined : String(field.value);
  return (
    <Select
      name={field.name}
      value={value}
      disabled={disabled}
      onOpenChange={(open) => open && optionsState.open()}
      onValueChange={(next) => field.onChange(options.find((option) => String(option.value) === next)?.value ?? next)}
    >
      <SelectTrigger id={id} ref={field.ref} onBlur={field.onBlur} aria-invalid={invalid} className="w-full">
        <SelectValue placeholder={config.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** A checkbox draws its own label, beside the box. */
function CheckboxInput({ config, field, id, invalid, disabled, required }: FieldPropsOf<"checkbox">) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        name={field.name}
        ref={field.ref}
        checked={field.value === true}
        onCheckedChange={(checked) => field.onChange(checked === true)}
        onBlur={field.onBlur}
        aria-invalid={invalid}
        disabled={disabled}
      />
      {config.label ? (
        <Label htmlFor={id}>
          {config.label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      ) : null}
    </div>
  );
}

/** The submit button, in shadcn/ui's default button style. */
function Actions({ submitLabel, submitting }: ActionsProps) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-xs disabled:pointer-events-none disabled:opacity-50"
    >
      {submitLabel}
    </button>
  );
}

/** The forms of a shadcn/ui project. A type left out here is drawn with native HTML. */
export const { Form, FormBuilder, defineFields } = createFormBuilder({
  components: {
    wrapper: Field,
    actions: Actions,
    fields: {
      text: TextInput,
      email: TextInput,
      password: TextInput,
      tel: TextInput,
      url: TextInput,
      number: NumberInput,
      textarea: TextareaInput,
      select: SelectInput,
      checkbox: { component: CheckboxInput, label: "control" },
    },
  },
});
