from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.schemas import AthleteCreate, AthleteOut, CompareResponse
from app.models.user import User
from app.repositories.athlete_repository import AthleteRepository, PerformanceRepository
from app.ml.ml_service import ProfileService

router = APIRouter()

@router.get("/", response_model=List[AthleteOut])
def list_athletes(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    repo = AthleteRepository(db)
    return repo.get_all()

@router.post("/", response_model=AthleteOut, status_code=201)
def create_athlete(payload: AthleteCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    repo = AthleteRepository(db)
    return repo.create(payload.model_dump())

@router.get("/{athlete_id}", response_model=AthleteOut)
def get_athlete(athlete_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    repo = AthleteRepository(db)
    athlete = repo.get_by_id(athlete_id)
    if not athlete:
        raise HTTPException(404, "Atleta não encontrado")
    return athlete

@router.get("/{athlete_id}/performances")
def get_performances(athlete_id: int, limit: int = 20, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    repo = AthleteRepository(db)
    perfs = repo.get_performances(athlete_id, limit=limit)
    return perfs

@router.get("/compare/{id_a}/{id_b}", response_model=CompareResponse)
def compare_athletes(id_a: int, id_b: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """RF04 — Comparação de dois atletas"""
    a_repo = AthleteRepository(db)
    p_repo = PerformanceRepository(db)
    a = a_repo.get_by_id(id_a)
    b = a_repo.get_by_id(id_b)
    if not a or not b:
        raise HTTPException(404, "Atleta não encontrado")

    perfs_a = a_repo.get_performances(id_a, limit=10)
    perfs_b = a_repo.get_performances(id_b, limit=10)

    def avg(perfs, attr):
        vals = [getattr(p, attr) for p in perfs if getattr(p, attr) is not None]
        return round(sum(vals) / len(vals), 2) if vals else 0

    metrics = {
        "distance_km":       {"a": avg(perfs_a, "distance_km"),       "b": avg(perfs_b, "distance_km")},
        "sprint_distance_m": {"a": avg(perfs_a, "sprint_distance_m"), "b": avg(perfs_b, "sprint_distance_m")},
        "max_speed_kmh":     {"a": avg(perfs_a, "max_speed_kmh"),     "b": avg(perfs_b, "max_speed_kmh")},
        "accelerations":     {"a": avg(perfs_a, "accelerations"),     "b": avg(perfs_b, "accelerations")},
        "work_load_index":   {"a": avg(perfs_a, "work_load_index"),   "b": avg(perfs_b, "work_load_index")},
        "high_intensity_run_m": {"a": avg(perfs_a, "high_intensity_run_m"), "b": avg(perfs_b, "high_intensity_run_m")},
    }
    return {"athlete_a": a, "athlete_b": b, "metrics": metrics}

@router.post("/classify-profiles")
def classify_profiles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """RF03 — Roda K-Means e atualiza perfis de todos os atletas"""
    a_repo = AthleteRepository(db)
    all_perfs = a_repo.get_all_performances_for_ml()
    if not all_perfs:
        raise HTTPException(400, "Sem dados suficientes para classificação")

    records = [{
        "athlete_id":         p.athlete_id,
        "distance_km":        p.distance_km or 0,
        "sprint_distance_m":  p.sprint_distance_m or 0,
        "high_intensity_run_m": p.high_intensity_run_m or 0,
        "max_speed_kmh":      p.max_speed_kmh or 0,
        "accelerations":      p.accelerations or 0,
        "work_load_index":    p.work_load_index or 0,
    } for p in all_perfs]

    svc = ProfileService()
    profile_map = svc.train_and_classify(records)

    updated = 0
    for athlete_id, profile_type in profile_map.items():
        a_repo.update(athlete_id, {"profile_type": profile_type})
        updated += 1

    return {"updated": updated, "profiles": profile_map}
