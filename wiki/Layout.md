# Layout

A builder draws its fields inside `components.layout`. The plain one is a wrapping row, or a grid when the builder has `columns`.

## A grid

```tsx
<Form columns={3} fields={fields} … />
```

Each field takes one column; `colSpan: 2` takes two, and `colSpan: "full"` the whole row. A group (`columns` on the group) and an array (`columns` on the array, for each row) have grids of their own.

## A wrapping row

Without `columns`, the width keys of a field describe its place in the row:

| Key | Effect |
|---|---|
| `width: 240` | The field is 240px wide, capped at the row so a narrow panel does not overflow. A string (`"100%"`) is used as written |
| `width: { min: 200, max: 400 }` | The field starts at `min`, grows into the leftover space up to `max`, and wraps at `min` |
| `grow: true` | The field also takes the row's leftover space |

The plain wrapper gives a field with neither a whole row. `fieldLayoutStyle(width, grow)` turns these keys into a style.

The builder computes a field's place and hands it to the wrapper as `style` (or to the field component, when it is drawn without a wrapper). `className` is a class on the wrapper.

## `break`

`{ type: "break" }` ends the row, so the next field starts a new line. The component for it is `components.break`.

## `group`

A group holds `fields`, drawn by the same builder:

```tsx
{ type: "group", title: "Address", description: "Where we send it", columns: 2, fields: [ … ] }
```

The component for it is `components.group`, which receives `config`, `style` and the drawn fields as `children`. `variant` is a free string that your component can read (`"card"`, `"box"`). With `inline: true` the fields are drawn inside another field's box: `inline` is `true` in the props of each of them, so they can drop their own box and put the label on the same line. A group with a `permission` the user lacks leaves the form. The plain group is a `fieldset` with a `legend`, and an inline group a `div`.

A segmented field's `trailing` fields are drawn inline the same way, through `renderFields`.

## Two forms on one page

Fields get the id of their name. Two forms with the same field names would share ids, and a label in one would activate a control in the other. Give one of them `idScope`:

```tsx
<FormBuilder idScope="dialog" … />
```

Its fields then get the ids `dialog-<name>`. A builder drawn inside another keeps the scope of the outer one.
