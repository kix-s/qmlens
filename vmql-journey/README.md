# The QMLens Journey — Learn Quantum ML by Seeing It

A 14-day, beginner-first course that takes you from "what is a qubit?" to
"I can read what my variational quantum classifier is learning." Each day
is a short chunk (~20–40 minutes), built around a single idea, and uses
QMLens (the visualizer in this repo) as the lab bench.

## Who this is for

- You can program a little (Python or JS — we won't ask much).
- You have **never** studied quantum mechanics or quantum computing.
- You know roughly what "machine learning" means (model, loss, training).
- You learn best by playing with something and watching it change.

## How the course works

Every day follows the same shape:

1. **The idea** — plain-language explanation.
2. **The picture** — one image / analogy.
3. **The math (optional)** — small, only when it helps.
4. **In QMLens** — what to click, what to look at, what to predict.
5. **Checkpoint** — 1–3 questions to make sure it stuck.

By Day 14 you will have trained, watched, and *interpreted* a small
quantum neural network on two-moons.

## Setup (do this before Day 1)

```bash
docker compose up --build
# Open http://localhost:5173
```

If you don't want Docker, follow the local-dev instructions in the top-level
[README.md](../README.md).

## Syllabus

| Day | Topic | What you'll *see* in QMLens |
|-----|-------|------------------------------|
| [01](day-01-what-is-a-qubit.md) | What is a qubit? | The four qubit nodes in the Entanglement Graph |
| [02](day-02-measurement.md) | Measurement and probability | The ⟨Z⟩ value under each qubit |
| [03](day-03-single-qubit-gates.md) | Single-qubit gates & rotations | RY / RZ boxes in the Circuit View |
| [04](day-04-multi-qubits.md) | Multi-qubit systems | The four wires in the Circuit View |
| [05](day-05-entanglement.md) | Entanglement & CNOTs | The CNOT chain + edges in the Entanglement Graph |
| [06](day-06-reading-a-circuit.md) | Reading a circuit | A full lap across the Circuit View |
| [07](day-07-feature-encoding.md) | Encoding classical data | The green "Encoding" column |
| [08](day-08-variational-circuits.md) | Parameterized / variational circuits | The blue trainable RY/RZ gates |
| [09](day-09-loss-and-labels.md) | Turning measurements into a loss | The red loss curve |
| [10](day-10-gradients.md) | Gradients & the parameter-shift rule | Gradient norm (yellow) + gate tinting |
| [11](day-11-first-training-run.md) | Train your first QML model | The whole UI, live |
| [12](day-12-entanglement-graph.md) | Reading the Entanglement Graph | Edge thickness over epochs |
| [13](day-13-parameter-heatmap.md) | Reading the Parameter Heatmap | Heatmap cells over epochs |
| [14](day-14-putting-it-together.md) | Putting it all together | Everything, plus where to go next |

## How to use this

- Don't binge. Quantum intuition is built, not crammed. One day per day is
  the goal.
- If a day feels too easy: do the **Stretch** task at the bottom.
- If a day feels hard: re-read "The picture" and the QMLens section, then
  come back to the math.
- Keep QMLens open in another tab the whole time.

Ready? → [Day 1: What is a qubit?](day-01-what-is-a-qubit.md)
