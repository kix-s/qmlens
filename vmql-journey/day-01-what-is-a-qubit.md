# Day 1 — What is a qubit?

> **Goal:** Walk away knowing what a qubit is, what makes it different from
> a regular bit, and where to find one in QMLens.

## The idea

A regular bit is a tiny switch. It is either **0** or **1**. Nothing in
between, nothing else.

A **qubit** is a switch that, while nobody is looking at it, is allowed to
be in a *blend* of 0 and 1 at the same time. We call that blend a
**superposition**. The moment you look at it (we'll call that
"measurement" tomorrow), it snaps to either 0 or 1.

**Important:** a qubit is **not** "secretly 0 or 1 and we just don't know
which." It's genuinely in a blend until measured. That's the weird part —
and the part that makes quantum computers different.

## The picture

Imagine a coin.

- **Classical bit:** the coin is lying flat. Heads or tails. Done.
- **Qubit:** the coin is *spinning* in the air. It's not heads, not tails,
  it's "spinning-ness." When it lands (measurement), it picks a side.

How the coin is spinning — fast, slow, tilted — encodes information.
Two numbers describe it:

- $\alpha$ — how "0-ish" it is
- $\beta$ — how "1-ish" it is

with the rule $|\alpha|^2 + |\beta|^2 = 1$ (the probabilities have to add
up to 1).

## The math (optional)

A qubit's state is written:

$$|\psi\rangle = \alpha\,|0\rangle + \beta\,|1\rangle$$

The funny brackets `|·⟩` ("ket") just mean "this is a quantum state."
Don't be intimidated — it's notation, not magic. When measured:

- you get 0 with probability $|\alpha|^2$
- you get 1 with probability $|\beta|^2$

## In QMLens

1. Open http://localhost:5173.
2. Press **Train** with default settings.
3. Look at the **Entanglement Graph** panel (bottom-left). You'll see
   circles labelled `q0`, `q1`, `q2`, `q3`. **Each circle is one qubit.**

That's it for today — you've met four qubits. Tomorrow we'll learn what
the `⟨Z⟩=…` number under each one means.

## Checkpoint

1. Can a classical bit be "half 0 and half 1"?
2. What two things does $\alpha$ and $\beta$ describe?
3. How many qubits did QMLens show by default?

<details><summary>Answers</summary>

1. No. A bit is strictly 0 or 1.
2. The amplitudes for being measured as 0 and 1, respectively. Their
   squared magnitudes are the probabilities.
3. Four (the default `n_qubits` is 4).
</details>

## Stretch

Change `qubits` in the top bar to **2** and click **Train** again. How many
nodes does the Entanglement Graph now show?

→ Next: [Day 2 — Measurement and probability](day-02-measurement.md)
