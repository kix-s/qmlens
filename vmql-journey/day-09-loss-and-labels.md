# Day 9 — Loss and labels: turning measurements into a learning signal

> **Goal:** Understand how a circuit's measurement becomes a number the
> optimizer can complain about — i.e. how QMLens computes the red curve.

## The idea

To train, you need to be able to **score** the model. Classical ML uses
losses like cross-entropy or MSE. QML uses the same losses — applied to
the measurement outputs of the circuit.

The QMLens recipe is the simplest possible:

1. **Output of the model** = $\langle Z_0 \rangle$ — a number in
   $[-1, +1]$.
2. **Labels** are written as $y \in \{-1, +1\}$ (we relabel two-moons'
   $\{0, 1\}$ to $\{-1, +1\}$).
3. **Loss** = mean squared error:

   $$\mathcal{L}(\theta) = \frac{1}{N}\sum_{i=1}^{N} \bigl(\langle Z_0\rangle(\theta, x_i) - y_i\bigr)^2.$$

That's it. Pull $\langle Z_0 \rangle$ towards $+1$ for class $+1$ and
towards $-1$ for class $-1$.

The classifier's **prediction** at inference time is just
$\text{sign}(\langle Z_0 \rangle)$.

## The picture

Imagine a kid trying to point a flashlight at two targets on a wall:

- Target **+1** is on the right.
- Target **−1** is on the left.

The model sees an input ($x$) and aims the flashlight ($\langle Z_0\rangle$).
Loss is how far the beam lands from the correct target. The optimizer's
job is to nudge the kid's arm angles ($\theta$) so the beam consistently
hits the right target.

## Why pick `q0` as the output?

There's nothing magical about qubit 0; it's just a convention. With
entanglement, **information from all qubits and all inputs gets mixed
into every qubit by the end** — so we can read any of them. We pick `q0`
and forget about it.

## In QMLens

1. **Training Timeline** (top-right). The **red curve** is exactly
   $\mathcal{L}(\theta)$ above, averaged over the training set, at each
   epoch.
2. The **green** and **blue** curves are accuracies — what fraction of
   the time `sign(⟨Z_0⟩)` agrees with the label.
3. Drag the epoch slider and notice: when loss goes down, accuracy
   usually goes up. Not always — but usually.

A perfect classifier would push every prediction to ±1 → loss → 0.
Realistically you'll see loss settle somewhere between 0.2 and 0.6 on the
two-moons task with these defaults. That's fine — the goal is *direction*,
not zero.

## Checkpoint

1. Why do we relabel $\{0,1\}$ to $\{-1,+1\}$?
2. What single number does the QMLens model output?
3. If your loss is decreasing but accuracy is flat, what could that mean?

<details><summary>Answers</summary>

1. So the labels live in the same range as $\langle Z\rangle$, which is
   $[-1, +1]$.
2. $\langle Z_0\rangle$ — the expectation of Z on qubit 0.
3. The model is becoming more *confident* (predictions move further from
   0) without crossing the sign boundary — useful, but not yet flipping
   wrong predictions to right ones.
</details>

## Stretch

Try changing `lr` (learning rate) from `0.1` to `0.01`. What happens to
the *shape* of the loss curve? What about `lr=0.5`?

→ Next: [Day 10 — Gradients and the parameter-shift rule](day-10-gradients.md)
