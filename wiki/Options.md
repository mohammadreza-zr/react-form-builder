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

The loader receives `{ values, search, page, signal }`: the `optionsDeps` fields by name, the typed text (`""` otherwise), the page from 1, and an `AbortSignal` that aborts when no field waits for the answer any more. Pass `signal` to `fetch`. It returns the options, or one page of them:

```tsx
const loadPeople: OptionsLoader<Values> = async ({ search, page, signal }) => {
  const response = await fetch(`/api/people?q=${encodeURIComponent(search)}&page=${page}`, { signal });
  const { items, next, count } = await response.json();
  return { options: items.map((p: Person) => ({ value: p.id, label: p.name })), hasMore: Boolean(next), total: count };
};
```

| Key | Meaning |
|---|---|
| `loadOptions` | The loader |
| `optionsDeps` | Fields the loader reads; a change loads again |
| `optionsKey` | Anything else the loader reads (an id from the page); a change loads again |
| `loadOn` | `"mount"` (default) loads when the field is drawn; `"open"` waits for the component to call `optionsState.open()`, so a long form with many lists sends no request until one is opened |
| `searchDelay` | How long a typed search waits for the next keystroke. Default 250 ms |

`options` are shown until the first load ends; while a new search loads, the last list stays. Pages are joined into one list, each value once. Two fields with the same loader and the same inputs share one request, a field drawn again shows the answer it had, and a failed load is tried again on the next change or on `retry()`.

The component receives `optionsState`: `loading`, `loadingMore`, `error`, `hasMore`, `total`, `search`, and `setSearch(text)`, `loadMore()`, `open()`, `retry()`. A list that scrolls calls `loadMore()` near its end; a combobox calls `setSearch` as the user types and `open()` when it opens. The plain select and combobox open on focus, the plain combobox has a Load more button, and the plain radio and segmented load when drawn.

A loaded list does not clear the field's value. To clear it when the field that drives the list changes, give the field `resetOn`: `{ type: "select", name: "city", resetOn: ["country"], … }` puts the city back to its starting value whenever the user changes the country. A record loaded into the form changes both at once, and both are kept.

In an array row, `values` uses the row's names: `values.country` is the row's `country`.
