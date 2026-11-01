# Changelog

## Unreleased

First release.

- `FormBuilder` and `FormBuilderProvider`: draw a list of field configs with react-hook-form and the components of a project; `useFormFields` does the same work without drawing, `useFieldWatch` reads fields from outside the form.
- Field types: text, number, password, search, textarea, select, radio, switch, checkbox, slider, color, date, time, datetime, range-date, range-datetime, segmented, custom, and `break` and `group` for layout. An adapter adds keys to them or adds types of its own.
- Dependencies `visible`, `disabled`, `validate`, `options` and `watch`, with the operators `eq`, `neq`, `in`, `nin`, `gt`, `gte`, `lt`, `lte`, `filled`, `empty`, `truthy` and `falsy`. A field a rule hides goes back to its default.
- Access by `permission` and `writePermission`, and texts in several languages resolved by `locale`.
- `@mrzr/react-form-builder/plain`: `plainComponents`, every field type in native HTML.
- `@mrzr/react-form-builder/jalali`: Jalali conversion, formatting, and the value formats of a date field (`text`, `parts`, `date-time`, month).
