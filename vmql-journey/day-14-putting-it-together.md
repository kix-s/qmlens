# Day 14 — Putting it all together (and where to go next)

> **Goal:** Tell the full story of a QMLens training run in one breath,
> then know what to study next.

## The grand recap

A quantum machine learning model, as you've seen it, is:

1. **Qubits** — N spinning coins (Day 1) that can be in superpositions of
   0 and 1.
2. **Measurement** — collapses each coin to ±1; we average many runs and
   call that `⟨Z⟩` (Day 2).
3. **Gates** — operations that tilt the coins (Day 3); a few of them
   bridge coins to entangle them (Day 5).
4. **Circuit** — a left-to-right recipe of those operations (Day 6).
5. **Encoding** — the first column of the circuit, which loads classical
   data into the qubits (Day 7).
6. **Variational ansatz** — the trainable middle of the circuit, made of
   rotations and entanglers, with N parameters (Day 8).
7. **Loss** — turn `⟨Z_0⟩` into a number the optimizer wants to minimize
   by comparing it to the labels (Day 9).
8. **Gradients** — computed via parameter-shift, two circuit runs per
   parameter (Day 10).
9. **Training** — Adam updates the parameters; after enough epochs, the
   circuit measures something useful (Day 11).
10. **Interpretation** — the Entanglement Graph tells you how qubits are
    sharing information (Day 12); the Parameter Heatmap tells you which
    gates the model is using (Day 13).

If you can hand someone the QMLens UI and explain what they're seeing in
those terms — you've internalized the core of QML.

## The grand exercise

In one sitting, do this:

1. Pick three configs:
   - **Tiny:** `qubits=2, layers=1, epochs=30`
   - **Default:** `qubits=4, layers=2, epochs=30`
   - **Deep:**  `qubits=4, layers=4, epochs=50`
2. Train each.
3. For each, fill in:

| | Final test acc | Loss shape | Entanglement pattern | "Dead" parameters? |
|-|----------------|------------|----------------------|--------------------|
| Tiny    | | | | |
| Default | | | | |
| Deep    | | | | |

4. Write 2–3 sentences answering: *"Did adding more capacity help, and
   why or why not?"*

Don't skip the writing step. You can't teach what you can't put into
words.

## Where to go next

### Bigger ideas you're now ready for

- **Barren plateaus** — why deep variational circuits often stop
  training. Search "McClean barren plateaus 2018."
- **Quantum kernels** — alternative QML paradigm using inner products of
  encoded states. See "Havlíček 2019 supervised learning with quantum
  enhanced feature spaces."
- **Hardware noise** — real quantum computers add randomness. Tools
  like Qiskit Runtime and PennyLane's noise channels can show you what
  changes.
- **Expressivity vs trainability tradeoff** — the central tension of
  QML. Read about "effective dimension" and "Fisher information."

### Tools to play with next

- [PennyLane demos](https://pennylane.ai/qml/demonstrations/) — many
  pre-made notebooks, including the variational classifier you just used.
- [Qiskit textbook](https://learning.quantum.ibm.com/) — broader quantum
  computing reference, not just ML.

### Papers (when you're ready)

- *"An introduction to quantum machine learning for non-physicists"* —
  good bridge from where you are now.
- *"Variational quantum algorithms"* (Cerezo et al., 2021) — survey of
  the area QMLens is in.
- *"Power of data in quantum machine learning"* (Huang et al., 2021) —
  honest take on when QML actually helps.

### Hands-on next projects

- Swap two-moons for the **Iris** binary subset (already mentioned in the
  plan). Modify [backend/trainer.py](../backend/trainer.py).
- Add a **measurement-attribution view** — for each parameter, plot
  `|∂⟨Z_0⟩/∂θ|`. Most of the infrastructure is already there.
- Try a **different encoding** (e.g. amplitude encoding, IQP encoding).
  How does the entanglement graph evolve differently?

## Final words

QML is young. The honest current state of the field is: nobody has shown
a clear, real-world advantage of a QNN over a classical NN on a useful
task. *But*, the science is fascinating, the tooling is improving fast,
and you now have the visual literacy to follow what's happening.

Keep QMLens nearby. The next time someone shows you a quantum circuit,
ask: *"What does that look like as an entanglement graph during
training?"* — and now you'll actually be able to imagine the answer.

Welcome to QML.
