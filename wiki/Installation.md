# Installation

```bash
npm install @mrzr/react-form-builder react-hook-form
```

React 18 or newer and react-hook-form 7 are peer dependencies. The package is tested with React 19. It has no other dependency, and it works with any component library or none.

The package has three entry points:

| Import | Contains |
|---|---|
| `@mrzr/react-form-builder` | `Form`, `FormBuilder`, `createFormBuilder`, `FormBuilderProvider`, the hooks, the config and component types, and the form logic (dependencies, validation, access, languages, watch writes) |
| `@mrzr/react-form-builder/plain` | `plainComponents`, the native HTML the builder draws with by default, and each of them on its own |
| `@mrzr/react-form-builder/jalali` | Jalali calendar functions and the value formats of a date field |

TypeScript needs `"moduleResolution": "node16"`, `"nodenext"` or `"bundler"` to find the sub-path entry points.
