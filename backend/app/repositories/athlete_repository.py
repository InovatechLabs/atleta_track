from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.user import Athlete, Performance, Alert

class AthleteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, active_only: bool = True) -> List[Athlete]:
        q = self.db.query(Athlete)
        if active_only:
            q = q.filter(Athlete.is_active == True)
        return q.order_by(Athlete.name).all()

    def get_by_id(self, athlete_id: int) -> Optional[Athlete]:
        return self.db.query(Athlete).filter(Athlete.id == athlete_id).first()

    def create(self, data: dict) -> Athlete:
        athlete = Athlete(**data)
        self.db.add(athlete)
        self.db.commit()
        self.db.refresh(athlete)
        return athlete

    def update(self, athlete_id: int, data: dict) -> Optional[Athlete]:
        athlete = self.get_by_id(athlete_id)
        if not athlete:
            return None
        for k, v in data.items():
            setattr(athlete, k, v)
        self.db.commit()
        self.db.refresh(athlete)
        return athlete

    def get_performances(self, athlete_id: int, limit: int = 30) -> List[Performance]:
        return (
            self.db.query(Performance)
            .filter(Performance.athlete_id == athlete_id)
            .order_by(Performance.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_all_performances_for_ml(self) -> List[Performance]:
        return self.db.query(Performance).all()

    def get_profile_summary(self):
        return (
            self.db.query(
                Athlete.profile_type,
                func.count(Athlete.id).label("count"),
                func.avg(Performance.work_load_index).label("avg_work_load"),
                func.avg(Performance.max_speed_kmh).label("avg_max_speed"),
            )
            .join(Performance, Performance.athlete_id == Athlete.id, isouter=True)
            .group_by(Athlete.profile_type)
            .all()
        )

class PerformanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> Performance:
        perf = Performance(**data)
        self.db.add(perf)
        self.db.commit()
        self.db.refresh(perf)
        return perf

    def bulk_create(self, data_list: List[dict]) -> int:
        performances = [Performance(**d) for d in data_list]
        self.db.add_all(performances)
        self.db.commit()
        return len(performances)

    def get_by_game(self, game_id: int) -> List[Performance]:
        return self.db.query(Performance).filter(Performance.game_id == game_id).all()

    def get_kpis(self) -> dict:
        result = self.db.query(
            func.avg(Performance.distance_km).label("avg_distance"),
            func.avg(Performance.max_speed_kmh).label("avg_speed"),
            func.avg(Performance.sprint_distance_m).label("avg_sprint"),
            func.avg(Performance.accelerations).label("avg_accel"),
            func.avg(Performance.work_load_index).label("avg_workload"),
        ).first()
        return {
            "avg_distance_km":     round(result.avg_distance or 0, 1),
            "avg_max_speed":       round(result.avg_speed or 0, 1),
            "avg_sprint_distance": round(result.avg_sprint or 0, 0),
            "avg_accelerations":   round(result.avg_accel or 0, 1),
            "avg_work_load":       round(result.avg_workload or 0, 1),
        }

    def update_anomaly(self, perf_id: int, is_anomaly: bool, score: float):
        perf = self.db.query(Performance).filter(Performance.id == perf_id).first()
        if perf:
            perf.is_anomaly = is_anomaly
            perf.anomaly_score = score
            self.db.commit()

class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> Alert:
        alert = Alert(**data)
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_active(self) -> List[Alert]:
        return (
            self.db.query(Alert)
            .filter(Alert.is_resolved == False)
            .order_by(Alert.created_at.desc())
            .all()
        )

    def mark_read(self, alert_id: int):
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_read = True
            self.db.commit()

    def mark_resolved(self, alert_id: int):
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_resolved = True
            self.db.commit()
