from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.repositories.athlete_repository import AthleteRepository

router = APIRouter()

@router.get("/summary")
def profiles_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """RF03 — Resumo de perfis identificados"""
    repo = AthleteRepository(db)
    rows = repo.get_profile_summary()
    return [
        {
            "profile_type":  r.profile_type or "nao_classificado",
            "count":         r.count,
            "avg_work_load": round(r.avg_work_load or 0, 1),
            "avg_max_speed": round(r.avg_max_speed or 0, 1),
        }
        for r in rows
    ]
