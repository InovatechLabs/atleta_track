from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ===== AUTH =====
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "staff"

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    class Config: from_attributes = True

# ===== ATHLETE =====
class AthleteCreate(BaseModel):
    name: str
    number: Optional[int]
    position: Optional[str]
    birth_date: Optional[datetime]
    nationality: Optional[str] = "Brasileiro"

class AthleteOut(BaseModel):
    id: int
    name: str
    number: Optional[int]
    position: Optional[str]
    profile_type: Optional[str]
    is_active: bool
    class Config: from_attributes = True

# ===== GAME =====
class GameCreate(BaseModel):
    round_number: int
    opponent: str
    date: datetime
    home_away: str = "home"
    season: str = "2025/26"

class GameOut(BaseModel):
    id: int
    round_number: int
    opponent: str
    date: datetime
    season: str
    class Config: from_attributes = True

# ===== PERFORMANCE =====
class PerformanceCreate(BaseModel):
    athlete_id: int
    game_id: int
    minutes_played: Optional[float]
    distance_km: Optional[float]
    sprint_distance_m: Optional[float]
    high_intensity_run_m: Optional[float]
    max_speed_kmh: Optional[float]
    accelerations: Optional[int]
    decelerations: Optional[int]
    work_load_index: Optional[float]
    heart_rate_avg: Optional[float]
    heart_rate_max: Optional[float]

class PerformanceOut(PerformanceCreate):
    id: int
    is_anomaly: bool
    anomaly_score: Optional[float]
    created_at: datetime
    class Config: from_attributes = True

# ===== ALERT =====
class AlertOut(BaseModel):
    id: int
    athlete_id: int
    severity: str
    title: str
    description: Optional[str]
    is_read: bool
    is_resolved: bool
    created_at: datetime
    athlete_name: Optional[str]
    class Config: from_attributes = True

# ===== DASHBOARD =====
class KPIResponse(BaseModel):
    avg_distance_km: float
    avg_max_speed: float
    avg_sprint_distance: float
    avg_accelerations: float
    avg_work_load: float
    athletes_in_alert: int
    athletes_normal: int
    total_athletes: int

class ProfileSummary(BaseModel):
    profile_type: str
    count: int
    avg_work_load: float
    avg_max_speed: float

class CompareResponse(BaseModel):
    athlete_a: AthleteOut
    athlete_b: AthleteOut
    metrics: dict
