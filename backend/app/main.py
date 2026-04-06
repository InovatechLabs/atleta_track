from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import athletes, auth, games, alerts, profiles
from app.core.config import settings
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AtletaTrack API",
    description="Sistema de análise de desempenho de atletas de futebol",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(athletes.router, prefix="/api/athletes", tags=["athletes"])
app.include_router(games.router,    prefix="/api/games",    tags=["games"])
app.include_router(alerts.router,   prefix="/api/alerts",   tags=["alerts"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
