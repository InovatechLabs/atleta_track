"""
Serviço de ML — Padrão Strategy (RP01, RP06)
Algoritmos intercambiáveis via interface IMLStrategy
"""
import numpy as np
import pandas as pd
import joblib
import io
from abc import ABC, abstractmethod
from typing import List, Dict, Tuple
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from app.core.config import settings

PROFILE_NAMES = {
    0: "explosivo",
    1: "alta_resistencia",
    2: "alta_carga_impacto",
    3: "baixa_intensidade",
}

FEATURES = [
    "distance_km",
    "sprint_distance_m",
    "high_intensity_run_m",
    "max_speed_kmh",
    "accelerations",
    "work_load_index",
]

# ===================== INTERFACES (Strategy) =====================

class IProfileStrategy(ABC):
    @abstractmethod
    def fit(self, data: pd.DataFrame) -> "IProfileStrategy": ...
    @abstractmethod
    def predict(self, data: pd.DataFrame) -> List[str]: ...
    @abstractmethod
    def to_bytes(self) -> bytes: ...

class IAnomalyStrategy(ABC):
    @abstractmethod
    def fit(self, data: pd.DataFrame) -> "IAnomalyStrategy": ...
    @abstractmethod
    def predict(self, data: pd.DataFrame) -> Tuple[List[bool], List[float]]: ...
    @abstractmethod
    def to_bytes(self) -> bytes: ...

# ===================== IMPLEMENTATIONS =====================

class KMeansProfileStrategy(IProfileStrategy):
    def __init__(self, n_clusters: int = 4, random_state: int = 42):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.model = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
        self._label_map: Dict[int, str] = {}

    def _prepare(self, data: pd.DataFrame) -> np.ndarray:
        cols = [c for c in FEATURES if c in data.columns]
        X = data[cols].fillna(data[cols].median())
        return X

    def fit(self, data: pd.DataFrame) -> "KMeansProfileStrategy":
        X = self._prepare(data)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        # Assign label to each cluster center
        centers = self.model.cluster_centers_
        # Sort clusters by sprint_distance descending → explosivo first
        sprint_idx = FEATURES.index("sprint_distance_m") if "sprint_distance_m" in FEATURES else 1
        dist_idx   = FEATURES.index("distance_km") if "distance_km" in FEATURES else 0
        accel_idx  = FEATURES.index("accelerations") if "accelerations" in FEATURES else 4
        order = np.argsort(-centers[:, sprint_idx])
        self._label_map = {int(order[i]): PROFILE_NAMES[i] for i in range(min(4, len(order)))}
        return self

    def predict(self, data: pd.DataFrame) -> List[str]:
        X = self._prepare(data)
        X_scaled = self.scaler.transform(X)
        labels = self.model.predict(X_scaled)
        return [self._label_map.get(int(l), "nao_classificado") for l in labels]

    def to_bytes(self) -> bytes:
        buf = io.BytesIO()
        joblib.dump({"model": self.model, "scaler": self.scaler, "label_map": self._label_map}, buf)
        return buf.getvalue()

    @classmethod
    def from_bytes(cls, data: bytes) -> "KMeansProfileStrategy":
        obj = cls()
        buf = io.BytesIO(data)
        payload = joblib.load(buf)
        obj.model = payload["model"]
        obj.scaler = payload["scaler"]
        obj._label_map = payload["label_map"]
        return obj


class IsolationForestAnomalyStrategy(IAnomalyStrategy):
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=random_state,
        )
        self.threshold = settings.ANOMALY_THRESHOLD

    def _prepare(self, data: pd.DataFrame) -> np.ndarray:
        cols = [c for c in FEATURES if c in data.columns]
        X = data[cols].fillna(data[cols].median())
        return X

    def fit(self, data: pd.DataFrame) -> "IsolationForestAnomalyStrategy":
        X = self._prepare(data)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        return self

    def predict(self, data: pd.DataFrame) -> Tuple[List[bool], List[float]]:
        X = self._prepare(data)
        X_scaled = self.scaler.transform(X)
        scores = self.model.score_samples(X_scaled).tolist()
        is_anomaly = [s < self.threshold for s in scores]
        return is_anomaly, scores

    def to_bytes(self) -> bytes:
        buf = io.BytesIO()
        joblib.dump({"model": self.model, "scaler": self.scaler, "threshold": self.threshold}, buf)
        return buf.getvalue()

    @classmethod
    def from_bytes(cls, data: bytes) -> "IsolationForestAnomalyStrategy":
        obj = cls()
        buf = io.BytesIO(data)
        payload = joblib.load(buf)
        obj.model = payload["model"]
        obj.scaler = payload["scaler"]
        obj.threshold = payload["threshold"]
        return obj

# ===================== HIGH-LEVEL SERVICES =====================

class ProfileService:
    """RF03 — Identificação automática de perfis de jogadores"""

    def __init__(self, strategy: IProfileStrategy = None):
        self._strategy = strategy or KMeansProfileStrategy(n_clusters=settings.KMEANS_CLUSTERS)

    def train_and_classify(self, performances: list) -> Dict[int, str]:
        """Recebe lista de dicts com athlete_id + features, retorna {athlete_id: profile}"""
        if not performances:
            return {}
        df = pd.DataFrame(performances)
        self._strategy.fit(df)
        labels = self._strategy.predict(df)
        return {int(row["athlete_id"]): labels[i] for i, row in df.iterrows()}

    def get_model_bytes(self) -> bytes:
        return self._strategy.to_bytes()


class AnomalyDetectionService:
    """RF05 — Detecção automática de queda de desempenho"""

    def __init__(self, strategy: IAnomalyStrategy = None):
        self._strategy = strategy or IsolationForestAnomalyStrategy()

    def train(self, performances: list) -> "AnomalyDetectionService":
        if not performances:
            return self
        df = pd.DataFrame(performances)
        self._strategy.fit(df)
        return self

    def detect(self, performances: list) -> List[Dict]:
        """Retorna lista de {athlete_id, game_id, is_anomaly, score}"""
        if not performances:
            return []
        df = pd.DataFrame(performances)
        is_anomaly, scores = self._strategy.predict(df)
        results = []
        for i, row in df.iterrows():
            results.append({
                "athlete_id": int(row.get("athlete_id", 0)),
                "game_id":    int(row.get("game_id", 0)),
                "perf_id":    int(row.get("id", 0)),
                "is_anomaly": is_anomaly[i],
                "score":      round(scores[i], 4),
            })
        return results

    def get_model_bytes(self) -> bytes:
        return self._strategy.to_bytes()
