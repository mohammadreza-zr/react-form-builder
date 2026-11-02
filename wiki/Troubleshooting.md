# Troubleshooting

**`[react-form-builder] a watch or visible dependency needs the form's setValue to write.`**
A `FormBuilder` has a rule that writes and was not given `setValue`. Pass `setValue={form.setValue}`; `Form` passes it itself. Until then `watch` rules write nothing and hidden fields keep their values. The message is printed once; `warn` changes where it goes.

**A field hidden by a rule keeps its value.** The same cause: resetting needs `setValue`.

**A field is missing from the form.** It has a `permission` that `can` rejects, or a `visible` rule that does not hold, or it is in a group the user may not see, or its `type` has no component (and no `fallback`). A type of your own needs a component in the setup.

**The rules of the configs do not run.** The form has a `resolver`: react-hook-form then validates with the schema only.

**A required field passes while it is hidden or disabled.** That is the rule: a field the user cannot fill in is not validated.

**TypeScript rejects an extra key such as `icon`.** The list is typed without your components' extras. Use the `Form` and `defineFields` of your `createFormBuilder`, or type the list as `FormFieldConfig<Values, Extras>[]`.

**`label` is an object and TypeScript complains.** The types say `string`. Cast the text (`as never`) and give the form a `locale`.

**A text shows as an object, or `Objects are not valid as a React child`.** A text in several languages reached a component without `locale`. Set `locale` in the setup, a provider, or the form.

**Typing in one field re-renders the whole form.** Something above the builder reads `form.watch()` or `useWatch({ control })` with no name. Read only the fields you need with `useFieldWatch`. A `fields` list written inline in a component that re-renders often is rebuilt each time; keep it in a module or a `useMemo`.

**A `watch` rule fires forever.** Its `from` returns a value that is never structurally equal to the target, such as a new `Date`. Return plain data (an ISO string, a timestamp).

**Two fields with the same loader each load.** Answers are shared per loader function, and a loader written inline inside a component is a new function each render. Define it in a module.
