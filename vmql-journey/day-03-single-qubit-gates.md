# Day 3 — Single-qubit gates and rotations

> **Goal:** Understand that quantum "gates" are just rotations of the
> spinning coin, and recognize `RY` and `RZ` boxes in the Circuit View.

## The idea

If a qubit is a spinning coin in 3D, **a gate is a way of tilting it**.

There are many gates, but the only ones you need today are the
**rotation gates**:

- `RY(θ)` — tilt the coin around the **Y axis** by angle θ.
- `RZ(θ)` — spin the coin around the **Z axis** by angle θ.
- `RX(θ)` — same idea, X axis.

Combine a couple of them and you can reach **any** single-qubit state.
That's why our trainable circuits are made of `RY` and `RZ`.

## The picture: the Bloch sphere

Picture a globe.

- **North pole** = $|0\rangle$
- **South pole** = $|1\rangle$
- **Equator** = perfect superposition
- The qubit's state is a point on the surface.

Then:

- `RY(θ)` moves the point along a **longitude** (north–south).
- `RZ(θ)` spins it around the **N-S axis** (longitude shift). This
  doesn't change measurement probabilities in the Z direction, but it
  changes the *phase* — which matters once we add more qubits.

Most importantly: **rotation angle is the knob**. Bigger θ = bigger tilt.

## The math (optional)

$$R_Y(\theta) = \begin{pmatrix} \cos\tfrac{\theta}{2} & -\sin\tfrac{\theta}{2} \\ \sin\tfrac{\theta}{2} & \cos\tfrac{\theta}{2} \end{pmatrix}$$

You don't have to memorize this. The only fact you'll use:

- `RY(0)` = do nothing
- `RY(π)` = flip 0 ↔ 1
- `RY(π/2)` = put $|0\rangle$ into perfect superposition

## In QMLens

Look at the **Circuit View** (top-left panel). Each horizontal line is a
qubit. Each box is a gate. Today, find these:

- **Green RY boxes** in the *first* column — that's the encoding (Day 7).
- **Blue RY / RZ boxes** in the later columns — these are **trainable**
  rotations. The number under each one is the current angle θ.

Try this:

1. Train.
2. Open the **Parameter Heatmap** (bottom-right).
3. Watch a single cell, e.g. row `L1·RY`, column `q0`. The color and
   number is *exactly* the θ inside that blue RY box in the Circuit View.

The whole job of training is: **find the right rotation angles.**

## Checkpoint

1. What does `RY(0)` do?
2. Where does the qubit live geometrically?
3. What is the number printed under a blue `RY` box?

<details><summary>Answers</summary>

1. Nothing — identity.
2. On the surface of the Bloch sphere.
3. Its current rotation angle θ — a single trainable parameter.
</details>

## Stretch

Set `layers=1` in the top bar and re-train. How many trainable `RY` and
`RZ` boxes are there now per qubit? (Hint: one of each per layer.)

→ Next: [Day 4 — Multi-qubit systems](day-04-multi-qubits.md)
