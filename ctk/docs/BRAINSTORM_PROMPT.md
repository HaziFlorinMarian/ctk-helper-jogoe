# Prompt for an external AI: brainstorm novel solver improvements

Copy and paste everything below into a fresh chat with another model (GPT-5,
Gemini, etc.) for a second opinion on what to try next.

---

I'm building a heuristic solver for the Metin2 minigame "Catch the King" and
have hit a plateau at ~43.8% gold rate. I want a second opinion on novel
mechanisms I haven't tried yet. Please challenge my framing if it's wrong.

## Game rules

- **Board**: 5×5 = 25 face-down cards. Composition: 7×"1", 4×"2", 5×"3", 5×"4", 3×"5", 1×"K".
- **Hand sequence (12 cards, fixed)**: `1,1,1,1,1,2,2,3,3,4,5,K`. Each turn the
  player has one hand card and either flips a face-down cell or "catches" a
  face-up unscored cell.
- **Reveal a face-down with hand=h, value v**:
  - `v < h` → "chain": cell scores `v×10`, turn continues, can flip again.
  - `v == h` → "score": same points, turn ends.
  - `v > h` → "lose": no points, turn ends, cell stays revealed-but-unscored.
  - `v == K` against `h ≠ K` → lose. K is only catchable by hand=K.
- **Flash mechanic**: when a cell is flipped, if any of its 8 neighbors is a
  face-down 5, the card "flashes". Hand=5 turns are special: revealing a cell
  while the flash fires triggers a *catch event* (no points, turn ends, cell
  stays revealed-unscored). Hand=5 can chain-catch lower values **only** if
  the cell is "safe-for-5" (no adjacent face-down or revealed 5).
- **Bingo lines**: 12 lines (5 rows + 5 cols + 2 diagonals). When every cell
  in a line is revealed AND scored, +10 bonus.
- **Points**: `1`=10, `2`=20, `3`=30, `4`=40, `5`=50, `K`=100. Theoretical
  max if every cell scored + all bingos = 750 + 120 = 870.
- **Goal**: reach 550 points (gold chest). Silver = 400-549, bronze = 100-399.

## Solver architecture (current)

Greedy 1-step EV with hand-aware scoring. For each hidden cell `c`, score:
```
ev + chainBonus + bingoBonus + bingoProgressBonus + infoBonus
   + spreadBonus + centerBias - kPenalty + kHuntBonus
   - catchPenalty (hand=5 only)
```
Where:
- **ev**: expected immediate points from flipping `c` with current hand.
- **chainBonus**: `chainP × avgRemainingPoints × chainBonusMul` — approximates
  expected continuation if this flip chains.
- **bingoBonus**: +10 per line this flip would complete.
- **bingoProgressBonus**: `Σ over incomplete lines containing c of (othersDone/4)²` × weight.
  This is the most recent win (+1.4pp).
- **infoBonus**: Shannon information gain (in bits) about the 5-placement,
  computed exactly from enumerating all consistent 5-positions consistent
  with current flash constraints.
- **catchPenalty**: hand=5 only; `P(adjacent face-down is 5) × penalty`.
- **kHuntBonus**: `P(c=K) × kHuntWeight(state)` where weight scales with
  score-gap-to-target.
- **reservedFor5Turn skip**: for hands ≤ 4, if `c` is must-be-5 OR safe-for-5,
  subtract `evLater` from the score (hand=5 will handle it).

Plus:
- Hardcoded **opener `[1,3,16,18]`** for the first 4 hand=1 turns (a 4-cell
  dominating set of the 5×5 8-grid; covers every cell with 4 reveals so all
  5s become flash-visible). +2pp over greedy.
- **Late-game expectimax** at handIndex≥10 with ≤6 hidden cells.

## Decomposition of the 25-pt gap to gold

Mean score = 525. Target = 550. Average per-game leak by bucket:
- **K capture**: 94% → ~6 pts/game leak (mostly luck-bound — when K is hidden
  at K-turn, we guess based on P(K)).
- **5-turn yield**: avg 0.66 of 3 fives caught = 33 pts of 150 (mostly
  luck-bound: many 5s end up in unsafe spots).
