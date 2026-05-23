# Day 13 — Reading the Parameter Heatmap

> **Goal:** Use the Parameter Heatmap to understand which parts of your
> model are "doing the work" and which are dead weight.

## Why this view exists

A trained QNN is, fundamentally, a list of numbers (rotation angles). The
heatmap shows you all of them at once, with two extra superpowers:

- It's laid out **the same shape as the circuit** — rows are layers, cols
  are qubits, so you can look at the heatmap *and* the Circuit View at
  the same time and the gates correspond one-to-one.
- It's **time-aware** — slide the epoch slider and watch the parameters
  drift, just like watching weights in a classical NN's training (which
  almost no classical NN tool actually shows!).

## Three patterns to recognize

### 1. "Carved" parameters

Cells whose color stabilizes within a few epochs and stays there. These
gates locked in early — they encode a feature the model decided was
worth committing to.

### 2. "Wandering" parameters

Cells that keep changing color even at the end of training. Either:

- The model is still learning (try more epochs).
- The parameter is **redundant** — multiple settings give similar loss,
  so the optimizer wanders.

### 3. "Dead" parameters

Cells that stay near 0 the entire run. The model isn't using them.
Sometimes this is a sign your circuit has *too much* capacity, sometimes
it's a sign of a barren plateau.

## In QMLens

1. Train with defaults.
2. Open the Parameter Heatmap.
3. Slide back to epoch 0 — all cells should be pale (initialization was
   `0.1 · randn`, so all small values).
4. Slide to epoch 30. Identify:
   - **The boldest cell** (largest |θ|). Where is its corresponding gate
     in the Circuit View?
   - **A cell that didn't move much.** Where's its gate?

You're literally seeing which gates the model decided to "lean on."

## Cross-referencing with the circuit

The heatmap rows are labelled `L1·RY`, `L1·RZ`, `L2·RY`, `L2·RZ` (for 2
layers). For each (layer, axis) row, the columns are qubits 0…N−1.

So `L2·RZ`, `q1` in the heatmap **is** the blue `RZ` box on the `q1` wire
in the second rotation column of the Circuit View. Find it. Confirm the
angle printed under that gate matches the number in the heatmap cell.

If they match: congratulations, you're reading a quantum circuit like a
quantum ML researcher.

## A common reflex

When you look at a successful run, you'll often notice:

- Layer 1's parameters tend to be smaller (close to data — fine adjustments).
- Later layers' parameters tend to be larger (combining + amplifying).

This isn't a law — it's a frequent pattern, similar to early-vs-late
layer behaviour in classical deep networks.

## Checkpoint

1. What does a heatmap row label of `L2·RZ` correspond to in the circuit?
2. If most cells in `L3` stay near 0, what might that suggest?
3. What's the heatmap's "epoch 0" supposed to look like for our default
   init?

<details><summary>Answers</summary>

1. The RZ rotations of layer 2 — one per qubit, shown across the row.
2. Layer 3 is contributing little — the model could probably do without
   it. Worth trying `layers=2`.
3. Very washed-out, all values small (initialised from `0.1·randn`).
</details>

## Stretch

Train two models with `layers=2` and `layers=4` and the same other
settings. In the 4-layer run, do *all* layers light up, or do the early
layers do most of the work? Argue from the heatmap.

→ Next: [Day 14 — Putting it all together](day-14-putting-it-together.md)
