# Adding courses without changing existing learning records

The present release contains MATH3700 Quiz, CPS2390 TestBank and CPS2232 past exams + question bank.
CPS2390 exercises and assignments have not been imported or given empty pages.

## Small shared interface

`practice_ui.py`, `practice-ui.css`, `practice-ui.js`, `course-catalog.json`,
`verify-ui.js` and `verify-course-flow.js` are kept identical in the three repositories. The build embeds
these files into each standalone HTML page; there is no runtime dependency on
another repository, translation service or UI framework.

The catalogue contains one entry per real course: a stable ID, display code,
description, instructor, term, question count, storage key and public URL.
Register a future course by updating the catalogue in each published course
checkout, then rebuilding and checking navigation between every pair of courses.
The current-course marker is derived from course metadata, not a hardcoded menu.

## Content and translation

Keep question IDs and labels stable when appending content. Keep each course's
storage key unique. A future exercise or assignment collection should retain
its own content-source provenance and stable bank ID; add it when actual
materials and their intended practice behavior are available.

`translations.json` contains an entry for every question label. Each entry has
`text`, `options` in original option order, and `source_sha256`, the SHA-256 of
UTF-8 JSON `[english_text, english_options]` with ensure_ascii=False and compact
separators. The builder rejects missing translations, stale source hashes,
wrong option counts and changed fill-blank numbering. It never uses translation
to change an answer key. Preserve identifiers, numerical values, negations and
machine code. A long instruction sequence can be referenced from the Chinese
meaning instead of duplicated. Fill meanings must retain their blanks and must
not expose inline source answers.

## Learner state

Chinese meaning is collapsed until clicked. Its state is remembered per question
in the existing course storage record, under the additive `translated` list.
Legacy records without this field migrate to an empty list. Toggling meaning
never submits an answer or changes attempts, bookmarks, drafts or grades.
Navigation opens the other course page and restores that course's local state;
it does not synchronize records between devices or browser profiles.

## Release checks

Run the existing content and browser checks plus `verify-ui.js` on a disposable
browser profile. The UI check covers every Chinese stem and option, unchanged
English rendering, translation persistence and search, course-menu keyboard and
outside-click behavior, legacy progress, and 320–1440 px layouts. Confirm the
shared files match between repositories, source fields and answer keys are
unchanged, and no unrequested content collection was added. After publishing,
check the actual public course links between all three courses with `verify-course-flow.js`. This also checks Chinese-assisted answering, numerical-choice de-duplication and separate course progress. The local bridge runs from the CPS2390 checkout with Math and CPS2232 HTML fixtures (`tmp/math-index.html`, `tmp/ds-index.html`); public checks use the real course URLs.
