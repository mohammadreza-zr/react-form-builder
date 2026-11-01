import type { FieldProps } from "../react/adapter.js";
import type { ChoiceField, SegmentedField } from "../react/config.js";
import { FieldFrame } from "./field-frame.js";

function useBits(props: FieldProps<ChoiceField | SegmentedField, any, any>) {
  const { config, fieldState, id, inline, required } = props;
  return {
    config,
    frame: {
      config,
      id,
      inline,
      invalid: fieldState.invalid,
      error: fieldState.error?.message,
      required,
    },
  };
}

function valueOf(numeric: boolean | undefined, text: string) {
  return numeric && text !== "" ? Number(text) : text;
}

export function PlainSelect(props: FieldProps<ChoiceField<any, "select">>) {
  const { field, id, disabled, required, fieldState } = props;
  const { config, frame } = useBits(props as never);
  const typed = config as ChoiceField<any, "select">;
  const common = {
    ...(typed.inputProps ?? {}),
    name: field.name,
    ref: field.ref,
    id,
    disabled,
    required,
    "aria-invalid": fieldState.invalid,
    onBlur: field.onBlur,
  };
  const options = (typed.options ?? []).map((option) => (
    <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  ));

  if (typed.multiple) {
    const chosen = Array.isArray(field.value) ? (field.value as unknown[]).map(String) : [];
    return (
      <FieldFrame {...frame}>
        <select
          {...common}
          multiple
          value={chosen}
          onChange={(event) =>
            field.onChange(
              [...event.target.selectedOptions].map((option) => valueOf(typed.numeric, option.value)),
            )
          }
        >
          {options}
        </select>
      </FieldFrame>
    );
  }

  const current = field.value === undefined || field.value === null ? "" : String(field.value);
  return (
    <FieldFrame {...frame}>
      <select
        {...common}
        value={current}
        onChange={(event) => field.onChange(valueOf(typed.numeric, event.target.value))}
      >
        {typed.placeholder || typed.clearable || current === "" ? (
          <option value="">{typed.placeholder ?? ""}</option>
        ) : null}
        {options}
      </select>
    </FieldFrame>
  );
}

/** Radios, one per option; the label is the group's name. */
export function PlainRadio(props: FieldProps<ChoiceField<any, "radio">>) {
  const { field, id, disabled, required } = props;
  const { config, frame } = useBits(props as never);
  const typed = config as ChoiceField<any, "radio">;
  const current = field.value === undefined || field.value === null ? "" : String(field.value);
  return (
    <FieldFrame {...frame} label={false}>
      <div role="radiogroup" aria-labelledby={`${id}-label`}>
        {typed.label ? <span id={`${id}-label`}>{typed.label}</span> : null}
        {(typed.options ?? []).map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={field.name}
              id={`${id}-${option.value}`}
              value={option.value}
              disabled={disabled || option.disabled}
              required={required}
              checked={current === option.value}
              onBlur={field.onBlur}
              onChange={() => field.onChange(valueOf(typed.numeric, option.value))}
            />
            {option.label}
          </label>
        ))}
      </div>
    </FieldFrame>
  );
}

/** An on/off toggle: a checkbox with the `switch` role. */
export function PlainSwitch(props: FieldProps<ChoiceField<any, "switch">>) {
  const { field, id, disabled } = props;
  const { config, frame } = useBits(props as never);
  const typed = config as ChoiceField<any, "switch">;
  return (
    <FieldFrame {...frame} label={false}>
      <span style={{ display: "flex", gap: 4 }}>
        <input
          {...(typed.inputProps ?? {})}
          type="checkbox"
          role="switch"
          name={field.name}
          ref={field.ref}
          id={id}
          disabled={disabled}
          checked={field.value === true}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.checked)}
        />
        {typed.label ? <label htmlFor={id}>{typed.label}</label> : null}
      </span>
    </FieldFrame>
  );
}

/**
 * Segmented choices as radios; with no options a boolean checkbox. The
 * trailing fields are drawn after it, inline.
 */
export function PlainSegmented(props: FieldProps<SegmentedField<any, any>>) {
  const { field, id, disabled, renderFields } = props;
  const { config, frame } = useBits(props as never);
  const typed = config as SegmentedField<any, any>;
  const current = field.value === undefined || field.value === null ? "" : String(field.value);
  const control = typed.options?.length ? (
    <div role="radiogroup" aria-labelledby={`${id}-label`}>
      {typed.label ? <span id={`${id}-label`}>{typed.label}</span> : null}
      {typed.options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={field.name}
            value={option.value}
            disabled={disabled || option.disabled}
            checked={current === option.value}
            onBlur={field.onBlur}
            onChange={() => field.onChange(valueOf(typed.numeric, option.value))}
          />
          {option.label}
        </label>
      ))}
    </div>
  ) : (
    <label>
      <input
        type="checkbox"
        name={field.name}
        id={id}
        disabled={disabled}
        checked={field.value === true}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.checked)}
      />
      {typed.label}
    </label>
  );
  return (
    <FieldFrame {...frame} label={false}>
      {control}
      {typed.trailing?.length ? renderFields(typed.trailing, { inline: true }) : null}
    </FieldFrame>
  );
}
