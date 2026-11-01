# Troubleshooting

**`[react-form-builder] a watch or visible dependency needs the form's setValue to write.`**
The form has a rule that writes, and `FormBuilder` was not given `setValue`. Pass `setValue={form.setValue}`. Until then `watch` rules write nothing and hidden fields keep their values. The message is printed once; `warn` changes where it goes.

**A field hidden by a rule keeps its value.** The same cause: resetting needs `setValue`.

**A field is missing from the form.** It has a `permission` that `can` rejects, or a `visible` rule that does not hold, or its `type` has no component in `components` (and no `fallback`).

**TypeScript rejects an extra key such as `icon`.** `FormFieldConfig<Values>` does not know the extras of your components. Type the list as `FormFieldConfig<Values, Extras>[]`; the builder does not infer the extras from `fields`.

**`label` is an object and TypeScript complains.** The types say `string`. Cast the text (`as never`) and give `locale` to the builder.

**A text shows as an object, or `Objects are not valid as a React child`.** A text in several languages reached a component without `locale`. Pass `locale` to the builder or the provider.

**Typing in one field re-renders the whole form.** Something above the builder reads `form.watch()` or `useWatch({ control })` with no name. Read only the fields you need with `useFieldWatch`.

**A `watch` rule fires forever.** Its `from` returns a value that is never structurally equal to the target, such as a new `Date`. Return plain data (an ISO string, a timestamp).
