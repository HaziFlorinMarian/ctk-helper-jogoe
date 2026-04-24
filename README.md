# Catch the King Helper

A browser-based helper for Metin2's **Schnapp den König** minigame. Tracks the board state you build up as you play, deduces where the 5s and the King are, and suggests the next move using a scoring model tuned to reach the **550-point gold chest** rather than just the 400-point silver.

Target URL (once deployed): `https://<user>.github.io/<repo>/`. No build step — pure HTML/CSS/JS that GitHub Pages can serve directly.

## The game

- **Board:** 5×5 grid, 25 face-down cards. Composition: `7×1, 4×2, 5×3, 5×4, 3×5, 1×K`.
- **Hand:** 12 cards played lowest-first: `5×1, 2×2, 2×3, 1×4, 1×5, 1×K`.
- **Each turn:** flip a face-down card, compare with your hand card.
  - Higher than revealed → score revealed value, **chain** (flip again).
  - Same as revealed → score, turn ends.
  - Lower than revealed → no score, turn ends. The cell stays revealed-but-unscored and can be **caught later** by a higher hand card.
- **5-turn special:** any adjacent 5 (face-down or already revealed) catches your 5-card — 0 points, turn ends.
- **K-turn special:** clicking on the K (face-down OR face-up) with the K-card scores +100 and ends the game.
- **Bingo:** every row, column, and both diagonals. When every cell on a line has been both revealed AND **scored**, +10 bonus.
- **Target:** 10 points for any prize, but **550 = gold chest** (the real goal).

## What the helper does

### Input
Hover a cell and use the keyboard / mouse:

| Action | How |
|--------|-----|
| Reveal a face-down cell with no flash (neighbors safe) | `1–5` / `K` / `6` |
| Reveal a face-down cell with flash (a 5 is adjacent) | `Shift` + value key |
| Catch a revealed-but-unscored cell with the current hand card | **Click** the dim cell |
| Undo last action | `Backspace` or Undo button |
| Reset | `Esc` or Reset button |

### State tracking (`game.js`)
- Each cell has `{state, value, flashed, scored}`.
- Hand progression auto-advances based on hand vs. revealed value comparisons.
- Score is tallied including base card values and bingo bonuses.
- `completedBingos` set prevents double-counting.
- Undo supports both reveal and catch events, including bingo rollback.

### Deduction (`game.js`)
- **`mustNotBe5`**: from no-flash reveals — none of the flipped cell's neighbors can be a 5.
- **Flash constraints**: a flashed reveal means "≥1 adjacent cell IS a 5." If a revealed-5 neighbor already explains the flash, the constraint adds no new info about face-down cells.
- **Exact `fiveProbabilities`** via enumeration: lists every subset of candidate cells of size `remaining.5` that satisfies all active flash constraints; `P(5|c)` is the fraction of those subsets containing `c`. Tractable because `remaining.5 ≤ 3`.
- **`cellValueDistribution`** combines exact `P(5|c)` with uniform distribution of non-5 remaining values over non-5 slots.
- **`isSafeFor5Turn(cell)`**: true iff every neighbor is either revealed-non-5 or hidden with `P(5)=0`. Used both for solver scoring and for the green "safe-flip" visual.
- **`isTrivialSweep(state)`**: every hidden cell has fully-determined 5-status AND the King's location is known. When true, the board is effectively solved and it's safe to just chain through greens — triggers the money-face easter egg on each safe green.
- **`maxPossibleRemaining(state)`**: optimistic ceiling on remaining score, counting every still-catchable value plus unclaimed bingo lines.

### Visual state (`ui.js`, `style.css`)
| State | Visual |
|-------|--------|
| Revealed + scored | Normal, color-coded by value |
| Revealed + unscored | Dimmed (50% opacity), cursor changes to pointer |
| Revealed + unscored + unclaimable on 5-turn (5 adjacent) | Heavier dim, `not-allowed` cursor |
| Must-be-5 (deduced P(5)=1) | Rendered as a big red 5 with dashed border |
| Possible-5 (P(5)>0, constrained) | Red tint, percentage label |
| Confirmed not-5 (P(5)=0) | Green border |
| Safe to flip with hand=5 (no 5 adjacent) | Thick green outline + green tint |
| Solver suggestion | Pulsing gold outline (works on both hidden and revealed cells) |
| Trivial sweep + safe green | Wobbling money-eyes 😵‍💰 face overlay |

Sidebar shows current card, turn hint, score with a **ceiling (score + max remaining)** — red when 550 is mathematically out of reach, green when you've already secured gold — plus remaining-on-board counts and the solver's reasoning string.

### Solver (`solver.js`)

Priority order each turn:

