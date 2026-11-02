import { type KeyboardEvent, useEffect, useState } from "react";

import type { FieldProps } from "../react/adapter.js";
import type {
  ComboboxField,
  RadioField,
  SegmentedField,
  SelectField,
  TagsField,
} from "../react/config.js";
import { asText, controlAttributes, usePlainTexts, valueFor } from "./shared.js";

export function PlainSelect(props: FieldProps<SelectField>) {
  const { config, field, options, readOnly, optionsState } = props;
  const t = usePlainTexts();
  const attributes = { ...controlAttributes(props), readOnly: undefined, "aria-readonly": readOnly || undefined };
  const drawn = options.map((option) => (
    <option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
      {option.label}
    </option>
  ));

  if (config.multiple) {
    const chosen = Array.isArray(field.value) ? (field.value as unknown[]).map(asText) : [];
    return (
      <select
        {...attributes}
        multiple
        value={chosen}
        onChange={(event) => {
          if (readOnly) return;
          field.onChange([...event.target.selectedOptions].map((option) => valueFor(options, option.value, config.numeric)));
        }}
      >
        {drawn}
      </select>
    );
  }

  const current = asText(field.value);
  return (
    <select
      {...attributes}
      value={current}
      onChange={(event) => {
        if (readOnly) return;
        const text = event.target.value;
        field.onChange(text === "" ? "" : valueFor(options, text, config.numeric));
      }}
    >
      {config.placeholder || config.clearable || current === "" ? (
        <option value="">{optionsState.loading ? t.loading : (config.placeholder ?? "")}</option>
      ) : null}
      {drawn}
    </select>
  );
}

