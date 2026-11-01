# CLAUDE.md

## Rule: the logic has no component in it

`src/core` and `src/jalali` import no component and no project. Everything a project decides (how a field looks, who may see it, which language) reaches the logic as an argument or an option, never as an import.

## Rule: no project names

Nothing project-specific (a field type, a permission, a design-system prop) is written in `src/`. It belongs in the project's components and in its extras (`FieldExtras`).

## Rule: the docs are checked

A code block marked `<!-- verbatim: path -->` must be lines of that file, in order. The files in `examples/` are compiled by `npm run typecheck` and run by the tests. Every exported name must be in `wiki/API-Reference.md`. Keep README and wiki plain: say what the package does, no comparisons.

## Rule: one behaviour for old and new

The form logic was ported from a project that used it before. A change to `src/core` that changes what its tests assert changes that project's forms too: say so in the changelog.

## Tests

No mocks. Logic: real inputs. Components: the real DOM in jsdom, through `plainComponents`, with `test/harness.tsx`. `npm test` builds, then runs vitest; `npm run typecheck` checks the source, tests and examples (`tsconfig.test.json`).
