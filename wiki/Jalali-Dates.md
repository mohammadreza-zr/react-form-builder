# Jalali dates

`import … from "@mrzr/react-form-builder/jalali"` has no React and no dependency.

## What a date field holds

`valueFormat` on a `date` field decides it:

| `valueFormat` | Held value | Cleared |
|---|---|---|
| `"text"` (default) | `"1405/05/21"` | `""` |
| `"parts"` | `{ year: 1405, month: 5, day: 21 }` | `null` |
| `"date-time"` | `"2026-08-12T00:00:00Z"`, that day's midnight | `null` |

With `picker: "month"` a `text` field holds a year and month as `"05/05"` (`YY/MM`). A `datetime` field holds `"1405/05/21 09:30"`, a `range-date` field `{ from, to }` of day texts.

`readDayValue(value, format, picker)` gives the day text a value stands for (`null` for none), and `writeDayValue(day, format, picker)` gives the value for a picked `JalaliDate`. A component that draws a Jalali picker calls these two.

`plainComponents` shows a Jalali day in the browser's date input, which speaks Gregorian, and converts both ways: `toNativeDay("1405/05/21")` is `"2026-08-12"`, and `fromNativeDay` is its inverse. `toNativeDateTime` and `fromNativeDateTime` do the same with a time.

## Calendar functions

| Function | Does |
|---|---|
| `toJalali(date)`, `toGregorian(jalali)` | Convert between a `Date` and `{ jy, jm, jd }` |
| `normalizeDateLike(value)` | Reads a `Date`, a `JalaliDate` or text such as `"۱۴۰۵/۵/۲۱"` or `"1405-05-21"`; `null` when it is not a real day |
| `isValidJalaliDate`, `jalaliMonthLength`, `isJalaliLeapYear` | Calendar rules |
| `addJalaliDays`, `addJalaliMonths`, `compareJalali`, `isSameJalaliDay`, `jalaliToday`, `firstWeekdayOfMonth` | Arithmetic |
| `formatJalali(day, pattern, digits)` | Tokens `YYYY YY MMMM MM M DD D dddd`. `digits` is `"persian"` (default) or `"latin"` |
| `formatJalaliLong(day, digits)` | `چهارشنبه ۲۱ مرداد ۱۴۰۵` |
| `formatApiDate(value, pattern, digits)` | A Gregorian `date-time` or a Jalali text from an API as one display string; `HH`, `mm`, `ss` add the clock |
| `toPersianDigits`, `toLatinDigits` | Digit conversion |
| `toDateTime`, `fromDateTime`, `toJalaliParts`, `fromJalaliParts`, `toJalaliString`, `toJalaliMonthString`, `fromJalaliMonthString`, `toJalaliDateTimeString` | The pieces `readDayValue` and `writeDayValue` are made of |

The conversion is accurate for Jalali years -61 to 3177. A day is converted from its local date, so a date-time written for a day is that day's local midnight.
