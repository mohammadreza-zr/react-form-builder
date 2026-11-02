import type { Condition, Dependency, FieldNode, WatchSnapshot } from "./types.js";

/**
 * A name inside an array row, made absolute. Row fields and the conditions
 * between them name each other relative to the row (`"price"`); a name that
 * starts with `/` names a field of the whole form (`"/currency"`).
 */
export function prefixName(name: string, prefix: string): string {
  if (name.startsWith("/")) return name.slice(1);
  return prefix ? `${prefix}.${name}` : name;
}

/**
 * The values a row's function receives, keyed the way the row names them:
 * a row field by its relative name, a form field by its own.
 */
function relativeValues(values: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const start = `${prefix}.`;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    out[key.startsWith(start) ? key.slice(start.length) : key] = value;
  }
  return out;
}

function prefixCondition(condition: Condition, prefix: string): Condition {
  return { ...condition, field: prefixName(condition.field, prefix) };
}

function prefixDependency(dependency: Dependency, prefix: string): Dependency {
  const when = Array.isArray(dependency.when)
    ? dependency.when.map((condition) => prefixCondition(condition, prefix))
    : prefixCondition(dependency.when, prefix);
  if (dependency.kind !== "watch") return { ...dependency, when } as Dependency;
  const { then } = dependency;
  const from = "from" in then && typeof then.from === "function" ? then.from : undefined;
  return {
    ...dependency,
    when,
    reads: dependency.reads?.map((name) => prefixName(name, prefix)),
    then: {
      ...then,
      to: then.to === undefined ? undefined : prefixName(then.to, prefix),
      ...(from && {
        from: (values: WatchSnapshot) => from(relativeValues(values as Record<string, unknown>, prefix)),
      }),
    },
  } as Dependency;
}

/**
 * The fields of one array row with their names, conditions, watch targets and
 * option inputs made absolute under `prefix` (`"items.0"`). A nested array's
 * own name is prefixed; its row fields stay relative, for its own rows.
 */
export function prefixFields<F extends FieldNode>(fields: F[], prefix: string): F[] {
  return fields.map((field) => {
    const record = field as FieldNode & {
      loadOptions?: (context: { values: Record<string, unknown> }) => unknown;
    };
    const next: Record<string, unknown> = { ...(field as object) };
    if (field.name) next.name = prefixName(field.name, prefix);
    if (field.dependencies) next.dependencies = field.dependencies.map((dep) => prefixDependency(dep, prefix));
    if (field.optionsDeps) next.optionsDeps = field.optionsDeps.map((name) => prefixName(name, prefix));
    if (field.resetOn) next.resetOn = field.resetOn.map((name) => prefixName(name, prefix));
    if (typeof record.loadOptions === "function") {
      const load = record.loadOptions;
      next.loadOptions = (context: { values: Record<string, unknown> }) =>
        load({ ...context, values: relativeValues(context.values, prefix) });
    }
    if (field.type === "group" && field.fields) next.fields = prefixFields(field.fields, prefix);
    if (field.trailing) next.trailing = prefixFields(field.trailing, prefix);
    return next as F;
  });
}
