# Day 2 — Measurement and probability

> **Goal:** Understand what "measuring" a qubit does, and read the
> `⟨Z⟩` numbers shown in QMLens.

## The idea

Yesterday a qubit was a spinning coin. **Measurement is letting the coin
land.** Two important consequences:

1. The result is **random** (with probabilities set by the state).
2. After measuring, the qubit is no longer in superposition — it's now
   just the 0 or 1 you got. The spin is gone.

We almost never measure once. We run the circuit *many times* and look at
the **average** outcome. That average is what QMLens displays.

## The picture

Flip your spinning coin 1000 times. If it comes up heads 730 times, you
say "this coin is biased — about 73% heads."

For qubits we use a clever convention: instead of recording 0 or 1, we
record **+1** for 0 and **−1** for 1. The average of those ±1 values is
called $\langle Z \rangle$ ("expectation value of Z"):

- $\langle Z \rangle = +1$ → always measured 0 → state is $|0\rangle$.
- $\langle Z \rangle = -1$ → always measured 1 → state is $|1\rangle$.
- $\langle Z \rangle = 0$  → equal 50/50 — pure superposition.

So **$\langle Z \rangle$ is a thermometer** for "how 0-ish is this qubit?"

## The math (optional)

If $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$, then

$$\langle Z \rangle = |\alpha|^2 - |\beta|^2.$$

That is: (probability of 0) − (probability of 1). Hence it's in [−1, +1].

## In QMLens

Under each qubit node in the **Entanglement Graph** you see something like
`⟨Z⟩=0.21`. Read it like this:

| `⟨Z⟩` | Interpretation |
|------|----------------|
| `+0.9` to `+1.0` | qubit is *almost certainly* 0 |
| `+0.1` to `+0.5` | leaning 0, but uncertain |
| around `0`       | maximum superposition / 50-50 |
| `-0.1` to `-0.5` | leaning 1, but uncertain |
| `-0.9` to `-1.0` | almost certainly 1 |

Color in the graph follows the same scale (red ↔ blue).

Try this:

1. Train with defaults.
2. Drag the **epoch slider** to epoch 0 (start) and look at `q0`'s `⟨Z⟩`.
3. Slide to the last epoch. Did `q0`'s `⟨Z⟩` change? Why?

(Spoiler: during training the model adjusts gates so that `q0` ends up
measuring something *useful* — that's literally how it makes predictions.)

## Checkpoint

1. If `⟨Z⟩ = 0`, what's the probability of measuring 1?
2. Is `⟨Z⟩` from a single measurement or from many?
3. Why does `⟨Z⟩` move during training?

<details><summary>Answers</summary>

1. 50%. Equal superposition.
2. From many — it's an average.
3. Because the circuit's gates are changing the qubit's state at each
   epoch, which changes the measurement statistics.
</details>

## Stretch

Compare the `⟨Z⟩` of `q0` (the *output* qubit) vs `q3`. Which one is the
network actually using to predict the label? Hypothesis only — we'll
confirm on Day 9.

→ Next: [Day 3 — Single-qubit gates and rotations](day-03-single-qubit-gates.md)