- **Bingos**: 3.4 of 12 completed = 35 pts of 120 (rest mostly unattainable).
- **Revealed-unscored 4s**: 1.66/game × 40 pts = ~66 pts/game walked away
  from. Splits into 0.87 permanently-unsafe (next to revealed-5, structural)
  and 0.78 tentatively-unsafe (next to hidden possible-5, theoretically
  recoverable but the existing `infoBonus` already captures most of it).
- **Hidden cells at end**: 4.5/game = ~150 pts (most are unreachable — turns
  end when hand=5 or hand=K play out).

## What worked (shipped)

| Change | Effect |
|---|---|
| Random-search tuning of weights | +8.5pp |
| Hardcoded `[1,3,16,18]` opener | +1.7pp |
| Shannon info gain about 5-placement | +0.5pp |
| Joint catch penalty (placement enumeration) | neutral, kept for correctness |
| **Bingo-progress accumulator** (squared progress × line liveness) | +1.4pp |

## What didn't work (genuinely tested, reverted)

- **Bounded mid-game expectimax with various leaf evaluators**: all worse
  than baseline because budget-exhausted leaves return state.score with no
  future estimate.
- **Risk-aware objectives** (`riskWeight`, `urgencyFactor`): failed.
- **Phase-split weight tuning** (early/mid/late values): tuner found no
  signal — top configs landed within 0.1pp of flat baseline.
- **Liveness discount on bingo lines** (zero out lines containing stuck 5s):
  neutral.
- **Plant penalty** (penalize pre-5 reveals that orphan revealed chain
  catches if they turn out to be 5s): neutral. Existing chain bonus + EV
  already steer away from worst cases.
- **Free-the-prisoner bonus** (hand=5 face-down reveals that unblock
  tentatively-unsafe 4s): +0.03pp. The existing `infoBonus` already
  rewards reveals that disambiguate 5-positions, which mostly overlaps.
- **Adaptive opener** (branch on flash/value of flip 1, K-detection):
  neutral. The structural property of the dominating set matters more than
  per-game adaptation.
- **Brute-force opener search over all 79 4-cell dominating sets**: no
  robust winner — top candidates cluster within 1 SE; brute-force "winner"
  on one seed lost on another.
- **Heuristic-only opening** (no hardcoded opener): -2pp.

## Diagnostic findings

- **Per-hand regret of swap-to-second-best**:
  - hand 5: solver clearly right (swap hurts 12% vs helps 6%).
  - hands 1-4: near-coin-flip (helps 25-30%, hurts 25-30%).
  - hand 1 most wobbly (15.6% of moves would flip gold-vs-not on swap).
- 7.4% of all hidden-reveal moves are pivotal (would flip gold↔not-gold if
  swapped to second-best).

## What I haven't tried

1. **K-information gain bonus** — Shannon info about K-location (analogous to
   the 5-placement info gain that worked). Currently the K-cell info is only
   captured via `kHuntBonus = P(c=K) × weight`; reveals that *partition*
   K's possible locations get no credit.
2. **Real 2-ply lookahead at hand=4** — for each candidate reveal, simulate
   resulting state's expected hand=5 yield. Browser-too-expensive but
   feasible offline. Highest theoretical lift.
3. **Heuristic leaf evaluator for expectimax** — let the search go deeper
   (handIndex≥8, more hidden cells) by replacing leaf `state.score` with
   an estimate.
4. **Learned eval** — regress (state features → final score) on 100k
   self-play games, use as scoring function or expectimax leaf.
5. **Bingo line interaction modeling** — current bonus is a sum over lines
   containing c; lines that share cells *compete*. A non-additive scheme
   (e.g. max over lines, or marginal contribution accounting for shared
   cells) might price interactions better.

## My ask

Are there mechanism categories I'm missing? Specifically:
- Information-theoretic signals other than 5-placement / K-placement entropy?
- Action-ordering improvements within a hand=5 turn (we currently chain-catch
  before face-down reveal; could the reverse ever beat?)?
- Game-state features that correlate with gold/not-gold and could be folded
  into scoring (e.g. "probability of K being hidden at K-turn")?
- Anything from related domains (Minesweeper solving, deduction games,
  bandit problems with information-gain trade-offs) that maps onto this?

Please be skeptical: tell me which of my proposals is unlikely to pan out
and why. Cite concrete mechanisms, not vibes. If the solver is genuinely
near saturation under this scoring shape, say so.
