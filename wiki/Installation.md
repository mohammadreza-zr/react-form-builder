# Installation

```bash
npm install @mrzr/react-form-builder react-hook-form
```

React 18 or newer and react-hook-form 7 are peer dependencies. The package is tested with React 19.

The package has three entry points:

| Import | Contains |
|---|---|
| `@mrzr/react-form-builder` | `FormBuilder`, `FormBuilderProvider`, `useFormFields`, `useFieldWatch`, the config and component types, and the form logic (dependencies, access, languages, watch writes) |
| `@mrzr/react-form-builder/plain` | `plainComponents`, the components that draw every field type with native HTML, and each of them on its own |
| `@mrzr/react-form-builder/jalali` | Jalali calendar functions and the value formats of a date field |

TypeScript needs `"moduleResolution": "node16"`, `"nodenext"` or `"bundler"` to find the sub-path entry points.
