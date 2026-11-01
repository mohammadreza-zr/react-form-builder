# Layout

`FormBuilder` renders its fields as siblings, with no wrapper of its own. Put it in a container that wraps, such as `display: flex; flex-wrap: wrap`. The width keys of a field describe its place in that row:

| Key | Effect |
|---|---|
| `width: 240` | The field is 240px wide, capped at the row so a narrow panel does not overflow. A string (`"100%"`) is used as written |
| `width: { min: 200, max: 400 }` | The field starts at `min`, grows into the leftover space up to `max`, and wraps at `min` |
| `grow: true` | The field also takes the row's leftover space |
| `className` | A class on the element the field renders into the row |

With neither `width` nor `grow` the field is as wide as its content. `fieldLayoutStyle(width, grow)` is the function that turns these keys into a style; your components can call it.

## `break`

`{ type: "break" }` ends the row, so the next field starts a new line. The component for it is `components.break`.

## `group`

A group holds `fields`, drawn by the same builder:

```tsx
{ type: "group", title: "Address", description: "Where we send it", fields: [ … ] }
```

The component for it is `components.group`, which receives `config` and the drawn fields as `children`. `variant` is a free string that your component can read (`"card"`, `"box"`). With `inline: true` the fields are drawn inside another field's box: `inline` is `true` in the props of each of them, so they can drop their own box and put the label on the same line. `plainComponents` draws a group as a `fieldset` with a `legend`, and an inline group as a `div`.

A segmented field's `trailing` fields are drawn inline the same way, through `renderFields`.

## Two forms on one page

Fields get the id of their name. Two forms with the same field names would share ids, and a label in one would activate a control in the other. Give one of them `idScope`:

```tsx
<FormBuilder idScope="dialog" … />
```

Its fields then get the ids `dialog-<name>`. A builder drawn inside another keeps the scope of the outer one.
