import type { GroupProps } from "../react/adapter.js";
import { fieldLayoutStyle } from "../react/field-layout.js";

/** Ends the row it lands on, in a form laid out as a wrapping flex row. */
export function PlainBreak() {
  return <div aria-hidden="true" data-slot="form-break" style={{ flexBasis: "100%", height: 0 }} />;
}

/** A `fieldset` with a `legend`; an inline group is one line of bare fields. */
export function PlainGroup({ config, children }: GroupProps<any, any>) {
  const frame = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    ...(config.inline ? {} : { width: "100%" }),
    ...fieldLayoutStyle(config.width, undefined),
  };
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
