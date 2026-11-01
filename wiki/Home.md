# @mrzr/react-form-builder

Build a React form from a list of field configs, with react-hook-form. Fields can show, hide, disable and fill each other, depending on the other values of the form; a field can need a permission; and you supply the components that draw each field type.

## Pages

- **Start:** [Installation](Installation) · [Quick start](Quick-Start)
- **Guides:** [Field types](Field-Types) · [Layout](Layout) · [Dependencies](Dependencies) · [Access and language](Access-and-Language) · [Writing components](Components) · [Hooks](Hooks) · [Jalali dates](Jalali-Dates)
- **Reference:** [API](API-Reference)
- **Help:** [Troubleshooting](Troubleshooting) · [Contributing](Contributing)

## Limits

- The package draws nothing of its own except `plainComponents`, which is native HTML without styling. A form that should look like your design needs your components ([Writing components](Components)).
- `plainComponents` has no component for `combobox`, `toggle-group`, files, or any type you add yourself; a type without a component draws nothing (or the `fallback` component).
- The Jalali date and time pickers are not part of the package. `plainComponents` uses the browser's date inputs and holds the value in the format the config asks for ([Jalali dates](Jalali-Dates)).
- A `label` and the other texts are plain strings in the config types. Texts in several languages are resolved at run time, but typing them needs a cast ([Access and language](Access-and-Language)).
- `watch` and `visible` rules write into the form, so they need `setValue` passed to `FormBuilder`; without it they are ignored ([Troubleshooting](Troubleshooting)).
