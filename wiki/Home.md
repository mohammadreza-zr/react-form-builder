# @mrzr/react-form-builder

Build React forms from a list of field configs, with react-hook-form. A config says what a field holds, how it is validated, when it is shown, disabled or filled from other fields, and who may see it. The fields are drawn by native HTML out of the box, or by your own components, given once for the whole project.

## Pages

- **Start:** [Installation](Installation) · [Quick start](Quick-Start) · [Configuration](Configuration)
- **Guides:** [Field types](Field-Types) · [Validation](Validation) · [Layout](Layout) · [Dependencies](Dependencies) · [Options](Options) · [Field arrays](Field-Arrays) · [Access and language](Access-and-Language) · [Writing components](Components) · [Hooks](Hooks) · [Jalali dates](Jalali-Dates)
- **Reference:** [API](API-Reference)
- **Help:** [Troubleshooting](Troubleshooting) · [Contributing](Contributing)

## Two ways to use it

- **`Form`** makes the form for you: give it `fields` and `onSubmit`. It starts every field from its config, validates by the configs' rules, and draws a submit button.
- **`FormBuilder`** draws the fields of a form you made with `useForm`: give it `control` and `setValue`. Use it when the page owns the form, or for part of a form.

Both draw with the plain components unless a project gives its own ([Configuration](Configuration)).

## Limits

- The plain components are native HTML without styling. A form that should look like your design needs your components ([Writing components](Components)).
- The plain `combobox` is a text input with suggestions (`datalist`), and the plain date fields are the browser's Gregorian pickers holding Jalali values. Real pickers are your components' job.
- A `label` and the other texts are plain strings in the config types. Texts in several languages are resolved at run time, but typing them needs a cast ([Access and language](Access-and-Language)).
- `watch` and `visible` rules write into the form. `Form` passes `setValue` itself; a `FormBuilder` needs it passed ([Troubleshooting](Troubleshooting)).
