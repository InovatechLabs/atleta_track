"""
Tarefas assíncronas Celery — processamento ML em background
"""
from app.core.celery_app import celery_app

@celery_app.task(name="tasks.classify_profiles")
def classify_profiles_task():
    """RF03 — Roda K-Means em background após importação"""
    from app.core.database import SessionLocal
    from app.repositories.athlete_repository import AthleteRepository
    from app.ml.ml_service import ProfileService

    db = SessionLocal()
    try:
        repo = AthleteRepository(db)
        all_perfs = repo.get_all_performances_for_ml()
        if not all_perfs:
            return {"status": "no_data"}

        records = [{
            "athlete_id":           p.athlete_id,
            "distance_km":          p.distance_km or 0,
            "sprint_distance_m":    p.sprint_distance_m or 0,
            "high_intensity_run_m": p.high_intensity_run_m or 0,
            "max_speed_kmh":        p.max_speed_kmh or 0,
            "accelerations":        p.accelerations or 0,
            "work_load_index":      p.work_load_index or 0,
        } for p in all_perfs]

        svc = ProfileService()
        profile_map = svc.train_and_classify(records)

        for athlete_id, profile_type in profile_map.items():
            repo.update(athlete_id, {"profile_type": profile_type})

        return {"status": "ok", "updated": len(profile_map)}
    finally:
        db.close()

@celery_app.task(name="tasks.detect_anomalies")
def detect_anomalies_task(game_id: int):
    """RF05 — Roda Isolation Forest em background após importação de partida"""
    from app.core.database import SessionLocal
    from app.repositories.athlete_repository import PerformanceRepository
    from app.ml.ml_service import AnomalyDetectionService
    from app.services.alert_service import AlertObserver

    db = SessionLocal()
    try:
        repo = PerformanceRepository(db)
        perfs = repo.get_by_game(game_id)
        if not perfs:
            return {"status": "no_data"}

        records = [{
            "id":                   p.id,
            "athlete_id":           p.athlete_id,
            "game_id":              p.game_id,
            "distance_km":          p.distance_km or 0,
            "sprint_distance_m":    p.sprint_distance_m or 0,
            "high_intensity_run_m": p.high_intensity_run_m or 0,
            "max_speed_kmh":        p.max_speed_kmh or 0,
            "accelerations":        p.accelerations or 0,
            "work_load_index":      p.work_load_index or 0,
        } for p in perfs]

        svc = AnomalyDetectionService()
        svc.train(records)
        detections = svc.detect(records)

        observer = AlertObserver(db)
        alerts_created = 0
        for det in detections:
            if det["is_anomaly"]:
                repo.update_anomaly(det["perf_id"], True, det["score"])
                observer.notify(det)
                alerts_created += 1

        return {"status": "ok", "anomalies": alerts_created}
    finally:
        db.close()
