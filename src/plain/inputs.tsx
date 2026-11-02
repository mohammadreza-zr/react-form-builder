import type { FieldProps } from "../react/adapter.js";
import type {
  ColorField,
  CustomField,
  DateField,
  FileField,
  HiddenField,
  NumberField,
  OtpField,
  RangeField,
  SliderField,
  TextField,
  ToggleField,
} from "../react/config.js";
import {
  fromNativeDateTime,
  fromNativeDay,
  readDayValue,
  toJalaliString,
  toNativeDateTime,
  toNativeDay,
  writeDayValue,
} from "../jalali/value.js";
import { asText, controlAttributes, usePlainTexts } from "./shared.js";

/** text, password, search, email, tel, url */
export function PlainInput(props: FieldProps<TextField<any, Exclude<TextField["type"], "textarea">>>) {
  const { config, field } = props;
  return (
    <input
      {...controlAttributes(props)}
      type={config.type}
      placeholder={config.placeholder}
      minLength={config.minLen}
      maxLength={config.maxLen}
      value={asText(field.value)}
      onChange={(event) => {
        const text = event.target.value;
        field.onChange(config.normalize ? config.normalize(text) : text);
      }}
    />
  );
}

/** A number, or `undefined` while the box is empty. */
export function PlainNumber(props: FieldProps<NumberField>) {
  const { config, field } = props;
  return (
    <input
      {...controlAttributes(props)}
      type="number"
      inputMode="decimal"
      placeholder={config.placeholder}
      min={config.min}
      max={config.max}
      step={config.step}
      value={typeof field.value === "number" && Number.isFinite(field.value) ? field.value : asText(field.value)}
      onChange={(event) => {
        const text = event.target.value;
        field.onChange(text === "" ? undefined : Number(text));
      }}
    />
  );
}

export function PlainTextarea(props: FieldProps<TextField<any, "textarea">>) {
  const { config, field } = props;
  return (
    <textarea
      {...controlAttributes(props)}
      placeholder={config.placeholder}
      rows={config.rows}
      minLength={config.minLen}
      maxLength={config.maxLen}
      value={asText(field.value)}
      onChange={(event) => {
        const text = event.target.value;
        field.onChange(config.normalize ? config.normalize(text) : text);
      }}
    />
  );
}

const NATIVE_DATE_TYPE = { date: "date", time: "time", datetime: "datetime-local" } as const;

/**
 * date, time, datetime — the browser's own pickers. A day is shown in the
 * Gregorian calendar the input speaks and held the way the config says
 * (`valueFormat`), Jalali text by default; a time is held as `HH:mm` and a
 * date-time as `YYYY/MM/DD HH:mm`. A month (`picker: "month"`) is typed as
 * Jalali `YYYY/MM`.
 */
export function PlainDate(props: FieldProps<DateField>) {
  const { config, field } = props;
  const day = config as DateField<any, "date">;
  const monthly = config.type === "date" && day.picker === "month";
  const format = config.type === "date" ? (day.valueFormat ?? "text") : "text";
  const value = field.value;

  const shown =
    config.type === "time"
      ? asText(value)
      : config.type === "datetime"
        ? toNativeDateTime(asText(value))
        : monthly
          ? asText(value)
          : toNativeDay(readDayValue(value, format));

  const held = (native: string): unknown => {
    if (config.type === "time" || monthly) return native;
    if (config.type === "datetime") return fromNativeDateTime(native);
    return writeDayValue(fromNativeDay(native), format);
  };

  return (
    <input
      {...controlAttributes(props)}
      type={monthly ? "text" : NATIVE_DATE_TYPE[config.type]}
      placeholder={monthly ? "YYYY/MM" : config.placeholder}
      min={config.type === "date" && !monthly ? toNativeDay(config.minDate) || undefined : undefined}
      max={config.type === "date" && !monthly ? toNativeDay(config.maxDate) || undefined : undefined}
      value={shown}
      onChange={(event) => field.onChange(held(event.target.value))}
    />
  );
}

