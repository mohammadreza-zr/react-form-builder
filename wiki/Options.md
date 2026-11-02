# Options

`select`, `radio`, `combobox` and `segmented` choose among options. An option is `{ value, label, description?, disabled?, icon? }`; `value` is a string or a number, and the field holds it as written (`numeric: true` turns string values into numbers).

## Fixed

```tsx
{ type: "select", name: "size", label: "Size", options: [{ value: "s", label: "Small" }, { value: "l", label: "Large" }] }
```

## Narrowed by another field

An `options` [dependency](Dependencies) changes the list while its condition holds: `{ set: [...] }` replaces it, `{ keep: [values] }` keeps those, `{ remove: [values] }` drops those. Several apply in order.

## Loaded

`loadOptions` is a function that gives the options, and `optionsDeps` the fields it reads. It runs when the field is drawn, again when one of those fields changes, and, on a `combobox`, for what the user types (after a 250 ms pause):

<!-- verbatim: examples/basic/order-form.tsx -->
```tsx
const loadCities: OptionsLoader<Values> = async ({ values }) => CITIES[String(values.country)] ?? [];
```

<!-- verbatim: examples/basic/order-form.tsx -->
```tsx
  {
    type: "select",
    name: "city",
    label: "City",
    required: true,
    loadOptions: loadCities,
    optionsDeps: ["country"],
    resetOn: ["country"],
  },
```

The loader receives `{ values, search, signal }`: the `optionsDeps` fields by name, the typed text (`""` otherwise), and an `AbortSignal` that aborts when a newer load starts or the field leaves. Pass `signal` to `fetch`.

`options` are shown until the first load ends. Two fields with the same loader and the same inputs share one request, and a field drawn again shows the answer it had; a failed load is retried on the next change. The component receives `optionsState` (`loading`, `error`, `search`, `setSearch`) to show progress and to search.

A loaded list does not clear the field's value. To clear it when the field that drives the list changes, give the field `resetOn`: `{ type: "select", name: "city", resetOn: ["country"], … }` puts the city back to its starting value whenever the user changes the country. A record loaded into the form changes both at once, and both are kept.

In an array row, `values` uses the row's names: `values.country` is the row's `country`.
