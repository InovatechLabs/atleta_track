from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class ProfileType(str, enum.Enum):
    EXPLOSIVE    = "explosivo"
    HIGH_ENDURANCE = "alta_resistencia"
    HIGH_IMPACT  = "alta_carga_impacto"
    LOW_INTENSITY = "baixa_intensidade"
    UNCLASSIFIED = "nao_classificado"

class Position(str, enum.Enum):
    GOALKEEPER = "GOL"
    DEFENDER   = "DEF"
    MIDFIELDER = "MEI"
    WINGER     = "ALA"
    FORWARD    = "ATA"

class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String(255), unique=True, index=True, nullable=False)
    name       = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role       = Column(String(50), default="staff")
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Athlete(Base):
    __tablename__ = "athletes"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(255), nullable=False)
    number       = Column(Integer)
    position     = Column(String(10))
    birth_date   = Column(DateTime)
    nationality  = Column(String(100))
    profile_type = Column(String(50), default=ProfileType.UNCLASSIFIED)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    performances = relationship("Performance", back_populates="athlete")
    alerts       = relationship("Alert", back_populates="athlete")

class Game(Base):
    __tablename__ = "games"
    id           = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer, nullable=False)
    opponent     = Column(String(255))
    date         = Column(DateTime, nullable=False)
    home_away    = Column(String(10))
    score_home   = Column(Integer)
    score_away   = Column(Integer)
    season       = Column(String(20), default="2025/26")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    performances = relationship("Performance", back_populates="game")

class Performance(Base):
    __tablename__ = "performances"
    id                    = Column(Integer, primary_key=True, index=True)
    athlete_id            = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    game_id               = Column(Integer, ForeignKey("games.id"), nullable=False)
    minutes_played        = Column(Float)
    distance_km           = Column(Float)
    sprint_distance_m     = Column(Float)
    high_intensity_run_m  = Column(Float)
    max_speed_kmh         = Column(Float)
    accelerations         = Column(Integer)
    decelerations         = Column(Integer)
    work_load_index       = Column(Float)
    heart_rate_avg        = Column(Float)
    heart_rate_max        = Column(Float)
    is_anomaly            = Column(Boolean, default=False)
    anomaly_score         = Column(Float)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    athlete = relationship("Athlete", back_populates="performances")
    game    = relationship("Game", back_populates="performances")

class Alert(Base):
    __tablename__ = "alerts"
    id           = Column(Integer, primary_key=True, index=True)
    athlete_id   = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    game_id      = Column(Integer, ForeignKey("games.id"))
    severity     = Column(String(20), nullable=False)  # high | medium | low
    title        = Column(String(500), nullable=False)
    description  = Column(Text)
    indicators   = Column(Text)  # JSON string
    is_read      = Column(Boolean, default=False)
    is_resolved  = Column(Boolean, default=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    athlete = relationship("Athlete", back_populates="alerts")
