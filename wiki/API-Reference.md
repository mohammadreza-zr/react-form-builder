# API reference

## `@mrzr/react-form-builder`

### Components and hooks

| Name | Does |
|---|---|
| `FormBuilder` | Draws a list of fields. Props: `control`, `fields`, `setValue`, `idScope`, and the options `components`, `can`, `locale`, `fallbackLocale`, `prepare`, `warn` |
| `FormBuilderProvider` | Gives the options to every `FormBuilder` below it |
| `useFormFields` | The work of `FormBuilder` without the drawing ([Hooks](Hooks)) |
| `useFieldWatch` | Reads fields from outside the form ([Hooks](Hooks)) |
| `useFieldId`, `FieldIdScopeContext` | The element id of a field name within the form's `idScope` |
| `useInlineField`, `InlineFieldContext` | Whether a field is drawn inside another field's box |
| `fieldLayoutStyle` | The style for a field's `width` and `grow` |

### Form logic

These are the functions the builder is made of, for tools that need one of them.

| Name | Does |
|---|---|
| `resolveFieldState` | Applies one field's dependencies to a set of values: `visible`, `disabled`, `validation`, `options`, `writes` |
| `applyResolvedValidation` | The field with a resolved state applied |
| `applyOptionsPatch` | One `options` patch applied to a list |
| `mergeValidationPatch` | A `validate` patch merged over a field's limits |
| `evaluateCondition`, `evaluateConditions`, `asConditionList` | Evaluate `when` |
| `isFilled`, `isTruthy`, `getValueByPath` | The helpers conditions use |
| `collectDependencyFields` | The names the dependencies of a list of fields read |
| `collectHiddenNames`, `collectDeniedNames` | The names a pass took out of the form |
| `applyFieldAccess` | Removes or locks fields by permission |
| `resolveLocalizedText`, `resolveLocalizedField` | Resolve texts in several languages |
| `applyWatchWrites`, `isStructurallyEqual` | Apply the writes of `watch` rules; the equality that stops them looping |
| `collectWatchFields`, `toWatchSnapshot`, `resolveWatchRule` | The parts of `useFieldWatch` |

### Types

| Name | Is |
|---|---|
| `FormFieldConfig<T, X>` | One item of a form: a field, a `break` or a `group`. `T` is the form's values, `X` the extras |
| `FormFieldConfigByType<T, X>`, `FormFieldType<X>`, `FieldConfigForType<T, K, X>` | The configs by type name |
| `FieldExtras` | What an adapter adds: `{ text: { icon?: string } }` |
| `BaseField`, `TextField`, `ChoiceField`, `CheckboxField`, `SliderField`, `ColorField`, `DateField`, `RangeField`, `SegmentedField`, `CustomField`, `BreakField`, `GroupField` | The config of each kind of field |
| `TextFieldType`, `ChoiceFieldType`, `DateFieldType`, `RangeFieldType`, `FieldWidth`, `CustomFieldRenderProps` | Their parts |
| `FormComponents<T, X>`, `FieldProps`, `FieldPropsOf<K, X>`, `GroupProps`, `RenderFields` | The component contract ([Writing components](Components)) |
| `FormBuilderProps`, `FormBuilderOptions`, `UseFormFieldsOptions`, `FormFieldItem` | Props and options |
| `Dependency`, `FieldDependency`, `Condition`, `Conditions`, `DependencyOperator`, `ValidationPatch`, `OptionsPatch`, `WatchPatch`, `WatchWriteOptions`, `WatchSnapshot`, `FieldWatchRule`, `ResolvedFieldState`, `ResolvedWatchWrite`, `FieldOption`, `FieldNode`, `LocalizedValue` | The rule language |

## `@mrzr/react-form-builder/plain`

`plainComponents` is a `FormComponents` that draws every field type of the package with native HTML. Each component is also exported: `PlainInput` (text, password, search, number), `PlainTextarea`, `PlainSelect`, `PlainRadio`, `PlainSwitch`, `PlainCheckbox`, `PlainSlider`, `PlainColor`, `PlainDate` (date, time, datetime), `PlainRange`, `PlainSegmented`, `PlainCustom`, `PlainGroup`, `PlainBreak`, and `FieldFrame`, the box with the label, description and error that they sit in.

## `@mrzr/react-form-builder/jalali`

See [Jalali dates](Jalali-Dates). Besides the functions there described: `MONTH_NAMES_FA`, `MONTH_NAMES_EN`, `WEEKDAY_NAMES_FA`, `WEEKDAY_SHORTS_FA`, `jalaliKey`, `resolveDateLike`, `isJalaliDate`, `jalaliWeekday`, and the Julian day conversions `jalaliToJdn`, `jdnToJalali`, `gregorianToJdn`, `jdnToGregorian`. Types: `JalaliDate`, `DateLike`, `JalaliParts`, `DayValueFormat`, `DayPicker`, `DigitStyle`.
