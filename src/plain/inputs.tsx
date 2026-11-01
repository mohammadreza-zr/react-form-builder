import type { ComponentType } from "react";

import type { FieldProps } from "../react/adapter.js";
import type {
  CheckboxField,
  ColorField,
  CustomField,
  DateField,
  RangeField,
  SliderField,
  TextField,
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
import { FieldFrame } from "./field-frame.js";

type Any = Record<string, unknown>;

/** `inputProps` go on the element first; what the form owns is set after them. */
function extra(config: { inputProps?: Any }): Any {
  return config.inputProps ?? {};
}

function Frame({
  p,
  label,
  children,
}: {
  p: FieldProps<any, any, any>;
  label?: boolean;
  children: React.ReactNode;
}) {
  const { config, fieldState, id, inline, required } = p;
  return (
    <FieldFrame
      config={config as never}
      id={id}
      label={label}
      inline={inline}
      invalid={fieldState.invalid}
      error={fieldState.error?.message}
      required={required}
    >
      {children}
    </FieldFrame>
  );
}

/** text, password, search, number */
export function PlainInput(props: FieldProps<TextField<any, "text" | "password" | "search" | "number">>) {
  const { config, field, fieldState, id, disabled, required } = props;
  const isNumber = config.type === "number";
  return (
    <Frame p={props}>
      <input
        {...extra(config)}
        name={field.name}
        ref={field.ref}
        id={id}
        type={config.type}
        placeholder={config.placeholder}
        disabled={disabled}
        required={required}
        minLength={config.minLen}
        maxLength={config.maxLen}
        min={config.min}
        max={config.max}
        aria-invalid={fieldState.invalid}
        value={(field.value as string | number | null | undefined) ?? ""}
        onBlur={field.onBlur}
        onChange={(event) => {
          const text = event.target.value;
          if (isNumber) return field.onChange(text === "" ? "" : +text);
          field.onChange(config.normalize ? config.normalize(text) : text);
        }}
      />
    </Frame>
  );
}

export function PlainTextarea(props: FieldProps<TextField<any, "textarea">>) {
  const { config, field, fieldState, id, disabled, required } = props;
  return (
    <Frame p={props}>
      <textarea
        {...extra(config)}
        name={field.name}
        ref={field.ref}
        id={id}
        placeholder={config.placeholder}
        disabled={disabled}
        required={required}
        minLength={config.minLen}
        maxLength={config.maxLen}
        aria-invalid={fieldState.invalid}
        value={(field.value as string | null | undefined) ?? ""}
        onBlur={field.onBlur}
        onChange={(event) => {
          const text = event.target.value;
          field.onChange(config.normalize ? config.normalize(text) : text);
        }}
      />
    </Frame>
  );
}

const NATIVE_DATE_TYPE = { date: "date", time: "time", datetime: "datetime-local" } as const;

/**
 * date, time, datetime — the browser's own pickers. A day is shown in the
 * Gregorian calendar the input speaks and held the way the config says
 * (`valueFormat`), Jalali by default; a time is held as `HH:mm` and a
 * date-time as `YYYY/MM/DD HH:mm`.
 */
export function PlainDate(props: FieldProps<DateField>) {
  const { config, field, fieldState, id, disabled, required } = props;
  const day = config as DateField<any, "date">;
  const monthly = config.type === "date" && day.picker === "month";
  const format = config.type === "date" ? (day.valueFormat ?? "text") : "text";
  const value = field.value;

  const shown =
    config.type === "time"
      ? ((value as string | null | undefined) ?? "")
      : config.type === "datetime"
        ? toNativeDateTime(value as string | null | undefined)
        : monthly
          ? ((value as string | null | undefined) ?? "")
          : toNativeDay(readDayValue(value, format));

  const held = (native: string): unknown => {
    if (config.type === "time") return native;
    if (config.type === "datetime") return fromNativeDateTime(native);
    if (monthly) return native;
    return writeDayValue(fromNativeDay(native), format);
  };

  return (
    <Frame p={props}>
      <input
        {...extra(config)}
        name={field.name}
        ref={field.ref}
        id={id}
        type={monthly ? "text" : NATIVE_DATE_TYPE[config.type]}
        placeholder={monthly ? "YY/MM" : config.placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={fieldState.invalid}
        value={shown}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(held(event.target.value))}
      />
    </Frame>
  );
}

/** range-date, range-datetime — binds `{ from, to }`, Jalali text like the single fields. */
export function PlainRange(props: FieldProps<RangeField>) {
  const { config, field, fieldState, id, disabled, required } = props;
  const value = (field.value ?? {}) as { from?: string; to?: string };
  const withTime = config.type === "range-datetime";
  const end = (key: "from" | "to", label: string) => (
    <label>
      {label}
      <input
        id={key === "from" ? id : `${id}-to`}
        name={`${field.name}.${key}`}
        type={withTime ? "datetime-local" : "date"}
        disabled={disabled}
        required={required}
        aria-invalid={fieldState.invalid}
        value={withTime ? toNativeDateTime(value[key]) : toNativeDay(value[key])}
        onBlur={field.onBlur}
        onChange={(event) => {
          const native = event.target.value;
          const next = withTime
            ? fromNativeDateTime(native)
            : ((jalali) => (jalali ? toJalaliString(jalali) : ""))(fromNativeDay(native));
          field.onChange({ ...value, [key]: next });
        }}
      />
    </label>
  );
  return (
    <Frame p={props} label={false}>
      {config.label ? <span>{config.label}</span> : null}
      {end("from", config.startLabel ?? "From")}
      {end("to", config.endLabel ?? "To")}
    </Frame>
  );
}

export function PlainColor(props: FieldProps<ColorField>) {
  const { config, field, fieldState, id, disabled } = props;
  return (
    <Frame p={props}>
      <input
        {...extra(config)}
        name={field.name}
        ref={field.ref}
        id={id}
        type="color"
        disabled={disabled}
        aria-invalid={fieldState.invalid}
        value={(field.value as string) || config.fallback || "#000000"}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
      />
    </Frame>
  );
}

export function PlainSlider(props: FieldProps<SliderField>) {
  const { config, field, fieldState, id, disabled } = props;
  const value = typeof field.value === "number" ? field.value : (config.min ?? 0);
  return (
    <Frame p={props}>
      <input
        {...extra(config)}
        name={field.name}
        ref={field.ref}
        id={id}
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        disabled={disabled}
        aria-invalid={fieldState.invalid}
        value={value}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(+event.target.value)}
      />
      {config.showValue ? <output htmlFor={id}>{value}</output> : null}
    </Frame>
  );
}

/** A checkbox draws its own label, after the box. */
export function PlainCheckbox(props: FieldProps<CheckboxField>) {
  const { config, field, fieldState, id, disabled, required } = props;
  return (
    <Frame p={props} label={false}>
      <span style={{ display: "flex", gap: 4 }}>
        <input
          {...extra(config)}
          name={field.name}
          ref={field.ref}
          id={id}
          type="checkbox"
          disabled={disabled}
          aria-invalid={fieldState.invalid}
          checked={field.value === true}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.checked)}
        />
        {config.label ? (
          <label htmlFor={id}>
            {config.label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </label>
        ) : null}
      </span>
    </Frame>
  );
}

export function PlainCustom(props: FieldProps<CustomField>) {
  const { config, field, fieldState, disabled, required } = props;
  return (
    <Frame p={props}>
      {config.render({ field, fieldState, label: config.label, required, disabled })}
    </Frame>
  );
}

export type PlainComponent = ComponentType<any>;
