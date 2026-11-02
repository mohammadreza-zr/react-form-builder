# CLAUDE.md

## Rule: the package is for every project

Nothing project-specific (a field type, a permission, a design-system prop, a date shape) is written in `src/`. A project adds it through its components, their extras, `defaults`, `localizedKeys`, a `DayValueCodec` or `prepare`. When a project needs something the package cannot express, add a general feature, not the project's case.

## Rule: the logic has no component in it

`src/core` and `src/jalali` import no component and no project. Everything a project decides (how a field looks, who may see it, which language) reaches the logic as an argument or an option, never as an import. `src/react` draws with `src/plain` for whatever a project leaves out.

## Rule: one place per decision

A field's frame (label, help, error, place) is the `wrapper`'s; a field component draws its control only. Messages live in `defaultMessages`, the plain components' own words in `usePlainTexts`, per-type config in `defaults`. Do not repeat one of them in a component.

## Rule: the docs are checked

A code block marked `<!-- verbatim: path -->` must be lines of that file, in order. The files in `examples/` are compiled by `npm run typecheck` and run by the tests. Every exported name must be in `wiki/API-Reference.md`. Keep README and wiki plain: say what the package does, no comparisons.

## Tests

No mocks. Logic: real inputs. Components: the real DOM in jsdom, through the plain components, with `test/harness.tsx` (or `Form` directly). `npm test` builds, then runs vitest; `npm run typecheck` checks the source, tests and examples (`tsconfig.test.json`).
