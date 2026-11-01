import { createContext, useContext } from "react";

/**
 * Set by a `FormBuilder` given an `idScope`: the prefix its fields put before
 * their element ids. Two forms with the same field names on one page would
 * otherwise share ids, and a label in one would activate the control in the
 * other.
 */
export const FieldIdScopeContext = createContext("");

/** The element id of the field called `name`, within the form's scope. */
export function useFieldId(name: string): string {
  const scope = useContext(FieldIdScopeContext);
  return scope ? `${scope}-${name}` : name;
}

/**
 * Set while a field is drawn inside another field's box (a segmented field's
 * trailing slot, an `inline` group): adapters then drop their own box and put
 * the label on the same line as the control.
 */
export const InlineFieldContext = createContext(false);

export function useInlineField(): boolean {
  return useContext(InlineFieldContext);
}
