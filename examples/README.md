# Examples

Each example is compiled and run by the package's tests, so the code here works as written.

| Example | Shows |
|---|---|
| [`basic/signup-form.tsx`](basic/signup-form.tsx) | The quick start: `Form` with no setup, a `watch` rule (the slug follows the title), a `visible` rule, a two-column grid |
| [`basic/adapter.tsx`](basic/adapter.tsx) | `createFormBuilder`: your own wrapper, a key added to `text` (`icon`), a field type of your own (`rating`), defaults and messages |
| [`basic/order-form.tsx`](basic/order-form.tsx) | A field array of order lines, cities loaded for the chosen country, `resetOn`, a grid with `colSpan` |
| [`own-form/profile-form.tsx`](own-form/profile-form.tsx) | `FormBuilder` in a form you make with `useForm`, `defaultValuesOf`, and `useFieldWatch` for a part of the page that is not a field |
| [`zod/account-form.tsx`](zod/account-form.tsx) | A zod schema as the `resolver`, with a cross-field rule (repeat the password) |
| [`i18n-access/settings-form.tsx`](i18n-access/settings-form.tsx) | Texts in Persian and English chosen by `locale`, a field hidden without a `permission`, fields read-only without a `writePermission` |
| [`shadcn/`](shadcn) | A shadcn/ui project's setup: [`form-kit.tsx`](shadcn/form-kit.tsx) gives the builder shadcn's `Input`, `Select`, `Textarea`, `Checkbox` and `Label`; [`contact-form.tsx`](shadcn/contact-form.tsx) is a form built with it |

## shadcn/ui

`shadcn/components/ui` and `shadcn/lib/utils.ts` are the files the shadcn CLI copies into a project (`npx shadcn add input label checkbox select textarea`). In your project, keep yours and copy only `form-kit.tsx`, importing from `@/components/ui/...` instead of the relative paths.

```bash
npm install @mrzr/react-form-builder react-hook-form
npx shadcn add input label checkbox select textarea
```

Then use the kit's `Form` everywhere:

```tsx
import { Form, defineFields } from "@/components/form-kit";

const fields = defineFields<Values>([
  { type: "text", name: "name", label: "Name", required: true },
  { type: "email", name: "email", label: "Email", required: true },
]);

<Form<Values> fields={fields} onSubmit={save} />;
```

A field type the kit leaves out (`combobox`, `date`, `file`, …) is drawn with native HTML until you add a component for it.
