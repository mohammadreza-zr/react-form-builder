import type {
  ActionsProps,
  ArrayProps,
  GroupProps,
  LayoutProps,
  WrapperProps,
} from "../react/adapter.js";
import { usePlainTexts } from "./shared.js";

/**
 * Label, control, help and error, in that order. A field with no place of its
 * own takes the whole row.
 */
export function PlainWrapper({ config, id, label, required, invalid, error, inline, style, children }: WrapperProps) {
  const mark = required ? <span aria-hidden="true"> *</span> : null;
  const help = config.description || config.hint;
  return (
    <div
      data-slot="field"
      data-invalid={invalid || undefined}
      data-inline={inline || undefined}
      className={config.className}
      style={{
        display: "flex",
        flexDirection: inline ? "row" : "column",
        alignItems: inline ? "center" : undefined,
        gap: 4,
        ...(style ?? (inline ? undefined : { flexBasis: "100%" })),
      }}
    >
      {config.label && label === "wrapper" ? (
        <label htmlFor={id}>
          {config.label}
          {mark}
        </label>
      ) : null}
      {config.label && label === "group" ? (
        <span id={`${id}-label`}>
          {config.label}
          {mark}
        </span>
      ) : null}
      {children}
      {help ? (
        <small id={`${id}-description`}>
          {config.description}
          {config.description && config.hint ? " " : null}
          {config.hint}
        </small>
      ) : null}
      {invalid && error ? (
        <span role="alert" id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

/** A wrapping row of fields, or a grid of `columns`. */
export function PlainLayout({ columns, inline, children }: LayoutProps) {
  const style = columns
    ? { display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 12 }
    : inline
      ? { display: "flex", alignItems: "center", gap: 8 }
      : { display: "flex", flexWrap: "wrap" as const, alignItems: "flex-start", gap: 12 };
  return (
    <div data-slot="field-list" style={{ ...style, width: inline ? undefined : "100%" }}>
      {children}
    </div>
  );
}

/** Ends the row it lands on. */
export function PlainBreak() {
  return <div aria-hidden="true" data-slot="form-break" style={{ flexBasis: "100%", height: 0 }} />;
}

/** A `fieldset` with a `legend`; an inline group is one line of bare fields. */
export function PlainGroup({ config, children, style }: GroupProps<any, any>) {
  const frame = { ...(config.inline ? {} : { flexBasis: "100%" }), ...style };
  if (config.inline) {
    return (
      <div data-slot="field-group" style={frame} className={config.className}>
        {children}
      </div>
    );
  }
  return (
    <fieldset data-slot="field-group" style={frame} className={config.className}>
      {config.title ? <legend>{config.title}</legend> : null}
      {config.description ? <p>{config.description}</p> : null}
      {children}
    </fieldset>
  );
}

/** Rows with remove (and move) buttons, then an add button. */
export function PlainArray({ config, id, rows, append, canAppend, required, error, style }: ArrayProps<any, any>) {
  const t = usePlainTexts();
  return (
    <fieldset data-slot="field-array" id={id} style={{ flexBasis: "100%", ...style }} className={config.className}>
      {config.label ? (
        <legend>
          {config.label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </legend>
      ) : null}
      {config.description ? <p>{config.description}</p> : null}
      {rows.map((row) => (
        <div key={row.key} data-slot="array-row" style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ flex: 1 }}>{row.children}</div>
          {row.moveUp ? (
            <button type="button" onClick={row.moveUp} aria-label={t.up}>
              ↑
            </button>
          ) : null}
          {row.moveDown ? (
            <button type="button" onClick={row.moveDown} aria-label={t.down}>
              ↓
            </button>
          ) : null}
          <button type="button" onClick={row.remove} disabled={!row.canRemove}>
            {config.removeLabel ?? t.remove}
          </button>
        </div>
      ))}
      {error ? <span role="alert">{error}</span> : null}
      <button type="button" onClick={append} disabled={!canAppend}>
        {config.addLabel ?? t.add}
      </button>
    </fieldset>
  );
}

/** Submit, and reset when it has a label. */
export function PlainActions({ submitLabel, resetLabel, submitting, dirty, onReset }: ActionsProps) {
  return (
    <div data-slot="form-actions" style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <button type="submit" disabled={submitting}>
        {submitLabel}
      </button>
      {resetLabel ? (
        <button type="button" onClick={onReset} disabled={!dirty || submitting}>
          {resetLabel}
        </button>
      ) : null}
    </div>
  );
}
