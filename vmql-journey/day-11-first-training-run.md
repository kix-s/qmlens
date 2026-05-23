# Day 11 — Train your first QML model (full walkthrough)

> **Goal:** Run an end-to-end training of a quantum classifier, *narrating
> what's happening at every step*, using QMLens as your microscope.

## What the model is learning

Today's task: **two moons**.

- 120 2D points arranged as two interlocking crescents (one per class).
- Goal: predict which crescent a new point belongs to.
- Linearly **not** separable — needs a curve, which means the model has
  to learn something nontrivial.

If you've ever trained a small classical neural net on two-moons, you've
seen this dataset. We're doing it again, but the brain is now 4 qubits.

## The walkthrough

Open QMLens (`http://localhost:5173`).

### Step 1 — Set the experiment

Top bar:

| Field | Value | Why |
|-------|-------|-----|
| qubits | 4 | Plenty of capacity for a 2D problem |
| layers | 2 | Two rotation + entangle blocks |
| epochs | 30 | Enough to see a curve, fast enough to be fun |
| lr | 0.1 | Adam likes ~0.05–0.2 here |
| samples | 120 | Standard two-moons size |
| noise | 0.15 | Real-world-ish, not trivial |

Click **Train**. The status pill turns to "running."

### Step 2 — Narrate the first few epochs

Slide the **epoch slider** back to **0** and uncheck "follow latest" so
you can drive yourself.

At epoch 0:

- **Loss curve (red)** — high (somewhere around 0.9–1.0).
- **Train/test acc (blue/green)** — around 50% (random guessing).
- **Parameter Heatmap** — washed-out colors (random init around 0).
- **Entanglement Graph** — thin edges, qubits near `⟨Z⟩ ≈ 0` (encoder put
  them in superposition, nothing else has happened yet).
- **Circuit View** — most blue gates are dim; gradients haven't really
  formed because the loss is meaningless.

Now scrub to epoch 3–5:

- Loss starts dropping.
- Blue gates **light up** — the optimizer is taking aggressive steps.
- Yellow gradient norm spikes.

Epochs 10–20:

- Loss flattens slowly.
- Train accuracy creeps past 70–80%.
- Some heatmap cells "freeze" at a stable value — those parameters have
  found their resting place. Other cells keep oscillating — still
  searching.

Epochs 25–30:

- Final test accuracy lands somewhere in **0.75–0.90** for these
  defaults.
- Gradient norm has *shrunk* — fewer easy wins left.

### Step 3 — Look back

With training finished, **enable** "follow latest" off, then drag the
epoch slider all the way left to right slowly. You should be able to
*tell a story* like:

> "At epoch 0, q0 and q2 are correlated only weakly. By epoch 10, the
> CNOT ring has built strong q0↔q1 and q2↔q3 correlations. The model is
> bouncing q0's ⟨Z⟩ to about +0.5 for one class and −0.4 for the other,
> which is why the test accuracy reached 86%."

If you can narrate that, you've done in 11 days what most QML newcomers
take months to internalize.

## Checkpoint

1. Why is loss high at epoch 0?
2. Why does the gradient norm typically *decrease* as training proceeds?
3. What's the model's prediction rule (one sentence)?

<details><summary>Answers</summary>

1. The parameters are random — the model produces meaningless outputs.
2. We're approaching a minimum (or at least a flat region); small slopes
   = small gradients.
3. `predict(x) = sign(⟨Z_0⟩)`.
</details>

## Stretch

Train **twice in a row with the same settings**. Are the loss curves
identical? Why or why not? (Hint: same `seed` → same dataset *and* same
init. Compare what changes if you bump `seed` by 1.)

→ Next: [Day 12 — Reading the Entanglement Graph](day-12-entanglement-graph.md)
