# Day 2 — Measurement and probability

> **Goal:** Understand what happens when we measure a qubit, and learn to
> read the `⟨Z⟩` values shown in QMLens.

## The idea

Yesterday, we described a qubit as a spinning coin. **Measurement is like
letting the coin land.**

Two important things happen:

1. The result is **random**, with probabilities determined by the qubit's
   state.
2. After measurement, the qubit is no longer in superposition. It has
   collapsed to the result you observed: either `0` or `1`. The spin is
   gone.

But a single measurement does not tell us the probabilities. To estimate
them, we repeat the same experiment many times.

A **quantum circuit** is simply a repeatable sequence of steps applied to
one or more qubits. We will explore those steps in the next few days. For
now, think of a circuit as a small experiment that we can run again and
again.

Each run is called a **shot**:

1. Prepare the qubits in their starting state.
2. Apply the circuit.
3. Measure the qubits.
4. Record the result.
5. Reset and repeat.

On real quantum hardware, we estimate the measurement statistics by
running many shots. QMLens may calculate the same values directly when
using a simulator.

## The picture

Imagine spinning the same type of coin 1,000 times. If it lands heads-up
730 times, you conclude that the coin is biased: it has about a 73%
chance of landing heads-up.

For qubits, we use a useful convention:

- Record **+1** when the measurement result is `0`.
- Record **−1** when the measurement result is `1`.

The average of those values is called `⟨Z⟩`, pronounced **"expectation
value of Z."**

- `⟨Z⟩ = +1` → always measured as `0`.
- `⟨Z⟩ = −1` → always measured as `1`.
- `⟨Z⟩ = 0` → measured as `0` and `1` equally often.

So `⟨Z⟩` is a thermometer for **how 0-ish or 1-ish the measurement
results are**.

## The math (optional)

If:

$$
|\psi\rangle = \alpha|0\rangle + \beta|1\rangle
$$

then:

$$
\langle Z \rangle = |\alpha|^2 - |\beta|^2
$$

In other words:

$$
\langle Z \rangle = P(0) - P(1)
$$

Because the value is the difference between two probabilities, it is
always between `−1` and `+1`.

## In QMLens

In the **Qubit Correlation Graph**, each qubit is drawn as a circle with
a small arrow inside it — a tiny **Bloch-style needle** that shows the
qubit's `⟨Z⟩` value:

| Arrow direction | `⟨Z⟩` | Interpretation |
|---|---|---|
| Straight **up** | `+1` | Always measured as `0` |
| Tilted upward | between `0` and `+1` | More likely to be measured as `0` |
| **Horizontal** (along the dashed equator) | `0` | 50 / 50 between `0` and `1` |
| Tilted downward | between `−1` and `0` | More likely to be measured as `1` |
| Straight **down** | `−1` | Always measured as `1` |

The circle's color (blue ↔ red) reinforces the same value, and hovering
the node shows the exact number, e.g. `⟨Z₀⟩ = 0.213`.

Read the arrow like the needle of a tilting compass: **up = 0-ish,
horizontal = undecided, down = 1-ish.**

Try this:

1. Train the model using the default settings.
2. Drag the **epoch slider** to epoch `0`. Notice the arrow direction on
   `q0`.
3. Slide to the final epoch and look at `q0` again.

Did the arrow rotate?

During training, the model adjusts the operations in the circuit. These
changes affect the qubit states and therefore change the measurement
statistics — and the arrow tilts accordingly. We will learn how those
operations work starting on Day 3.

## Big picture: how quantum ML actually works

Before we dive into specific gates, here's the **whole training loop in
one paragraph** so the rest of the visualization makes sense:

1. **Encode the input.** A classical data point (e.g. a 2D coordinate)
   is turned into a qubit rotation — that's the green column you'll see
   on the left of the Circuit View. Different inputs → different
   starting qubit states. *(Day 7.)*
2. **Transform with trainable rotations.** A stack of `Ry` / `Rz`
   rotations (the blue boxes) and entangling gates (the purple lines
   between wires) shuffles the qubits' state around. These rotation
   angles are the model's **weights** — there is nothing else to learn.
   *(Days 3, 8.)*
3. **Measure.** Read `⟨Z₀⟩` off the first qubit (the yellow `M` box).
   This single number in `[−1, +1]` is the model's prediction:
   positive → class A, negative → class B. *(Today.)*
4. **Score and adjust.** Compare the prediction to the true label,
   compute a loss, then nudge every rotation angle slightly in the
   direction that lowers the loss. *(Days 9, 10.)*
5. **Repeat** for many data points and many epochs. The angles drift
   into a configuration that maps "class A inputs" to `⟨Z₀⟩ ≈ +1` and
   "class B inputs" to `⟨Z₀⟩ ≈ −1`. *(Day 11.)*

So a quantum ML model isn't really "thinking" in any exotic way — it's
the same loop as a tiny neural net:

| Neural network        | Variational quantum circuit |
|-----------------------|-----------------------------|
| Numbers in            | Qubit rotations in          |
| Multiply by weights   | Apply rotations by angles `θ` |
| Activation + layers   | More rotations + entanglers |
| Read output neuron    | Measure `⟨Z₀⟩`              |
| Adjust weights        | Adjust the angles `θ`       |

What makes it *quantum* is the middle part: the qubits can be in
superposition and become entangled while the rotations are happening,
which lets a small circuit express decision boundaries that would
require many more classical parameters. We'll start to see hints of
this from Day 4 (multi-qubits) and Day 5 (entanglement) onward.

For now, every Circuit View panel in QMLens is showing you exactly this
pipeline, left-to-right: **encode → rotate → entangle → measure**.

## Checkpoint

1. If `⟨Z⟩ = 0`, what is the probability of measuring `1`?
2. Does `⟨Z⟩` come from a single measurement or from many repeated runs?
3. Why can `⟨Z⟩` change during training?

<details><summary>Answers</summary>

1. 50%.
2. It summarizes the outcomes of many repeated runs, called shots.
3. Training changes the operations applied by the circuit, which changes
   the qubit states and their measurement probabilities.

</details>

## Stretch

Compare the arrows on `q0` and `q3`.

Do they rotate differently as training progresses? Which qubit do you
think the model uses to make its final prediction?

For now, treat this as a hypothesis. We will confirm the answer on Day 9.

→ Next: [Day 3 — Single-qubit gates and rotations](day-03-single-qubit-gates.md)