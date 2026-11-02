# Dependencies

A field's `dependencies` list makes it react to the other values of the form. Each entry has a `kind` and a `when`.

## `when`

`when` is one condition, or an array of conditions that all have to hold (an empty array holds):

```tsx
{ field: "country", op: "eq", value: "IR" }
[{ field: "province", op: "filled" }, { field: "city", op: "filled" }]
```

| `op` | Holds when |
|---|---|
| `eq`, `neq` | the value is (not) strictly equal to `value` |
| `in`, `nin` | the value is (not) in the array `value` |
| `gt`, `gte`, `lt`, `lte` | the value, read as a number, is greater / less than `value`; an empty field, a boolean or text that is not a number holds none of them |
| `filled`, `empty` | the field holds a value (`0` and `false` are values; `undefined`, `null`, `""`, blank text, `NaN` and `[]` are not) / does not |
| `truthy`, `falsy` | the value is truthy / falsy |

## Kinds

| `kind` | Effect |
|---|---|
| `visible` | The field is in the form only while `when` holds. With several `visible` entries, one holding is enough |
| `disabled` | The field is disabled while `when` holds; its value is kept |
| `validate` | While `when` holds, the field takes `then`: `required`, `minLen`, `maxLen`, `min`, `max` |
| `options` | While `when` holds, `then` changes the field's options: `{ set: [...] }`, `{ keep: [values] }` or `{ remove: [values] }`. Several entries apply in order ([Options](Options)) |
| `watch` | While `when` holds, writes a value into the form (below) |

## Hidden fields go back to their default

When a `visible` rule takes a field out of the form, its value (and the values of the fields inside it) goes back to the form's starting value, so a value the user can no longer see is not submitted, and it is not validated. It is kept while the field is shown. A name that another shown field still draws is not reset. This needs `setValue`, which `Form` passes itself.

## Going back when another field changes

`resetOn: ["province"]` on a field puts it back to its starting value when the user changes `province`: the city of a province that is no longer chosen. A change of both in one pass, such as a record loaded with `reset`, keeps both.

## `watch`

```tsx
{
  kind: "watch",
  when: { field: "title", op: "filled" },
  then: { from: ({ title }) => slugify(String(title)), skipIfDirty: true },
}
```

`then` is `set: value` or `from: (values) => value`, and:

| Key | Meaning |
|---|---|
| `to` | The field to write. Defaults to the field that declares the rule |
| `onlyIfEmpty` | Skip while the target holds a value. It fills a blank; it does not follow the driver, because after the first write the target is no longer empty |
| `skipIfDirty` | Skip once the user has edited the target themselves. This is the flag for «follow the driver until I edit it». The rule's own writes do not mark the field dirty |
| `options` | react-hook-form's write options. Default: validate and mark dirty |
| `reads` (on the dependency) | Other fields `from` reads. The fields `when` tests are always available |

`from` sees only the fields `when` tests and `reads` names, so a derived value is never computed from stale state. Return plain data: a write is skipped when the target already holds a structurally equal value, so a rule that returns a new `Date` every time never settles. A hidden field's `watch` rule does not write, and no rule writes into a field that is hidden or denied.

## In an array row

In the fields of an [array](Field-Arrays), `field` names a field of the same row; a name that starts with `/` names a field of the whole form (`{ field: "/currency" }`). `from` receives the row's values by their names in the row.

All of this is subscribed narrowly: the builder watches only the names some dependency reads, so typing in a field nothing depends on re-renders that field only.
