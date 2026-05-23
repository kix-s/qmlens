# Day 8 — Parameterized / variational circuits

> **Goal:** Understand what makes a quantum circuit a *quantum neural
> network*, and connect that to the blue gates in QMLens.

## The idea

A regular neural network has **weights** $\theta$ that the optimizer
adjusts. A **variational quantum circuit (VQC)** has rotation **angles**
$\theta$ that the optimizer adjusts. That's the whole analogy:

| Neural network | Variational quantum circuit |
|----------------|-----------------------------|
| Weights $w_i$ | Rotation angles $\theta_i$ |
| Layers of (`Linear` + `ReLU`) | Layers of (rotations + entanglers) |
| Forward pass | Run circuit, measure |
| Loss on output | Loss on measurement |
| Backprop | Parameter-shift rule (Day 10) |

A VQC is sometimes called a **Quantum Neural Network (QNN)**, even though
no neurons are involved. The name stuck.

## Why this design?

The shape we keep seeing — encode → (rotate → entangle) × L → measure —
is one of the simplest "universal" templates. Rough intuition:

- **Rotations alone** = you can twist each qubit independently but they
  can't share information. (Boring.)
- **Entanglers alone** = qubits share information but in a fixed,
  un-tunable way. (Also boring.)
- **Stacking them** = each layer lets the model both reshape individual
  qubits *and* mix them. Just like alternating `Linear` and a nonlinear
  activation in classical deep learning.

More layers → more expressive, but also harder to train (gradients can
go flat — a problem called "barren plateaus").

## How many parameters?

QMLens uses 2 rotations (`RY` + `RZ`) per qubit per layer:

$$\text{n\_params} = 2 \times \text{n\_qubits} \times \text{n\_layers}.$$

For the default (4 qubits, 2 layers) that's **16 angles**. Tiny by
classical-ML standards! That's typical of QML — you get a lot of
expressivity per parameter, but you pay for it in training difficulty.

## In QMLens

1. Train with defaults. Open the **Parameter Heatmap**.
2. Count the cells: `2 × n_layers` rows × `n_qubits` cols. For defaults
   that's 4 rows × 4 cols = 16 cells = 16 trainable angles. Each cell
   maps **one-to-one** to a blue gate in the Circuit View.
3. Each cell's row label tells you which gate: `L1·RY` = "layer 1, the RY
   sub-row." Within that row, column `q2` = the `RY` on qubit 2 in
   layer 1.
4. Slide the epoch slider. Watch the cells slowly drift — that's training
   adjusting the angles.

## Checkpoint

1. How many trainable angles in a 3-qubit, 4-layer QMLens circuit?
2. What's the QML analogue of a `Linear` layer? Of an activation
   function?
3. Why isn't "more layers" always better?

<details><summary>Answers</summary>

1. 2 × 3 × 4 = **24**.
2. Rotations ↔ linear weights; the entangler block ↔ the "nonlinearity"
   that lets layers compose.
3. Deeper circuits suffer from harder optimisation (barren plateaus) and
   accumulate hardware noise faster on real devices.
</details>

## Stretch

Increase `layers` from 2 → 4 and retrain with the same other settings.
Does the final test accuracy improve? Did the loss curve become smoother
or rougher? Why?

→ Next: [Day 9 — Loss and labels](day-09-loss-and-labels.md)
