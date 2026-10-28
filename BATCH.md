# Execute BATCH.md: add the next 30 designs

Follow these steps in order when asked to "Execute BATCH.md". The batch adds 30 designs. The catalog is free and open source under the MIT License, so every new design is free too.

## 1. Read before writing anything

1. Re-read [CLAUDE.md](CLAUDE.md) in full. It is the single source of truth; sections 7, 9 and 16 govern every design.
2. Read [DECISIONS.md](DECISIONS.md), [registry/README.md](registry/README.md) (the authoring contract, binding line by line) and [registry/style-families.md](registry/style-families.md).
3. Read one existing design in full as a reference implementation (for example `registry/designs/hero/gridline-hero/`), and the `meta.json` and `notes.md` of every existing design in the categories you will add to.

## 2. Number the batch

Phase 6 of the specification delivered batch 1 (its commit starts with `phase 6:`). Count the commits whose message starts with `catalog: batch` (`git log --oneline --grep="^catalog: batch"`); this batch is that count plus two. Call it N: the first run of this file is batch 2.

## 3. Choose the 30 slots

1. Count the designs per category (`registry/designs/<category>/`) and compare with each category's target in section 9.1 (also `CATEGORIES` in `registry/definitions.ts`).
2. Fill the slots one at a time: each slot goes to the category with the largest remaining shortfall (target minus current count, counting slots already chosen in this batch). Break ties by the lower share of the target already built. Micro-interactions follow the same rule as every other category.
3. Give each slot a style family: prefer the families with the fewest designs in the whole catalog, and within a category prefer families it does not use yet, so every category moves toward at least four families (section 9.2).
4. Every slot is tier `free`, like every existing design. `MONETIZATION_ENABLED` (off by default) keeps the paid architecture as a reference only; do not create Pro designs.

## 4. Design each slot

- Follow every rule in section 9: the folder layout (9.4), the `meta.json` schema (9.5), the rules for every design (9.6) and the category's brief in 9.3 to the letter. Each design needs its own signature moment, real content (invented but plausible brands, people, numbers and dates) and every state its category calls for, in light and dark, from 375 to 1440 pixels.
- Never duplicate the layout or the interaction of an existing design. For micro-interactions, build from the list in the 9.3 brief first, skipping interactions the category already has.
- Invent a new brand for each design; do not reuse a brand another design uses.
- Never nest `min()` or `max()` with percentages inside `calc()`: Lightning CSS 1.33 crashes on it. Put the `min()` in a custom property and use `var()` inside the `calc()`.
- Check each design before starting the next: `pnpm validate-registry --only <slug>` and `pnpm design:check <slug>` must pass, `pnpm exec eslint` and `pnpm exec prettier --check` must be clean on the folder, and both contact sheets in `test-results/design-check/<slug>/` must look right. Never leave a half-written design folder behind; one broken folder stops the whole registry build.
- Independent categories can be designed in parallel by separate agents, each following this file and owning only its own design folders.

## 5. Record the batch

1. If a new design genuinely belongs in a curated set, add its slug to that set in `config/collections.ts`.
2. The home page's hero wall in `config/home.ts` is curated too, with two designs per style family. Replace a wall design only with a new design that shows the same family clearly better. The eight picks below the categories (`FREE_PICKS`) stay as they are unless a new design shows its category clearly better.
3. Add a changelog entry `content/changelog/<YYYY-MM-DD>-catalog-batch-<N>.mdx` that exports `metadata` with `date`, `title` and `summary` (see the existing entries) and lists every new design with its category and a link to its page.

## 6. Gates and commit

1. Run `pnpm gates` and fix every failure until all of section 16 passes, including the accessibility audits of every new design.
2. Commit everything with exactly the message `catalog: batch <N>`. Commit locally and do not add a Co-Authored-By line.
