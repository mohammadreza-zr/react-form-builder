# API reference

## `@mrzr/react-form-builder`

### Components and hooks

| Name | Does |
|---|---|
| `Form` | A whole form: makes the react-hook-form form (or uses `form`), starts the fields, validates, draws the fields and the buttons. Props: `fields`, `onSubmit`, `onError`, `defaultValues`, `values`, `resolver`, `mode`, `form`, `submitLabel`, `resetLabel`, `actions`, `columns`, `idScope`, `id`, `className`, `children`, and the options |
| `FormBuilder` | Draws a list of fields of a form you made. Props: `control`, `fields`, `setValue`, `idScope`, `columns`, and the options |
| `createFormBuilder` | Sets a project up once; returns `Form`, `FormBuilder`, `FormBuilderProvider`, `defineFields` and `config` ([Configuration](Configuration)) |
| `FormBuilderProvider` | Gives the options to every `Form` and `FormBuilder` below it |
| `useFormFields` | The work of `FormBuilder` without the drawing ([Hooks](Hooks)) |
| `useFieldWatch` | Reads fields from outside the form ([Hooks](Hooks)) |
| `useLoadedOptions` | A field's options, loaded ([Hooks](Hooks)) |
| `useFormBuilderOptions`, `FormBuilderOptionsContext` | The options of the nearest provider or builder |
| `useFieldId`, `FieldIdScopeContext` | The element id of a field name within the form's `idScope` |
| `useInlineField`, `InlineFieldContext` | Whether a field is drawn inside another field's box |
| `resolveComponents` | A project's components over the plain ones, type by type |
| `fieldLayoutStyle` | The style for a field's `width` and `grow` |

The options are `components`, `can`, `locale`, `fallbackLocale`, `prepare`, `defaults`, `localizedKeys`, `messages` and `warn`.

### Form logic

These are the functions the builder is made of, for tools that need one of them.

| Name | Does |
|---|---|
| `fieldRules`, `validationMessage`, `defaultMessages`, `formatBytes` | A config's rules as react-hook-form `validate` functions; one message; the package's messages; a size as `2 MB` ([Validation](Validation)) |
| `defaultValuesOf`, `emptyValueOf`, `rowDefaultsOf` | The starting values of a list of fields, of one type, of an array row |
| `applyFieldDefaults` | The project's `defaults` under each field's config |
| `prefixFields`, `prefixName` | An array row's fields under their full names |
| `resolveFieldState` | Applies one field's dependencies to a set of values: `visible`, `disabled`, `validation`, `options`, `writes` |
| `applyResolvedValidation` | The field with a resolved state applied |
| `applyOptionsPatch` | One `options` patch applied to a list |
| `mergeValidationPatch` | A `validate` patch merged over a field's limits |
| `evaluateCondition`, `evaluateConditions`, `asConditionList` | Evaluate `when` |
| `isFilled`, `isTruthy`, `getValueByPath` | The helpers conditions use |
| `collectDependencyFields` | The names the dependencies of a list of fields read |
| `collectHiddenNames`, `collectDeniedNames` | The names a pass took out of the form |
| `applyFieldAccess` | Removes or locks fields by permission |
| `resolveLocalizedText`, `resolveLocalizedField`, `LOCALIZED_KEYS` | Resolve texts in several languages |
| `applyWatchWrites`, `isStructurallyEqual` | Apply the writes of `watch` rules; the equality that stops them looping |
| `collectWatchFields`, `toWatchSnapshot`, `resolveWatchRule` | The parts of `useFieldWatch` |

### Types

| Name | Is |
|---|---|
| `FormFieldConfig<T, X>` | One item of a form: a field, an `array`, a `break` or a `group`. `T` is the form's values, `X` the extras |
| `FormFieldConfigByType<T, X>`, `FormFieldType<X>`, `FieldConfigForType<T, K, X>`, `BuiltinFieldType` | The configs by type name |
| `FieldExtras`, `ExtrasOf<F>` | What components add: `{ text: { icon?: string } }`; the extras read from a set of components |
| `BaseField`, `TextField`, `NumberField`, `SelectField`, `RadioField`, `ComboboxField`, `TagsField`, `ToggleField`, `SliderField`, `ColorField`, `FileField`, `OtpField`, `HiddenField`, `DateField`, `RangeField`, `SegmentedField`, `CustomField`, `ArrayField`, `BreakField`, `GroupField` | The config of each kind of field |
| `TextFieldType`, `DateFieldType`, `RangeFieldType`, `FieldWidth`, `OptionsSource`, `OptionsLoader`, `OptionsLoaderContext`, `OptionsPage`, `CustomFieldRenderProps` | Their parts |
| `FormComponents<T, X>`, `FieldEntry`, `LabelPlacement`, `FieldProps`, `FieldPropsOf<K, X>`, `WrapperProps`, `GroupProps`, `ArrayProps`, `ArrayRow`, `LayoutProps`, `ActionsProps`, `OptionsState`, `RenderFields` | The component contract ([Writing components](Components)) |
| `FormProps`, `FormBuilderProps`, `FormBuilderOptions`, `FormBuilderConfig`, `UseFormFieldsOptions`, `FormFieldItem` | Props and options |
| `ValidationMessages`, `ValidateResult`, `FieldRule`, `RuleSource`, `RuleOptions`, `FieldDefaults`, `ValueSource` | Validation and defaults |
| `Dependency`, `Condition`, `Conditions`, `DependencyOperator`, `ValidationPatch`, `OptionsPatch`, `WatchPatch`, `WatchWriteOptions`, `WatchSnapshot`, `FieldWatchRule`, `ResolvedFieldState`, `ResolvedWatchWrite`, `FieldOption`, `OptionValue`, `FieldNode`, `LocalizedValue` | The rule language |

## `@mrzr/react-form-builder/plain`

`plainComponents` is a `FormComponents` that draws every field type of the package with native HTML; the builder uses it for whatever a project leaves out. Each piece is also exported:

- Fields: `PlainInput` (text, password, search, email, tel, url), `PlainNumber`, `PlainTextarea`, `PlainSelect`, `PlainRadio`, `PlainCombobox`, `PlainTags`, `PlainToggle` (checkbox, switch), `PlainSlider`, `PlainColor`, `PlainFile`, `PlainOtp`, `PlainHidden`, `PlainDate` (date, time, datetime), `PlainRange`, `PlainSegmented`, `PlainCustom`
- The rest: `PlainWrapper`, `PlainLayout`, `PlainGroup`, `PlainArray`, `PlainBreak`, `PlainActions`
- `usePlainTexts()`: the plain components' own words (Add, Remove, …) in the form's language; type `PlainTexts`

## `@mrzr/react-form-builder/jalali`

See [Jalali dates](Jalali-Dates). Besides the functions there described: `MONTH_NAMES_FA`, `MONTH_NAMES_EN`, `WEEKDAY_NAMES_FA`, `WEEKDAY_SHORTS_FA`, `jalaliKey`, `resolveDateLike`, `isJalaliDate`, `jalaliWeekday`, and the Julian day conversions `jalaliToJdn`, `jdnToJalali`, `gregorianToJdn`, `jdnToGregorian`. Types: `JalaliDate`, `DateLike`, `JalaliParts`, `DayValueFormat`, `DayValueCodec`, `DayPicker`, `DigitStyle`.