/** Radios, one per option, labelled by the wrapper's caption. */
export function PlainRadio(props: FieldProps<RadioField>) {
  const { config, field, id, disabled, readOnly, required, invalid, options, style } = props;
  const current = asText(field.value);
  return (
    <div role="radiogroup" aria-labelledby={config.label ? `${id}-label` : undefined} aria-invalid={invalid || undefined} style={style}>
      {options.map((option, index) => (
        <label key={String(option.value)}>
          <input
            type="radio"
            name={field.name}
            id={`${id}-${String(option.value)}`}
            ref={index === 0 ? field.ref : undefined}
            value={String(option.value)}
            disabled={disabled || option.disabled}
            required={required}
            checked={current === String(option.value)}
            onBlur={field.onBlur}
            onChange={() => {
              if (!readOnly) field.onChange(valueFor(options, String(option.value), config.numeric));
            }}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/**
 * Segmented choices as radios; with no options a boolean checkbox. The
 * trailing fields are drawn after it, inline.
 */
export function PlainSegmented(props: FieldProps<SegmentedField<any, any>>) {
  const { config, field, id, disabled, readOnly, options, renderFields, style } = props;
  const current = asText(field.value);
  const control = options.length ? (
    <div role="radiogroup" aria-labelledby={config.label ? `${id}-label` : undefined}>
      {options.map((option, index) => (
        <label key={String(option.value)}>
          <input
            type="radio"
            name={field.name}
            id={index === 0 ? id : undefined}
            ref={index === 0 ? field.ref : undefined}
            value={String(option.value)}
            disabled={disabled || option.disabled}
            checked={current === String(option.value)}
            onBlur={field.onBlur}
            onChange={() => {
              if (!readOnly) field.onChange(valueFor(options, String(option.value), config.numeric));
            }}
          />
          {option.label}
        </label>
      ))}
    </div>
  ) : (
    <input
      type="checkbox"
      name={field.name}
      id={id}
      ref={field.ref}
      aria-labelledby={config.label ? `${id}-label` : undefined}
      disabled={disabled}
      checked={field.value === true}
      onBlur={field.onBlur}
      onChange={(event) => {
        if (!readOnly) field.onChange(event.target.checked);
      }}
    />
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, ...style }}>
      {control}
      {config.trailing?.length ? renderFields(config.trailing, { inline: true }) : null}
    </div>
  );
}

/**
 * A searchable choice: a text input with the options as suggestions. With
 * `multiple` the chosen values are listed with a remove button each, and
 * Enter adds what is typed; `creatable` keeps a text that is not an option.
 */
export function PlainCombobox(props: FieldProps<ComboboxField>) {
  const { config, field, id, options, optionsState, disabled, readOnly } = props;
  const t = usePlainTexts();
  const listId = `${id}-options`;
  const labelOf = (value: unknown) =>
    options.find((option) => String(option.value) === asText(value))?.label ?? asText(value);
  const chosen = config.multiple ? (Array.isArray(field.value) ? (field.value as unknown[]) : []) : [];
  const [text, setText] = useState(() => (config.multiple ? "" : labelOf(field.value)));

  // A single choice shows the label of the value the form holds, also when it changes from outside.
  const shown = config.multiple ? null : labelOf(field.value);
  useEffect(() => {
    if (shown !== null) setText(shown);
  }, [shown]);

  const match = (typed: string): unknown => {
    const trimmed = typed.trim();
    const option = options.find((candidate) => candidate.label === trimmed || String(candidate.value) === trimmed);
    if (option) return valueFor(options, String(option.value), config.numeric);
    return config.creatable && trimmed ? trimmed : undefined;
  };

  const type = (typed: string) => {
    setText(typed);
    optionsState.setSearch(typed);
    if (config.multiple) return;
    if (typed === "") return field.onChange("");
    const value = match(typed);
    if (value !== undefined) field.onChange(value);
  };

  const add = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!config.multiple || event.key !== "Enter") return;
    event.preventDefault();
    const value = match(text);
    if (value === undefined || chosen.some((item) => asText(item) === asText(value))) return;
    field.onChange([...chosen, value]);
    setText("");
  };

  const attributes = controlAttributes(props);
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 4, ...props.style }}>
      {config.multiple && chosen.length ? (
        <ul data-slot="chosen" style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: 0, padding: 0, listStyle: "none" }}>
          {chosen.map((value) => (
            <li key={asText(value)}>
              {labelOf(value)}
              <button
                type="button"
                aria-label={`${t.remove} ${labelOf(value)}`}
                disabled={disabled || readOnly}
                onClick={() => field.onChange(chosen.filter((item) => item !== value))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        {...attributes}
        style={undefined}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={false}
        aria-busy={optionsState.loading || undefined}
        list={listId}
        placeholder={config.placeholder}
        value={text}
        onChange={(event) => type(event.target.value)}
        onKeyDown={add}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={String(option.value)} value={option.label} disabled={option.disabled} />
        ))}
      </datalist>
      {text && !optionsState.loading && options.length === 0 ? <small>{config.emptyText ?? t.empty}</small> : null}
    </span>
  );
}

/** Free texts: Enter or a comma adds what is typed, Backspace on an empty box removes the last. */
export function PlainTags(props: FieldProps<TagsField>) {
  const { config, field, disabled, readOnly } = props;
  const t = usePlainTexts();
  const tags = Array.isArray(field.value) ? (field.value as string[]) : [];
  const [text, setText] = useState("");

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const tag = text.trim();
      if (tag && !tags.includes(tag)) field.onChange([...tags, tag]);
      setText("");
    } else if (event.key === "Backspace" && text === "" && tags.length) {
      field.onChange(tags.slice(0, -1));
    }
  };

  return (
    <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, ...props.style }}>
      {tags.map((tag) => (
        <span key={tag} data-slot="tag">
          {tag}
          <button
            type="button"
            aria-label={`${t.remove} ${tag}`}
            disabled={disabled || readOnly}
            onClick={() => field.onChange(tags.filter((item) => item !== tag))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        {...controlAttributes(props)}
        style={undefined}
        type="text"
        placeholder={config.placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </span>
  );
}
