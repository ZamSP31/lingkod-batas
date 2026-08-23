# Lingkod Batas — UI Prompt Guide (for Heather)

This is a copy-pasteable reference for prompting an AI tool (Claude, v0, Cursor, etc.) to update the UI. It's built from two mockups already made for the homepage and the attorney review queue — use it as a starting brief, then swap in whichever page/component you're actually working on.

---

## 1. The design system (paste this into any UI prompt as context)

```
Design tokens for Lingkod Batas:

COLORS
--navy: #16233F          (primary structural color — sidebars, headers)
--navy-deep: #0E1830      (darkest navy — hero backgrounds, footer)
--maroon: #7C2635         (accent — flags, primary buttons, active states)
--maroon-bright: #9C3245  (hover state for maroon elements)
--parchment: #F2ECDF      (page background)
--parchment-dark: #E8DFCB (secondary background, dividers)
--ink: #201D19            (primary text)
--ink-soft: #514C43       (secondary/muted text)
--gold: #B08D4F           (rare accent — seals, stamps, trust icons only)
--green: #4C7A5E          (used only for "clear/no risk" states)
--line: rgba(32,29,25,0.12) (borders, dividers)

TYPOGRAPHY
- Display/headings: 'Fraunces' (serif) — used for titles, document names, anything that should feel like a legal document heading. Weight 500, tight letter-spacing (-0.01em to -0.015em).
- Body/UI text: 'Public Sans' (sans-serif) — all interface text, labels, buttons, paragraphs.
- Data/meta: 'IBM Plex Mono' — clause numbers, statute citations, timestamps, status pills. Anything that reads like a reference number or code gets mono.

RULES
- Maroon is the ONLY accent used for action/attention (buttons, flags, active nav). Don't introduce a second accent color.
- Gold is reserved for rare, special moments (seals, trust badges) — never used for buttons or regular UI.
- Every risk/status indicator pairs a colored dot with a mono text label (e.g. "● High") — never color alone.
- Borders are 1px, radius is small (3–8px). Nothing pill-shaped except status badges.
```

---

## 2. Design principles behind the mockups

Paste this alongside the tokens so the AI understands _why_, not just _what_:

```
- The signature visual motif is an annotated contract clause: a flagged phrase
  (maroon highlight + underline), a margin note citing the specific law article,
  and — where appropriate — a stamp/seal implying attorney sign-off. This should
  show up anywhere the product's core value (AI flags, attorney approves) needs
  representing visually. Don't replace it with generic icons or stock illustration.

- Never use three identical cards in a row. If there are 3 items of unequal
  importance, use an asymmetric layout (one large "anchor" card + smaller
  supporting cards — a bento grid), not a uniform grid.

- Numbered steps (01, 02, 03) are only used when the content is a REAL sequence
  (e.g. a document's actual processing pipeline). Don't use numbering as decoration.

- Every screen needs at least one moment of real product evidence — a mockup of
  actual data, a mini dashboard, a real clause excerpt — not just claims in text.

- Icons should be specific to the legal/document domain where possible
  (shield/scale/document/seal shapes), not generic dashboard icons
  (arrows, plain circles, unlabeled clocks).
```

---

## 3. Prompt template (fill in the blanks and paste)

```
I'm working on [PAGE/COMPONENT NAME] for Lingkod Batas, a legal-tech platform
for Philippine solo/freelance attorneys reviewing contracts.

Here is our design system: [paste Section 1 tokens]
Here are our design principles: [paste Section 2 principles]

Current version of this page/component:
[paste your current .tsx code or describe what's on screen]

What I want changed:
- [specific thing #1 — e.g. "the risk indicators only use color, no label"]
- [specific thing #2 — e.g. "the three cards look identical, want one to be an anchor"]
- [specific thing #3]

Please keep the component's existing props/data structure and just change the
visual layer (JSX structure + Tailwind classes), unless a structural change is
needed to fix one of the issues above — call that out explicitly if so.
```

---

## 4. Reference examples (attach these when prompting)

Two full HTML mockups were built as visual references — attach them (or relevant excerpts) when asking an AI to restyle a specific piece:

- **`lingkod-batas-homepage.html`** — marketing/landing page. Reference for: hero layout, the annotated-clause signature element, the chain-of-custody step pattern, bento grids, the security/trust band.
- **`lingkod-batas-review-queue.html`** — attorney dashboard screen. Reference for: sidebar nav styling, clause list with risk tags, the clause detail panel (quoted clause + why-flagged + legal-basis blocks), and attorney action buttons (Approve / Override / Edit note).
- **`docs/mockups/lingkod-batas-my-contracts.html`** — attorney contracts dashboard & table screen.

---

## 5. Quick checklist before you ship a UI change

- [ ] Does every status/risk indicator have a text label, not just a color?
- [ ] Is maroon the only "action" accent on this screen?
- [ ] If there are 3+ similar cards, is at least one visually different (size/weight) to avoid a flat grid?
- [ ] Does Fraunces show up somewhere as a heading, and Plex Mono somewhere as metadata?
- [ ] If this involves the AI-flag → attorney-approval flow, is there an actual action the attorney can take (not just a read-only display)?
