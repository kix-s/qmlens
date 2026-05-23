# Day 12 — Reading the Entanglement Graph

> **Goal:** Look at the Entanglement Graph and *say something true* about
> what your circuit is doing.

## Why this view is special

Most quantum tools draw circuits. Almost none show you **what the circuit
is actually achieving** at any given moment. The Entanglement Graph does:

- **Nodes** = qubits, colored by `⟨Z_i⟩` (red = leaning 1, blue = leaning 0).
- **Edges** = $|C_{ij}|$ where $C_{ij}$ is the connected covariance
  $\langle Z_iZ_j\rangle - \langle Z_i\rangle\langle Z_j\rangle$.
- **Edge color** = sign of $C_{ij}$ (blue = positive correlation, red =
  anti-correlation).
- **Edge thickness** = magnitude.

This is "how the qubits are talking to each other, right now, on average,
over the dataset."

## Three patterns to recognize

### 1. Spiderweb (good)

All edges visible, varying thicknesses, mix of blue and red. Different
qubit pairs encode different things about the input. Usually correlates
with a model that **classifies well**.

### 2. Star (suspicious)

One qubit has thick edges to everyone, everyone else has thin edges to
each other. The model has dumped all the "interesting" correlation onto a
single hub. Sometimes fine, often a sign that more layers wouldn't help.

### 3. Disconnected (bad)

Almost no visible edges. Either:

- The model hasn't trained enough yet (try more epochs), or
- The entanglers + rotations chose to "undo" each other and the qubits
  are nearly independent. This often coincides with poor accuracy.

## In QMLens

1. Train with defaults.
2. Find the Entanglement Graph panel.
3. **Slide the epoch slider from left to right slowly.** What pattern
   does the graph evolve into?
4. Look at `q0`'s edges specifically. Since `q0` is the readout qubit,
   strong correlations from `q0` to others mean *"my prediction depends
   on what the other qubits are doing"* — which is exactly what we want.

## A small experiment

1. Train with **layers=1**. Snapshot the final graph (mental image).
2. Train with **layers=3**. Snapshot the final graph.

The 3-layer run should produce a denser web. More layers = more chances
for the CNOT ring to redistribute information. (At some point this stops
helping — see "barren plateaus" in Day 10.)

## Mapping back to the circuit

Edges in the graph are *consequences* of the CNOTs in the Circuit View:

- A direct CNOT (`q0→q1`) makes the `(q0, q1)` edge thick once `q0` is in
  superposition.
- Edges between non-neighbouring qubits (`q0 ↔ q2`) emerge because of
  CNOT *chains* across layers. The model effectively builds a longer
  "wire" out of multiple short CNOTs and rotations.

So if you see a thick `q0 ↔ q2` edge: **that wasn't built by one gate**,
it was built by the model finding a path through the circuit.

## Checkpoint

1. What does a thin edge between `q1` and `q3` mean?
2. Why is a red (anti-correlated) edge still useful information?
3. If `q0`'s edges to other qubits are all thin, what's likely wrong with
   the model's predictions?

<details><summary>Answers</summary>

1. q1 and q3's measurements are nearly independent on this dataset, on
   average.
2. "When q1 is more 0, q3 is more 1" is a perfectly useful relationship —
   it carries information about the input.
3. q0's output isn't being shaped by the rest of the circuit; the model
   is probably ignoring its capacity. Expect low accuracy.
</details>

## Stretch

Train twice with different `seed` values. Compare the final entanglement
graphs. Are they similar (the optimizer converged to the same kind of
solution) or different (multiple distinct strategies work)?

→ Next: [Day 13 — Reading the Parameter Heatmap](day-13-parameter-heatmap.md)