1. **K-turn special**: if hand=K and the K is already revealed, point at that exact cell for the +100 click.
2. **Chain catches**: any revealed-unscored cell with value `<` hand. Pick the highest-value one. For hand=5, filter to safe-for-5 cells only (else the catch is ignored).
3. **Face-down flips** (normal scoring pool) — scored per cell via `scoreCell`:
   - Expected immediate points `ev` from the hand/value comparison.
   - **Chain bonus** `chainP × avgPts` — expected value of continued chain turns.
   - **Information bonus** `uncertainty × (1 + flashInfo × 0.9)`:
     - `uncertainty` = Shannon entropy of the cell's value distribution (normalized).
     - `flashInfo` = count of hidden neighbors whose 5-status the flash signal can still distinguish. **Zero** if a revealed or deduced 5 is adjacent (flash outcome already fixed — no new info).
   - **Bingo bonus** `+10` only when every other cell in a completable line is already revealed-and-scored.
   - **Dynamic K-hunt bonus** `P(K|cell) × kHuntWeight(score)`. Weight formula: `min(450, 100 + (550−score) × 1.1)` — scales up when we need the K-turn's +100 to reach gold, backs off once we're comfortable.
   - **Catch penalty** for hand=5: `P(any 5 adjacent) × 500`.
   - **Reserved-for-5-turn branch** for safe-for-5 or must-be-5 cells during pre-5 hands: score is `ev − evLater + info + kHunt`. Bingo and chain cancel across turns, so they don't appear.
4. **Same-value catches** (revealed-unscored cells with value == hand): score `pointsFor(value)`, but only when **no higher hand can chain-catch it later**:
   - hand=2 catching 2 → always skip (hand=3 will chain it later).
   - hand=3 catching 3 → always skip (hand=4 will chain it later).
   - hand=4 catching 4 → only if unsafe-for-5 (hand=5 can't chain safely).
   - hand=5 catching 5, hand=K catching K → always valid (gated on safe-for-5 for hand=5).

Reasoning string (shown in the suggestion block) exposes each component so you can see *why* a move was picked: `E[points]`, chain %, info, bingo, K-hunt, reserved, catch risk.

## File layout

| File | Role |
|------|------|
| `index.html` | Static markup: header, board grid, sidebar (card / score / ceiling / remaining / suggestion / buttons), help box, disclaimer |
| `style.css` | Dark theme, cell states, money-face animation, responsive layout |
| `game.js` | Pure state model: cells, remaining, hand index, score, bingos. No DOM. Exports `createState`, `recordReveal`, `catchCell`, `undo`, `currentCard`, `deriveConstraints`, `fiveProbabilities`, `cellValueDistribution`, `isSafeFor5Turn`, `isTrivialSweep`, `maxPossibleRemaining`, and the `BINGO_LINES` / `NEIGHBORS` geometry tables. |
| `solver.js` | Suggestion engine. Pure function of state — no mutation. Exports `suggestMove`. |
| `ui.js` | DOM rendering (`renderBoard`, `updateBoard`, `updateSidebar`), hover/click/keyboard binding helpers. |
| `main.js` | Wiring: creates state, binds events, calls `refresh()` which recomputes suggestion and redraws. |

## Deployment

1. Create a public GitHub repo, push all files.
2. Repo → Settings → Pages → Deploy from a branch → `main` / `root`. Wait ~1 minute.
3. Site is live at `https://<user>.github.io/<repo>/`.
4. Any push to `main` rebuilds within a minute. Hard-refresh browsers (Ctrl+Shift+R) — ES modules cache aggressively.

## Strategy baked into the helper

1. **Spend pre-5 hands on cells the 5-turn can't reach.** Cells adjacent to a 5 are unreachable during the 5-turn's chain; they can *only* be claimed by lower hand cards. Safe-for-5 cells are "reserved" and not credited their full value during hand=1–4.
2. **Don't same-value catch at hand=2 or 3.** A higher hand will chain-catch the cell without ending a turn, banking the same points + more chain potential.
3. **Chain over catch at hand=4** when safe unsafe-for-5 hidden cells still exist. Catching the +40 ends the turn; flipping chains through the risky-neighborhood cells first.
4. **Reveal the K whenever possible.** Any reveal of the K (even during a hand=1 turn that scores 0) converts the K-turn from a `100/N` guess into a guaranteed +100. The K-hunt weight scales with the gap to 550, so low-score boards lean hard into K-hunting.
5. **Bingo is a scoring event, not a reveal event.** Only completes when every cell on the line is actually caught, so the solver doesn't overvalue flips into lines with dim (unscored) cells.

## Known limits

- Solver is greedy one-step with an approximate chain bonus. No Monte-Carlo rollouts.
- Expected-value math breaks down late-game when a few cells remain and deduction chains deepen. Disclaimer banner warns about this.
- Same-value catch logic assumes each future hand card is "available" — doesn't model the probability that a hand=3 turn ends early due to an unrelated over-value flip before reaching the revealed 2.
- `maxPossibleRemaining` is an optimistic upper bound; realistic achievable is usually lower because hand-card order limits what can actually be caught in sequence.
- The helper trusts player input: if you type a reveal with the wrong flash state, probabilities and suggestions will be wrong. Undo fixes it.
