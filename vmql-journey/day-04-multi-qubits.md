# Day 4 — Multi-qubit systems

> **Goal:** Understand why 4 qubits is "much more" than 4 bits, and
> recognize the four wires in the Circuit View.

## The idea

Two classical bits have **4** possible values: 00, 01, 10, 11. At any
moment, the system is in exactly one of those four.

Two **qubits** can be in a superposition of *all four* simultaneously:

$$|\psi\rangle = c_{00}|00\rangle + c_{01}|01\rangle + c_{10}|10\rangle + c_{11}|11\rangle$$

with $|c_{00}|^2 + |c_{01}|^2 + |c_{10}|^2 + |c_{11}|^2 = 1$.

For $n$ qubits you need $2^n$ amplitudes to describe the state. 4 qubits →
16 amplitudes. 20 qubits → about a million. **The state space explodes.**

That explosion is both the promise (huge expressive power) and the
challenge (hard to simulate, hard to interpret — which is why we built
QMLens).

## The picture

If 1 qubit is a sphere, 2 qubits live in a 4-dimensional sphere, 3 qubits
in 8-dimensional… we run out of human eyes very quickly. That's why we'll
*project* multi-qubit states down to summary numbers we can actually look
at (`⟨Z⟩` per qubit, correlations between qubits, etc.).

## The math (optional)

The combined state of two independent qubits is a **tensor product**:

$$(\alpha|0\rangle + \beta|1\rangle) \otimes (\gamma|0\rangle + \delta|1\rangle)
= \alpha\gamma|00\rangle + \alpha\delta|01\rangle + \beta\gamma|10\rangle + \beta\delta|11\rangle.$$

States like this are called **product states**. Tomorrow we'll meet states
that *can't* be written as a tensor product — those are the entangled
ones.

## In QMLens

In the **Circuit View**:

- Each horizontal line is a single qubit's "wire."
- A 4-qubit circuit has 4 wires (labelled `q0…q3` on the left).
- Gates that sit on **one** wire act on **one** qubit (Day 3).
- Gates that **bridge** two wires act on two qubits (Day 5).

Train with defaults and count the wires. Then change `qubits` to 3 and
retrain — count again.

## Checkpoint

1. How many amplitudes describe a 4-qubit state?
2. Is `|00⟩ + |11⟩` (up to normalisation) a product state? (Try to factor
   it as `(a|0⟩+b|1⟩) ⊗ (c|0⟩+d|1⟩)`. You'll fail — that's the point.)
3. Why don't we just plot the whole state?

<details><summary>Answers</summary>

1. $2^4 = 16$.
2. No. There's no way to factor it; it's the famous Bell state — our
   first taste of entanglement (Day 5).
3. It lives in too many dimensions. We summarise it instead.
</details>

## Stretch

If a 30-qubit system had to be stored as raw amplitudes in double-precision
floats (16 bytes each), how many gigabytes would that take? (Answer: about
17 GB. Now imagine 50 qubits.)

→ Next: [Day 5 — Entanglement and CNOTs](day-05-entanglement.md)
