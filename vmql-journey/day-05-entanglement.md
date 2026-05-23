# Day 5 — Entanglement and CNOTs

> **Goal:** Understand what entanglement *is*, what a CNOT gate does, and
> what the edges in the Entanglement Graph mean.

## The idea

Two qubits are **entangled** when you can't describe them separately
anymore. The phrase to memorise:

> *Knowing the result of measuring one qubit changes what you expect for
> the other — even before you measure it.*

It is **not** "they communicate faster than light." It's "their fates were
linked at the moment they got entangled, so once you peek at one you
already know something about the other."

## The picture

Imagine two coins that were sealed inside a special box together. After
the box opens:

- Whenever coin A lands heads, coin B *always* lands heads.
- Whenever coin A lands tails, coin B *always* lands tails.

Before you look, each coin individually is 50/50 — but the **joint**
behaviour is locked. That's a Bell state, the simplest entangled state:

$$\tfrac{1}{\sqrt{2}}\bigl(|00\rangle + |11\rangle\bigr).$$

## How we create entanglement: CNOT

The workhorse gate is **CNOT** (controlled-NOT):

- It has a **control** qubit and a **target** qubit.
- If the control is in $|1\rangle$, flip the target.
- If the control is in $|0\rangle$, leave the target alone.
- If the control is in a **superposition**, the target ends up in a
  superposition that *depends on* the control. → entanglement.

Concretely:

1. Start with two qubits in $|00\rangle$.
2. Apply `H` (or `RY(π/2)`) on q0 → q0 is now 50/50.
3. Apply `CNOT(q0 → q1)` → you get the Bell state above.

A recipe for entanglement: **put one qubit in superposition, then CNOT it
into another.**

## In QMLens

Two places to look:

1. **Circuit View** — the **purple** gates with a dot on one wire and a
   circled-plus on another are CNOTs. They appear in a "ring" pattern:
   `q0→q1`, `q1→q2`, `q2→q3`, `q3→q0`. That ring is what spreads
   information across the whole register.

2. **Entanglement Graph** — the **edges** between qubits. Their thickness
   shows how strongly correlated those two qubits are right now. At the
   very first epoch the edges should be thin (random initial state →
   little useful correlation). Train, slide the epoch slider, and watch
   the edges change.

The edge value is

$$C_{ij} = \langle Z_i Z_j \rangle - \langle Z_i\rangle\langle Z_j\rangle,$$

which is exactly the **classical covariance** of the two ±1 measurement
outcomes. If $C_{ij} = 0$, the two qubits behave independently. If
$|C_{ij}|$ is large, knowing one tells you a lot about the other.

(Note: correlation isn't *strictly* the same as entanglement, but for our
circuits and our purposes it's a great visual proxy.)

## Checkpoint

1. What does CNOT do if the control is $|1\rangle$?
2. Why doesn't CNOT entangle anything if both qubits start in $|0\rangle$?
3. What does a thick edge between `q1` and `q3` in QMLens tell you?

<details><summary>Answers</summary>

1. Flips the target.
2. Because the control isn't in a superposition. CNOT only creates
   entanglement when its control is "undecided."
3. The measurements of q1 and q3 are strongly correlated — they're not
   acting independently.
</details>

## Stretch

In the Circuit View, identify the CNOT that "wraps around" from `q3`
back to `q0`. Why might a ring shape (rather than a line) be a good
default?

→ Next: [Day 6 — Reading a circuit](day-06-reading-a-circuit.md)
