# WKUCPS2390TestBank

**Wenzhou-Kean University · CPS2390 · Qixia Zhang · Fall 2026 (26Fall)**

[Practice CPS2390 online](https://wangzeyu2006729-beep.github.io/WKUCPS2390TestBank/) · [MATH3700 practice](https://wangzeyu2006729-beep.github.io/WKU3700Midquiz/)

A compact dark practice site built from the five TestBank documents supplied by the repository owner. The course selector links this site and the existing MATH3700 practice site. Each course saves independent progress.

The source question text and answer keys are in English. Controls and editorial notes are in Chinese. This is an independent revision aid, not an official university site or a claim of instructor endorsement.

![Practice interface](docs/preview.png)

## Coverage

| Chapter | Topic | True/false | Multiple choice | Fill in the blanks | Total |
|---|---|---:|---:|---:|---:|
| 1 | Computer systems | 15 | 10 | 20 | 45 |
| 2 | Data representations and operations | 15 | 15 | 22 | 52 |
| 3 | Digital logic | 15 | 14 | 20 | 49 |
| 4 | The von Neumann model | 18 | 19 | 14 | 51 |
| 5 | LC-3 ISA | 15 | 19 | 13 | 47 |
| **Total** | | **78** | **77** | **89** | **244** |

## Practice controls

- Filter by chapter and question type; combine filters with sequential, random, incorrect-answer, or bookmarked practice.
- Labels preserve source chapter, type, and number: `C1-TF01`, `C1-MC01`, `C1-FB01`.
- Search a complete label or a keyword. A bare number searches the internal sequential ID.
- True/false and multiple choice are graded against the supplied answer key. All original choices are retained, including questions with five or six options.
- Fill questions provide one optional input per blank. Reveal the original reference answers, compare your response, and choose **答对了** or **需巩固**. Revealing alone does not count as a completed question. This self-assessment avoids rejecting equivalent terminology or spelling variants.
- Answers, typed drafts, pending fill reveals, bookmarks, and practice position survive refresh.
- Keyboard: `1`–`6` or `A`–`F` select an option; `Enter` confirms; arrow keys navigate; `S` bookmarks. Enter in a fill field reveals its reference answers.
- Restart hides previous solutions without deleting historical records. Clearing progress requires confirmation.

## Source fidelity and notes

The supplied files are `chap01tq.doc` through `chap05tq.doc`, headed Patt/Patel, *Introduction to Computing Systems: From Bits and Gates to C and Beyond*, 2e. The documents identify their original authors and copyright holders. Qixia Zhang is the instructor identified by the repository owner, not the asserted author of the textbook bank.

Extracted source text is retained in `sources/`; the original local Word files remain unchanged. Their SHA-256 hashes are recorded in `sources/manifest.json`. `source-audit.json` records per-file counts, types, and original numbers.

Chapter 2 repeats fill-question numbers 3 and 4. The second occurrences are labeled `C2-FB03b` and `C2-FB04b`. Chapter 3 omits multiple-choice number 11; Chapter 5 omits multiple-choice number 17. These are source irregularities: no supplied question is dropped and no missing question is invented.

The original keys are retained even where an editorial note identifies an issue. In particular, `C2-MC02` incorrectly treats a carry from adding negative two's-complement integers as sufficient evidence of overflow. The interface flags this and supplies a counterexample; grading continues to follow the original key so learners can distinguish the source answer from the conceptual qualification. Other notes qualify source assumptions. This is not a claim that every source answer has been independently corrected.

## Private browser progress

There is no backend, login, tracking, or answer upload. CPS2390 uses localStorage key `cps2390-testbank-v1`; MATH3700 continues to use `math3700-practice-v1`. Course switching and clearing CPS2390 records do not clear MATH3700 records.

Different devices, browsers, and browser profiles have independent records. Tabs in the same browser profile share them. There is no cross-device synchronization. Clearing browser data removes progress; private browsing may discard it on close. If storage is unavailable, a warning appears and practice remains usable for the current session.

## Build and offline use

`index.html` embeds the entire interface and question bank. Download it and open it directly to practice offline. Switching to the other online course requires an internet connection.

Rebuild with Python 3, without third-party packages:

```bash
python3 build.py
```

`build.py` parses the included text sources into `questions.json`, produces `source-audit.json`, and embeds the bank into `template.html`. It preserves source numbering and removes inline answers from fill-question stems while preserving contextual parentheses such as `a(n)`.

Serve for browser verification:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
npx --yes --package @playwright/cli playwright-cli -s=cps2390 open http://127.0.0.1:8000/index.html
npx --yes --package @playwright/cli playwright-cli -s=cps2390 run-code --filename verify-browser.js
```

Use a disposable browser profile: the browser checks clear test progress. `verify-isolation.js` creates independent contexts for browser and course isolation. Verification results are recorded in `docs/verification.json`.

## License

Application code is provided under the [MIT License](LICENSE). Source questions and answer keys remain the materials of their respective authors; the application license does not relicense them. See [CONTENT_NOTICE.md](CONTENT_NOTICE.md).
