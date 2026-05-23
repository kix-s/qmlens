"""Scenario registry.

A scenario bundles together:
  - a stable id (used by the API),
  - a human-readable name + description (for the UI dropdown),
  - a dataset loader returning (Xtr, Xte, ytr, yte) with labels in {-1, +1},
  - default training hyper-parameters tuned for that dataset.

Today there's only one scenario, but everything in the rest of the stack
already speaks "scenario id," so adding Iris, XOR, etc. later is a
one-file change.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, Tuple

import numpy as np
from sklearn.datasets import make_circles, make_moons
from sklearn.model_selection import train_test_split


# Loader signature: (n_samples, noise, seed) -> (Xtr, Xte, ytr_pm, yte_pm)
LoaderFn = Callable[[int, float, int], Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]]


@dataclass(frozen=True)
class Scenario:
    id: str
    name: str
    description: str
    n_features: int
    loader: LoaderFn
    defaults: Dict


def _scale_unit(X: np.ndarray) -> np.ndarray:
    """Rescale features into [-1, 1] independently per dimension."""
    return (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0)) * 2 - 1


def _two_moons_loader(n_samples: int, noise: float, seed: int):
    X, y = make_moons(n_samples=n_samples, noise=noise, random_state=seed)
    X = _scale_unit(X)
    y_pm = 2 * y - 1
    Xtr, Xte, ytr, yte = train_test_split(
        X, y_pm, test_size=0.25, random_state=seed, stratify=y
    )
    return Xtr, Xte, ytr, yte


def _circles_loader(n_samples: int, noise: float, seed: int):
    # `factor` controls the gap between inner & outer ring; 0.5 is the
    # sklearn default and keeps the classes well-separated for small noise.
    X, y = make_circles(
        n_samples=n_samples, noise=noise, random_state=seed, factor=0.5
    )
    X = _scale_unit(X)
    y_pm = 2 * y - 1
    Xtr, Xte, ytr, yte = train_test_split(
        X, y_pm, test_size=0.25, random_state=seed, stratify=y
    )
    return Xtr, Xte, ytr, yte


SCENARIOS: Dict[str, Scenario] = {
    "two_moons": Scenario(
        id="two_moons",
        name="Two moons (binary)",
        description=(
            "Classic interlocking-crescents dataset. Non-linearly separable. "
            "A good first test for any small classifier."
        ),
        n_features=2,
        loader=_two_moons_loader,
        defaults={
            "n_qubits": 4,
            "n_layers": 3,
            "epochs": 30,
            "lr": 0.1,
            "n_samples": 120,
            "noise": 0.15,
            "seed": 42,
        },
    ),
    "circles": Scenario(
        id="circles",
        name="Concentric circles (binary)",
        description=(
            "Inner ring vs. outer ring. Radially separable but not linearly "
            "separable in (x, y) \u2014 a stress test for the feature map."
        ),
        n_features=2,
        loader=_circles_loader,
        defaults={
            "n_qubits": 4,
            "n_layers": 4,
            "epochs": 40,
            "lr": 0.1,
            "n_samples": 160,
            "noise": 0.08,
            "seed": 42,
        },
    ),
}


def get_scenario(scenario_id: str) -> Scenario:
    if scenario_id not in SCENARIOS:
        raise KeyError(f"unknown scenario '{scenario_id}'. known: {list(SCENARIOS)}")
    return SCENARIOS[scenario_id]


def list_scenarios() -> list[dict]:
    """Serializable description of every scenario for the UI dropdown."""
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "n_features": s.n_features,
            "defaults": s.defaults,
        }
        for s in SCENARIOS.values()
    ]
