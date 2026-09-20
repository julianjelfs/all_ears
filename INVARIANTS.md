# Invariants

Each line states something a test can fail on. The test that pins it is named beside it.

## Question generation

1. Every note of every generated question lies within MIDI 40–64 inclusive. — `questions.test.ts` › I1
2. A melodic interval question sounds two notes exactly the picked number of semitones apart; ascending gives `[lo, lo + s]`, descending gives `[lo + s, lo]`. — `questions.test.ts` › I2
3. Harmonic dyads ignore the direction setting: their notes are always in ascending order. — `questions.test.ts` › I3
4. A triad question is root position — its notes are the root plus the triad's offsets, in order. — `questions.test.ts` › I4

## Weighting

5. An item with fewer than four recorded attempts weighs 1.4; above that, weight is `1 + 2.6 * (1 - accuracy) ^ 1.2`, so a perfect item weighs 1.0 and a 0% item weighs 3.6. — `questions.test.ts` › I5
6. With history weighting off, selection is uniform across the pool. — `questions.test.ts` › I6
7. `weightedPick` only ever returns an item from the pool it was given. — `questions.test.ts` › I7

## Buckets and stats

8. Bucket routing: melodic in any direction banks to `melodic`; harmonic intervals to `harmonic`; harmonic triads to `triads`. — `stats.test.ts` › I8
9. Folding a finished run into the stats increments `asked` per answer and `correct` per right answer, and touches no other bucket. — `stats.test.ts` › I9
10. The session list keeps at most the last 60 entries. — `stats.test.ts` › I10
11. Results rows are sorted weakest first, and the "where the misses were" line names at most three items, all scoring below 100%. — `stats.test.ts` › I11
12. Confusions count wrong answers only, are sorted by frequency and capped at five. — `stats.test.ts` › I12
13. A trend appears only once a bucket has four sessions; it is the newer half's mean accuracy minus the older half's, in points, and reads "flat" at zero. — `stats.test.ts` › I13
14. A bar is drawn in accent below 70% accuracy and in neutral-800 at or above it. — `stats.test.ts` › I14

## Persistence

15. Config, stats, sessions and the last run survive a save/load round trip. — `storage.test.ts` › I15
16. A localStorage that throws, or holds unparseable JSON, yields defaults rather than an exception. — `storage.test.ts` › I16
17. A stored config missing newer fields is filled in from the defaults. — `storage.test.ts` › I17

## Pool and presets

18. A preset replaces the interval selection outright rather than adding to it. — `music.test.ts` › I18
19. The pool is exactly the selected intervals, or the selected triads, for the active bucket. — `music.test.ts` › I19
20. Every sample URL names its note with a flat and the right octave — MIDI 40 is `E2`. — `music.test.ts` › I20
21. A preset chip reads as selected exactly when the current selection matches that preset's set, whatever the order. — `music.test.ts` › I21
