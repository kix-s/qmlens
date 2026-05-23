# Day 10 — Gradients and the parameter-shift rule

> **Goal:** Understand how a quantum circuit gets trained without
> classical backprop, and what the yellow curve / gate tinting in QMLens
> are showing you.

## The idea

Optimizers need **gradients**: "if I nudge $\theta_i$ a tiny bit, by how
much does the loss change?" In classical ML, autograd computes
$\partial \mathcal{L} / \partial \theta_i$ by chain-ruling through the
forward pass.

In a real quantum computer, you **can't peek inside** to chain-rule —
measurement collapses the state. So how do we get gradients?

### The trick: parameter-shift rule

For rotation gates like `RY(θ)` and `RZ(θ)`, it turns out that:

$$\frac{\partial \langle Z\rangle}{\partial \theta} = \tfrac{1}{2}\Bigl[\langle Z\rangle_{\theta + \tfrac{\pi}{2}} - \langle Z\rangle_{\theta - \tfrac{\pi}{2}}\Bigr].$$

In English: **run the circuit twice — once with θ bumped up by π/2, once
bumped down — and subtract.** Half the difference is the exact gradient.

This is beautiful because:

- It's **exact**, not numerical-approximation-ish.
- It works on a real quantum device — you just run the circuit twice.

The cost is high: one gradient component needs **2 circuit evaluations**.
For our 16-parameter circuit that's 32 runs per training step. (In the
QMLens simulator we cheat and use classical backprop through PennyLane
since we're not on real hardware — but the principle is what matters.)

## The picture

Imagine a hill in the dark. You can't see the slope, but you can put a
finger down on the ground at two nearby spots, feel which is higher,
and from that work out which way the hill goes. Parameter-shift is
exactly that — two pokes, one number out.

## In QMLens

Two visual cues:

1. **Yellow curve** in the Training Timeline — that's $\|\nabla \mathcal{L}\|$,
   the **gradient norm**: the overall length of the gradient vector. Big
   value = the model knows where to go and is updating aggressively. Small
   value = either near a minimum, or stuck on a barren plateau.

2. **Tinting on the trainable gates** in the Circuit View. Each blue
   `RY`/`RZ` is colored by `|∂L/∂θ|` for that specific gate. The brighter
   the gate, the more the loss depends on it right now.

Try this:

1. Train with defaults.
2. Slide to epoch 1 (very early). Most blue gates should glow — gradients
   are everywhere.
3. Slide to the last epoch. Gates should be dimmer overall — the model
   has settled. Some gates may still be bright (still learning).

This is **the visual differentiator** of QMLens vs. tools that only show
the circuit: you can literally *see which parts of the circuit are
contributing to learning right now*.

## Checkpoint

1. Why can't we use autograd "inside" a real quantum computer?
2. How many circuit runs does one parameter's gradient cost via
   parameter-shift?
3. What does a *dim* (almost background-colored) blue gate near the end
   of training tell you?

<details><summary>Answers</summary>

1. Because intermediate states can't be inspected without destroying
   them via measurement.
2. Two — at θ+π/2 and θ−π/2.
3. The loss doesn't change much with that parameter — it's barely
   contributing. Could be redundant capacity.
</details>

## Stretch

A **barren plateau** is when gradients shrink exponentially with circuit
depth, making training stall. Push `layers` to 5 with `lr=0.05`. Does the
yellow gradient-norm curve start very small? Do the gates look dim from
the get-go? That's a barren plateau in the wild.

→ Next: [Day 11 — Training your first QML model](day-11-first-training-run.md)
