"""
RF06 — Alertas automáticos via padrão Observer
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.repositories.athlete_repository import AlertRepository
from app.models.user import Athlete

class AlertObserver:
    """Observa detecções de anomalia e persiste alertas — RF06"""

    def __init__(self, db: Session):
        self.db = db
        self.repo = AlertRepository(db)

    def notify(self, detection: Dict[str, Any]):
        athlete = self.db.query(Athlete).filter(Athlete.id == detection["athlete_id"]).first()
        athlete_name = athlete.name if athlete else f"Atleta #{detection['athlete_id']}"
        score = detection.get("score", 0)

        if score < -0.4:
            severity = "high"
            title = f"{athlete_name} — Queda crítica de desempenho"
            desc = (
                f"Score de anomalia: {score:.3f}. "
                "Indicadores significativamente abaixo do padrão histórico individual. "
                "Recomenda-se avaliação médica imediata."
            )
        elif score < -0.25:
            severity = "high"
            title = f"{athlete_name} — Queda relevante de desempenho"
            desc = (
                f"Score de anomalia: {score:.3f}. "
                "Múltiplos indicadores abaixo da média histórica. "
                "Monitoramento próximo recomendado."
            )
        else:
            severity = "medium"
            title = f"{athlete_name} — Desvio de desempenho detectado"
            desc = (
                f"Score de anomalia: {score:.3f}. "
                "Um ou mais indicadores apresentam desvio em relação ao histórico. "
                "Acompanhe nas próximas partidas."
            )

        self.repo.create({
            "athlete_id":  detection["athlete_id"],
            "game_id":     detection.get("game_id"),
            "severity":    severity,
            "title":       title,
            "description": desc,
        })


class AlertService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AlertRepository(db)

    def get_active_alerts(self) -> List:
        alerts = self.repo.get_active()
        result = []
        for a in alerts:
            item = {
                "id":          a.id,
                "athlete_id":  a.athlete_id,
                "severity":    a.severity,
                "title":       a.title,
                "description": a.description,
                "is_read":     a.is_read,
                "is_resolved": a.is_resolved,
                "created_at":  a.created_at,
                "athlete_name": a.athlete.name if a.athlete else None,
            }
            result.append(item)
        return result

    def mark_read(self, alert_id: int):
        self.repo.mark_read(alert_id)

    def mark_resolved(self, alert_id: int):
        self.repo.mark_resolved(alert_id)
