import type { ReactNode } from "react";

import { fieldLayoutStyle } from "../react/field-layout.js";
import type { FieldWidth } from "../react/config.js";

/** The box every plain field sits in: layout, label, description and error. */
export function FieldFrame({
  config,
  id,
  label = true,
  inline,
  invalid,
  error,
  required,
  children,
}: {
  config: {
    label?: string;
    description?: string;
    width?: FieldWidth;
    grow?: boolean;
    className?: string;
  };
  id: string;
  /** `false` when the control draws its own label (a checkbox). */
  label?: boolean;
  inline: boolean;
  invalid: boolean;
  error?: string;
  required: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="field"
      data-invalid={invalid || undefined}
      data-inline={inline || undefined}
      style={{
        display: "flex",
        flexDirection: inline ? "row" : "column",
        gap: 4,
        ...fieldLayoutStyle(config.width, config.grow),
      }}
      className={config.className}
    >
      {label && config.label ? (
        <label htmlFor={id}>
          {config.label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      {children}
      {config.description ? <small>{config.description}</small> : null}
      {invalid && error ? <span role="alert">{error}</span> : null}
    </div>
  );
}