/** range-date, range-datetime — binds `{ from, to }`, Jalali text like the single fields. */
export function PlainRange(props: FieldProps<RangeField>) {
  const { config, field, id, disabled, readOnly, required, invalid, describedBy } = props;
  const t = usePlainTexts();
  const value = (field.value ?? {}) as { from?: string; to?: string };
  const withTime = config.type === "range-datetime";
  const end = (key: "from" | "to", label: string) => (
    <label>
      {label}
      <input
        id={key === "from" ? id : `${id}-to`}
        name={`${field.name}.${key}`}
        ref={key === "from" ? field.ref : undefined}
        type={withTime ? "datetime-local" : "date"}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={withTime ? toNativeDateTime(value[key]) : toNativeDay(value[key])}
        onBlur={field.onBlur}
        onChange={(event) => {
          const native = event.target.value;
          const day = fromNativeDay(native);
          const next = withTime ? fromNativeDateTime(native) : day ? toJalaliString(day) : "";
          field.onChange({ ...value, [key]: next });
        }}
      />
    </label>
  );
  return (
    <div role="group" aria-labelledby={config.label ? `${id}-label` : undefined} style={{ display: "flex", gap: 8, ...props.style }}>
      {end("from", config.startLabel ?? t.from)}
      {end("to", config.endLabel ?? t.to)}
    </div>
  );
}

export function PlainColor(props: FieldProps<ColorField>) {
  const { config, field } = props;
  return (
    <input
      {...controlAttributes(props)}
      type="color"
      value={asText(field.value) || config.fallback || "#000000"}
      onChange={(event) => field.onChange(event.target.value)}
    />
  );
}

export function PlainSlider(props: FieldProps<SliderField>) {
  const { config, field, id } = props;
  const value = typeof field.value === "number" ? field.value : (config.min ?? 0);
  return (
    <span style={{ display: "flex", gap: 8, ...props.style }}>
      <input
        {...controlAttributes(props)}
        style={undefined}
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(event) => field.onChange(Number(event.target.value))}
      />
      {config.showValue ? <output htmlFor={id}>{value}</output> : null}
    </span>
  );
}

/** A checkbox or a switch, with its label after the box. */
export function PlainToggle(props: FieldProps<ToggleField>) {
  const { config, field, id, required, readOnly } = props;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, ...props.style }}>
      <input
        {...controlAttributes(props)}
        style={undefined}
        type="checkbox"
        role={config.type === "switch" ? "switch" : undefined}
        aria-readonly={readOnly || undefined}
        checked={field.value === true}
        onChange={(event) => {
          if (!readOnly) field.onChange(event.target.checked);
        }}
      />
      {config.label ? (
        <label htmlFor={id}>
          {config.label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
    </span>
  );
}

/** A `File`, or a list with `multiple`; the chosen names are listed under the input. */
export function PlainFile(props: FieldProps<FileField>) {
  const { config, field } = props;
  const files = (Array.isArray(field.value) ? field.value : field.value ? [field.value] : []) as File[];
  const { readOnly, ...attributes } = controlAttributes(props);
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <input
        {...attributes}
        disabled={attributes.disabled || readOnly}
        type="file"
        accept={config.accept}
        multiple={config.multiple}
        onChange={(event) => {
          const chosen = [...(event.target.files ?? [])];
          field.onChange(config.multiple ? chosen : (chosen[0] ?? null));
        }}
      />
      {files.length ? (
        <ul data-slot="file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`}>{file.name}</li>
          ))}
        </ul>
      ) : null}
    </span>
  );
}

/** A one-time code in one box; digits only unless `numeric` is `false`. */
export function PlainOtp(props: FieldProps<OtpField>) {
  const { config, field } = props;
  const numeric = config.numeric !== false;
  return (
    <input
      {...controlAttributes(props)}
      type="text"
      inputMode={numeric ? "numeric" : "text"}
      autoComplete="one-time-code"
      maxLength={config.length}
      placeholder={config.placeholder}
      value={asText(field.value)}
      onChange={(event) => {
        const text = event.target.value;
        field.onChange(numeric ? text.replace(/\D/g, "") : text);
      }}
    />
  );
}

/** A value submitted with the form, not drawn. */
export function PlainHidden(props: FieldProps<HiddenField>) {
  const { field } = props;
  return <input type="hidden" name={field.name} value={asText(field.value)} />;
}

export function PlainCustom(props: FieldProps<CustomField>) {
  const { config, field, fieldState, id, disabled, readOnly, required } = props;
  return <>{config.render({ field, fieldState, id, label: config.label, required, disabled, readOnly })}</>;
}
