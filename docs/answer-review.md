# CPS2390 answer review — Fall 2026

Review revision: **2026-10-22.1**. All 244 questions have Chinese reasoning;
all 458 true/false and multiple-choice alternatives have individual explanations.
The 89 fill questions explain their reference answers, including calculations
and multi-blank terminology. Fill grading remains self-assessment so equivalent
wording is not rejected by a brittle text match.

This is an independent study aid based on the supplied TestBank, course slides,
and textbook. It is not a claim that the instructor approved these edits, nor
a proof that editorial review can eliminate every possible interpretation.
The exercise model and version are stated where they affect the answer.

## Corrections

| Label | Supplied content | Reviewed practice | Reason |
|---|---|---|---|
| C2-MC02 | C: carry implies signed overflow | **A** | Four-bit `1111+1111=1110` has carry without signed overflow; `1000+1000=0000` has carry and overflow. Carry alone cannot determine sign or overflow. |
| C3-TF15 | True: latch outputs are always complementary | **False** | The forbidden NAND-latch input combination permits both outputs high; normal valid states are complementary. |
| C5-MC18 | B: negative difference implies R1<R2 | **D** | `32767−(−1)` wraps to `x8000`; BRn is taken even though R1>R2. No no-overflow premise was supplied. |
| C5-MC20 | At x3009: `0000100111111000` (BRn #-8) | **`0000100111111001` (BRn #-7)**; key B retained for repaired code | The original branch returns to x3002 and resets the mask. R5=x0009 gives R0=5 even though the low byte contains only two ones. Changing one offset bit returns to x3003, yielding the intended low-byte population count. |

Original source text, options and keys remain available under the answer's
**原题与原答案** disclosure and in `sources/`. They are never overwritten.
Question IDs, order and labels remain stable.

## Course conventions and wording

The supplied bank is labelled second edition. Course `CHAPTER 5 - Part 2.pdf`,
PDF page 20 (slide 5-20), explicitly lists LEA among the instructions updating
NZP. The supplied third-edition `cs2390.pdf`, PDF page 17, explicitly describes
the later change that LEA no longer updates condition codes. C5-TF08 therefore
states **course-slides / second-edition LC-3** in its stem. The original
[second-edition LC-3 Appendix A](https://www.cs.auckland.ac.nz/courses/compsci210s2c/resources/PattPatelAppA.pdf)
also specifies LEA's condition-code update. This is LC-3, not LC-3b.

For C5-FB01, course Part 2 PDF page 16 classifies LEA as immediate/literal by
the origin of its loaded value. The explanation also states its PC-relative
effective-address formula; LEA does not load the contents at that address.

Twenty-five questions have explicit clarifications rather than changed keys:

- C1-MC05: distinguish translating from interpreting/executing a program.
- C2-MC06: digit sum must remain a single decimal digit.
- C2-MC07: nonzero normalized number in an arbitrary radix.
- C2-MC11: negative plus negative may overflow to **zero** as well as a positive result.
- C2-MC12: arithmetic right shift implements division rounded toward negative infinity.
- C2-MC14: ripple-carry versus parallel AND **circuit delay**, not a universal CPU timing rule.
- C2-FB04: nonzero k, with both signed opposites representable.
- C2-FB20: a printable key with a distinct printable ASCII SHIFT character.
- C3-MC01, C3-FB11, C3-FB12, C3-TF07, C3-TF08: textbook static complementary CMOS, stable binary inputs.
- C3-FB19: active-low NAND RS latch, not active-high NOR.
- C3-TF05: stable-input one-hot decoder.
- C3-TF11: comparable loads and the textbook ideal gate-delay model.
- C3-TF12: static feedback logic storage, not every physical storage technology.
- C4-MC12, C4-MC18: course multi-cycle implementation, skipped phases included where applicable.
- C4-TF01: ISA-level successful completion versus internal micro-operations.
- C4-TF07: the course definition of a complete von Neumann system.
- C5-TF08: second-edition LEA/NZP convention.
- C5-TF10: a valid initial one-hot NZP state.
- C5-MC09: a compact redesigned encoding without unused padding bits.
- C5-FB01: the course's operand-value classification of LEA.

Each question's Chinese explanation names the relevant assumption. Abstract
models are not presented as universal claims about all physical processors.

## Evidence used

Course files were inspected locally; they are not added to this public repository.
Page numbers below are PDF page numbers, starting at 1.

| Supplied reference | Topics checked |
|---|---|
| CHAPTER 0.pdf and CHAPTER 1.pdf | Algorithms, language levels, ISA, microarchitecture, logic and devices |
| CHAPTER 2 .pdf, pp. 5–27 | Unsigned/signed representation, arithmetic, overflow and sign extension |
| CHAPTER 2 .pdf, pp. 28–44 | Logic, floating point, radix, hexadecimal and ASCII |
| CHAPTER 3.pdf | Ideal CMOS switches/gates, truth tables, multiplexers, decoders, adders, latches and memory organization |
| CHAPTER 4.pdf, pp. 3–14 and 21–36 | von Neumann components, registers, instruction fields, phases, control and HALT |
| CHAPTER 5.pdf; CHAPTER 5 - Part 2.pdf | LC-3 encoding, addressing, datapath, condition codes and control flow |
| cs2390.pdf (third edition), preface PDF p. 17 | Explicit edition difference for LEA's condition codes |

## Verification and existing progress

`python3 build.py` requires an authored review for every stable label and a
reason for every alternative. `python3 verify_content.py` checks coverage,
source fingerprints, explicit corrections, arithmetic, truth tables and an
independent LC-3 interpreter. It reproduces the original C5-MC20 failure and
checks its repaired loop, as well as the C5-MC19 parity loop, on **all 65,536
possible R5 inputs**. The two copy-instruction encodings are also checked for
every 16-bit source value. See [content-verification.json](content-verification.json).

Browser verification submits all 244 questions, checks the rendered reasoning
for all 458 alternatives, tests correction migration, fill self-assessment,
wrong-answer review, refresh persistence, six viewport widths, and unavailable
storage. See [verification.json](verification.json).

Returning users keep the same localStorage key. Cached true/false and choice
grades are recomputed from their **original submitted choices**, using reviewed
keys. Attempts, fill self-assessment, drafts, bookmarks and position are
preserved. A changed grade carries a visible explanation. No MATH3700 storage
is modified.
