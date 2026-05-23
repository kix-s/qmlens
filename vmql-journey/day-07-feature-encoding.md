# Day 7 — Encoding classical data

> **Goal:** Understand how a regular number gets *into* a quantum circuit,
> and what the green column in the Circuit View is for.

## The idea

A neural network eats numbers. A quantum circuit eats… qubit rotations.
So before any "quantum thinking" can happen, we have to **translate**
numbers into rotations. That step is called **encoding** (or "feature
map," or "embedding," depending on who's writing).

The simplest one — **angle encoding** — is what QMLens uses:

> For each feature $x$, apply `RY(π·x)` to one qubit.

If $x = 0$, the qubit stays in $|0\rangle$. If $x = 1$, the qubit gets
flipped to $|1\rangle$. Values in between produce superpositions.

That's it. Different $x$ → different starting state → different output.
The whole network *only ever sees the data* through this encoder.

## The picture

Encoding is like a thermometer's dial:

- Cold input (x ≈ 0) → dial barely moves, qubit near $|0\rangle$.
- Hot input (x ≈ 1) → dial swings around, qubit near $|1\rangle$.
- Lukewarm → dial at 45°, qubit in superposition.

Two important consequences:

1. **You have to scale your data.** The two-moons dataset is rescaled into
   `[-1, 1]` before encoding so that the angles stay sensible. If you
   feed it raw values like `247.3`, the dial spins around so many times
   that nearby inputs become indistinguishable — a real problem called
   "the curse of expressivity" in QML.
2. **Encoding choice matters a lot.** A bad encoding is like a blurry
   camera — no model can recover what the lens never let through.

## The math (optional)

For a single feature $x$:

$$R_Y(\pi x)\,|0\rangle = \cos\!\left(\tfrac{\pi x}{2}\right)|0\rangle + \sin\!\left(\tfrac{\pi x}{2}\right)|1\rangle.$$

For the two-moons dataset (2 features, 4 qubits), QMLens **tiles**: qubits
0, 2 get feature 0; qubits 1, 3 get feature 1. That's a deliberate
choice — it gives the trainable part more "copies" to play with.

## In QMLens

1. Look at the **first column** of the Circuit View — the **green RY**
   boxes. Their labels say `RY(π·x0)` or `RY(π·x1)`.
2. These boxes have **no parameter** under them — they are *not*
   trainable. They depend on the input only.
3. In the **Parameter Heatmap**, encoding rotations do **not** appear.
   The heatmap is *trainable parameters only*.

So when you watch training, the **green column never changes**. What's
changing is *how* the rest of the circuit transforms the encoded state.

## Checkpoint

1. What's the angle applied to qubit 0 if the input feature `x0 = 0.5`?
2. Why do we rescale features into `[-1, 1]` before encoding?
3. Why are the green gates *not* in the Parameter Heatmap?

<details><summary>Answers</summary>

1. `π · 0.5 = π/2` radians — a quarter turn, perfect superposition.
2. To keep rotation angles within roughly one period, so similar inputs
   stay distinguishable.
3. Because they're determined by the input, not by training; nothing to
   tune.
</details>

## Stretch

Increase `noise` in the top bar from `0.15` to `0.40`. The two moons now
overlap more. Train and watch the **test accuracy** in the timeline. Did
the encoder change? Did training get harder? Why?

→ Next: [Day 8 — Parameterized / variational circuits](day-08-variational-circuits.md)
