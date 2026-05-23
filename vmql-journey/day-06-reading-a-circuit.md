# Day 6 — Reading a circuit

> **Goal:** Read a quantum circuit diagram left-to-right and explain to a
> friend, in plain language, what each column is doing.

## The idea

A quantum circuit is a **recipe**, read left to right. Each column is a
step. Each row is a qubit's life story.

You already know all the ingredients:

- **Wires** (rows) = qubits travelling through time.
- **Single-wire boxes** = rotations / single-qubit gates.
- **Two-wire bridges** = entangling gates (CNOTs).
- **The M at the end** = "now look."

## The picture: a kitchen

Think of each qubit as a pot moving along a conveyor belt. Stations
above the belt do things to the pot:

| Station | Quantum equivalent |
|---------|--------------------|
| "Add ingredient X based on the recipe" | encoding gate (data in) |
| "Stir at angle θ" | trainable rotation |
| "Pour pot A into pot B if A is full" | CNOT |
| "Taste it" | measurement |

A whole recipe = a quantum algorithm.

## The structure QMLens uses

For our variational classifier, every circuit looks like this:

```
[ Encoding ] [ Rotations L1 ] [ Entangle L1 ] [ Rotations L2 ] [ Entangle L2 ] ... [ M ]
   green          blue            purple           blue            purple        yellow
```

1. **Encoding** (green) — push the classical input into the qubits.
   *Fixed*, not trainable.
2. **Rotations** (blue) — `RY` then `RZ` on every qubit. *Trainable.*
3. **Entangle** (purple) — ring of CNOTs to mix information across qubits.
   *Fixed.*
4. Repeat 2 + 3 once per **layer**.
5. **Measure** (yellow) `q0` — that's the model's output.

This pattern (encode → rotate → entangle → rotate → entangle → measure)
is the most common "variational ansatz" in real research. You're already
looking at one.

## In QMLens

1. Set `qubits=3`, `layers=2`, click **Train**.
2. With your finger on the screen, **read aloud** what each column is
   doing as you trace left to right. Use the color legend at the top of
   the Circuit View panel.
3. Hover over a blue gate and note its `param_index` (visible in the
   subtext under each rotation). That index `[L, Q, R]` says
   "layer L, qubit Q, rotation R (0=RY, 1=RZ)" — it's the same index
   used in the Parameter Heatmap rows.

## Checkpoint

1. What is the **first** thing a circuit does to the qubits?
2. What is the **last** thing it does?
3. If a circuit has 3 qubits and 2 layers, how many trainable rotation
   gates does it have?

<details><summary>Answers</summary>

1. Encoding — load the classical data in.
2. Measurement.
3. 2 rotations × 3 qubits × 2 layers = **12** trainable gates.
</details>

## Stretch

Predict: if you doubled `layers` from 2 to 4, how would the Circuit View
change? Try it and confirm.

→ Next: [Day 7 — Feature encoding](day-07-feature-encoding.md)
