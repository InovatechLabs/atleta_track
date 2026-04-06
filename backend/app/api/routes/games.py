from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.schemas import GameCreate, GameOut
from app.models.user import User, Game
from app.services.import_service import ImportService
from app.repositories.athlete_repository import PerformanceRepository

router = APIRouter()

@router.get("/", response_model=List[GameOut])
def list_games(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Game).order_by(Game.round_number.desc()).all()

@router.post("/", response_model=GameOut, status_code=201)
def create_game(payload: GameCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    game = Game(**payload.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game

@router.post("/{game_id}/import")
async def import_game_data(
    game_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """RF01, RF02 — Importa dados de desempenho de uma partida"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(404, "Partida não encontrada")
    svc = ImportService(db)
    return await svc.import_from_file(file, game_id)

@router.get("/dashboard/kpis")
def get_kpis(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """RF07 — KPIs para dashboard"""
    repo = PerformanceRepository(db)
    kpis = repo.get_kpis()
    from app.models.user import Alert, Athlete
    alerts_count = db.query(Alert).filter(Alert.is_resolved == False).count()
    normal_count = db.query(Athlete).filter(Athlete.is_active == True).count()
    kpis["athletes_in_alert"] = alerts_count
    kpis["athletes_normal"]   = max(0, normal_count - alerts_count)
    kpis["total_athletes"]    = normal_count
    return kpis
