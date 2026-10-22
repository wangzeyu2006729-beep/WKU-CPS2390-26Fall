# CPS2390 — original TestBank answers

Current revision: **2026-10-22.2-source**.

**All practice grading follows the answers supplied in the original TestBank.**
The original stems, options and LC-3 machine code are retained for all
244 questions. Earlier editorial key overrides and the one-bit program edit
have been removed, following the user's instruction to use the bank's answers.

The supplied files contain answers in three formats:

- True/false: `(T)` or `(F)` at the end of the statement.
- Multiple choice: an `Answer: a`–`f` line after the options.
- Fill in the blanks: intended answers appear in parentheses in the sentence.

Chinese explanations remain available for all 244 questions and all 458 TF/MC
alternatives. They do not substitute a different grading key. Results are
labelled **与题库答案一致** or **题库答案**, distinguishing source alignment
from an unconditional claim that every supplied statement is theoretically sound.

## Source answers and separate conceptual notes

| Label | Source answer used for grading | Conceptual note only |
|---|---|---|
| C2-MC02 | **C** | Carry alone does not prove signed overflow. Four-bit `1111+1111=1110` has carry without signed overflow. The original key is retained despite this caveat. |
| C3-TF15 | **True** | Complementary outputs are the normal valid-state interpretation. A forbidden RS-latch input can produce equal outputs. |
| C5-MC18 | **B** | The intended comparison assumes no signed overflow. `32767−(−1)` wraps to `x8000`; the strict unrestricted interpretation has a counterexample. |
| C5-MC20 | **B**, original `0000100111111000` at x3009 | Original BRn #-8 returns to x3002 and resets the mask. R5=x0009 produces R0=5 but has only two set bits. Hypothetical BRn #-7 would implement the intended low-byte population count; it is discussed only, not substituted into the question. |

Twenty-five other questions include interpretation or model notes, such as
single-digit ASCII sums, arithmetic-shift rounding, ideal steady-state CMOS,
active-low NAND latches, the course multi-cycle datapath and LC-3 edition rules.
Original question wording and answer keys remain unchanged.

For LEA, course `CHAPTER 5 - Part 2.pdf`, PDF page 20 (slide 5-20), lists LEA
as updating NZP, matching the second-edition bank. The supplied third-edition
`cs2390.pdf`, preface PDF page 17, describes the later change. Notes identify
this difference without changing the supplied True answer for C5-TF08.

## Provenance and verification

`sources/` retains extracted source files and original Word-file hashes.
Original Word files remain unchanged. Chapter 2's duplicate fill numbers
use suffix `b`; missing source numbers are not invented.

`build.py` adds explanations and notes, but asserts that source stems, options
and keys cannot be overridden. Each question and the course metadata record
`answer_basis: source`. The final bank was compared to the pre-review website:
all 244 IDs, labels, stems, options, keys, fill answers and source fields match.

`verify_content.py` checks every original key against the answer marker in its
source text, explanation coverage, and supporting calculations. LC-3 checks
distinguish the original program's actual behavior from hypothetical code in
notes. See [content-verification.json](content-verification.json).

Browser tests submit every question using its source answer and inspect all
rendered option explanations. Migration tests cover restoring source grading
from the earlier editorial version. See [verification.json](verification.json)
and [review-verification.json](review-verification.json).

Existing submitted choices, attempts, fill self-assessment, drafts, bookmarks
and position remain. Cached choice grades are recomputed against the original
source keys, with a visible message when needed. MATH3700 data is unaffected.
