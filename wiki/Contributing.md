# Contributing

```bash
npm install
npm test          # builds, then runs the tests
npm run typecheck
```

- The tests use no mocks. The logic is tested with real inputs, and the components with the real DOM in jsdom, through `plainComponents`.
- The code in the docs is real: blocks marked `<!-- verbatim: path -->` must be lines of that file, in order, and the files in `examples/` are compiled and run by the tests. A page that links to a page that does not exist fails the tests. Every exported name must be in the [API reference](API-Reference).
- A change to a rule of the form logic (`src/core`) needs a test beside the ones in `test/`.
- Commit messages follow Conventional Commits.

`npm run docs:sync` publishes `wiki/` to the repository's wiki.
