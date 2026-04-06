from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.alert_service import AlertService

router = APIRouter()

@router.get("/")
def list_alerts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """RF06 — Lista alertas ativos"""
    svc = AlertService(db)
    return svc.get_active_alerts()

@router.patch("/{alert_id}/read")
def mark_read(alert_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    AlertService(db).mark_read(alert_id)
    return {"ok": True}

@router.patch("/{alert_id}/resolve")
def mark_resolved(alert_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    AlertService(db).mark_resolved(alert_id)
    return {"ok": True}
