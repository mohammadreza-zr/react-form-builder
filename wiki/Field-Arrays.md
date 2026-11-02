# Field arrays

An `array` field holds a list of rows. Each row has the same `fields`, named relative to the row:

<!-- verbatim: examples/basic/order-form.tsx -->
```tsx
  {
    type: "array",
    name: "lines",
    label: "Lines",
    minRows: 1,
    maxRows: 10,
    columns: 3,
    colSpan: "full",
    fields: [
      { type: "text", name: "product", label: "Product", required: true },
      { type: "number", name: "quantity", label: "Quantity", required: true, min: 1 },
      { type: "checkbox", name: "gift", label: "Gift wrap" },
      {
        type: "textarea",
        name: "message",
        label: "Gift message",
        colSpan: "full",
        dependencies: [{ kind: "visible", when: { field: "gift", op: "truthy" } }],
      },
    ],
  },
```

In the first row `product` is `lines.0.product`. The form holds `lines: [{ product, quantity, gift, message }, …]`.

| Key | Meaning |
|---|---|
| `fields` | The fields of each row |
| `minRows`, `maxRows` | Row limits. A `Form` starts with `minRows` rows; remove and add stop at the limits, and submitting checks them |
| `required` | At least one row |
| `addLabel`, `removeLabel` | Button texts. The plain ones say Add / Remove, in the form's language |
| `sortable` | Rows can move up and down |
| `columns` | The grid of each row ([Layout](Layout)) |
| `newRow()` | A new row's values. Default: its fields' starting values |
| `validate(rows, values)` | A rule of the whole list |

## Inside a row

Rules in a row read the row: `{ field: "gift" }` above is the row's own `gift`. A name that starts with `/` names a field of the whole form:

```tsx
{ type: "text", name: "vat", label: "VAT", dependencies: [{ kind: "visible", when: { field: "/business", op: "truthy" } }] }
```

A `watch` rule's `from` and an options loader receive the row's values by their relative names. Every other feature works in a row as on the form: validation, access, language, defaults, groups, and arrays inside arrays.

## The component

The array is drawn by `components.array`, which receives `rows` (each with `key`, `index`, `children`, `remove`, `canRemove`, and `moveUp`/`moveDown` when it can move), `append`, `canAppend`, `error` (the row limits' message), `required`, `disabled` and `style`. The rows' fields are already drawn in `children`. The plain array is a `fieldset` with a button per row and an Add button.
