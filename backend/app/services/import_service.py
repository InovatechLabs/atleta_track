"""
RF01, RF02 — Importação e ETL de dados de partidas
"""
import csv
import io
from typing import List, Dict, Any
import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.repositories.athlete_repository import PerformanceRepository
from app.models.user import Game, Athlete
from app.ml.ml_service import AnomalyDetectionService, ProfileService
from app.services.alert_service import AlertObserver

REQUIRED_COLUMNS = {
    "athlete_id", "minutes_played", "distance_km",
    "sprint_distance_m", "high_intensity_run_m",
    "max_speed_kmh", "accelerations", "work_load_index",
}

class ImportService:
    def __init__(self, db: Session):
        self.db = db
        self.perf_repo = PerformanceRepository(db)

    async def import_from_file(self, file: UploadFile, game_id: int) -> Dict[str, Any]:
        """RF01/RF02 — Valida, transforma e carrega dados de um arquivo"""
        content = await file.read()

        if file.filename.endswith(".csv"):
            df = self._parse_csv(content)
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, "Formato não suportado. Use .csv ou .xlsx")

        df = self._validate_and_clean(df, game_id)
        records = df.to_dict(orient="records")

        # RNF04 - integridade
        inserted = self.perf_repo.bulk_create(records)

        # Rodar detecção de anomalias após importar
        anomaly_svc = AnomalyDetectionService()
        anomaly_svc.train(records)
        detections = anomaly_svc.detect(records)

        alerts_generated = 0
        observer = AlertObserver(self.db)
        for det in detections:
            if det["is_anomaly"]:
                self.perf_repo.update_anomaly(det["perf_id"], True, det["score"])
                observer.notify(det)
                alerts_generated += 1

        return {
            "inserted": inserted,
            "anomalies_detected": alerts_generated,
            "message": f"{inserted} registros importados, {alerts_generated} anomalias detectadas.",
        }

    def _parse_csv(self, content: bytes) -> pd.DataFrame:
        text = content.decode("utf-8-sig")
        return pd.read_csv(io.StringIO(text))

    def _validate_and_clean(self, df: pd.DataFrame, game_id: int) -> pd.DataFrame:
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
        missing = REQUIRED_COLUMNS - set(df.columns)
        if missing:
            raise HTTPException(400, f"Colunas obrigatórias ausentes: {missing}")

        df = df.dropna(subset=["athlete_id"])
        df["game_id"] = game_id

        numeric_cols = [
            "minutes_played", "distance_km", "sprint_distance_m",
            "high_intensity_run_m", "max_speed_kmh", "accelerations",
            "decelerations", "work_load_index", "heart_rate_avg", "heart_rate_max",
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        df["athlete_id"] = df["athlete_id"].astype(int)
        return df
