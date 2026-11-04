# Changelog

## Unreleased

- `optionsMaxAge` on a field that loads options: how long an answer is kept for fields drawn again. Before, it was kept until the loader's latest 64 pushed it out, so a form left open never saw a change on the server. `0` keeps nothing, for a loader with a cache of its own.

## 0.1.1

- A component written for its own extras now fits a `FormComponents` whose extras add more field types. The nested lists in a component's props — a group's `fields`, an array's row fields, a segmented field's `trailing`, and what `renderFields` takes — are typed as `NestedFields` (any extras), and a group's or array's config reads only its own entry of the extras. Before, assigning such components to `FormComponents<T, AllExtras>` failed to type-check.
- `build` clears `dist` first, so a deleted source file is not published.
- Examples for your own `useForm`, zod, languages and permissions, and shadcn/ui, all compiled and run by the tests.

## 0.1.0 - 2026-11-02

First release.

- `Form`: a whole form from field configs. It makes the react-hook-form form (or uses yours), starts each field from its `defaultValue` or the empty value of its type, validates by the configs' rules or a `resolver`, and draws the fields and the buttons.
- `createFormBuilder`: a project's setup in one place: its components over the plain ones, per-type `defaults`, validation `messages`, `can`, `locale`. The keys its components read become typed keys of the configs.
- `FormBuilder` and `FormBuilderProvider`: draw the fields of a form you made; `useFormFields` does the same work without drawing, `useFieldWatch` reads fields from outside the form, `useLoadedOptions` loads a field's options.
- Field types: text, password, search, email, tel, url, textarea, number, select, radio, combobox, tags, checkbox, switch, slider, color, file, otp, hidden, date, time, datetime, range-date, range-datetime, segmented, custom, `array` (rows with add, remove, move and row limits), and `break` and `group` for layout. Components add keys to them or types of their own.
- Validation from the config: `required`, `minLen`/`maxLen`, `min`/`max`, `pattern`, email and URL formats, `otp` length, file `maxSize`, `minDate`/`maxDate`, and `validate`; messages in English and Persian, set per project or per field. `rules: false` leaves validation to schemas everywhere.
- Dependencies `visible`, `disabled`, `validate`, `options` and `watch`, with the operators `eq`, `neq`, `in`, `nin`, `gt`, `gte`, `lt`, `lte`, `filled`, `empty`, `truthy` and `falsy`. A field a rule hides goes back to its starting value and is not validated. `resetOn` puts a field back when another changes.
- Options fixed, narrowed by a dependency, or loaded by `loadOptions`: with `optionsDeps` and `optionsKey`, search, pages (`hasMore`, `loadMore`), loading on open (`loadOn`), shared answers and retry; an option's value may be a number.
- Layout: a grid of `columns` with `colSpan`, or `width` and `grow` in a wrapping row; one `wrapper` component draws every field's label, help and error.
- Access by `permission` (on fields and groups) and `writePermission`, and texts in several languages resolved by `locale`, with `localizedKeys` for a project's own keys.
- `format` and `parse` convert between the stored value and the control's; `configForControl` gives a component its config without the keys the builder owns.
- `@mrzr/react-form-builder/plain`: every field type and layout piece in native HTML, used for whatever a project leaves out.
- `@mrzr/react-form-builder/jalali`: Jalali conversion, formatting, and the value formats of a date field (`text`, `parts`, `date-time`, a `DayValueCodec` of your own, and months as `YYYY/MM`).
