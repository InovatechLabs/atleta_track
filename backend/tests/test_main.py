"""
Testes do backend AtletaTrack
Execute: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User

# ===== Banco em memória para testes =====
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestSessionLocal()
    # Criar usuário de teste
    if not db.query(User).filter(User.email == "test@test.com").first():
        user = User(
            email="test@test.com",
            name="Teste",
            hashed_password=hash_password("test123"),
            role="admin",
        )
        db.add(user)
        db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    res = client.post("/api/auth/login", data={"username": "test@test.com", "password": "test123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ===== TESTES AUTH =====
class TestAuth:
    def test_login_success(self, client):
        res = client.post("/api/auth/login", data={"username": "test@test.com", "password": "test123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        res = client.post("/api/auth/login", data={"username": "test@test.com", "password": "errado"})
        assert res.status_code == 401

    def test_login_unknown_user(self, client):
        res = client.post("/api/auth/login", data={"username": "nao@existe.com", "password": "123"})
        assert res.status_code == 401

# ===== TESTES ATHLETES =====
class TestAthletes:
    def test_list_athletes_requires_auth(self, client):
        res = client.get("/api/athletes/")
        assert res.status_code == 401

    def test_list_athletes_empty(self, client, auth_headers):
        res = client.get("/api/athletes/", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_create_athlete(self, client, auth_headers):
        payload = {"name": "João Silva", "number": 10, "position": "MEI", "nationality": "Brasileiro"}
        res = client.post("/api/athletes/", json=payload, headers=auth_headers)
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "João Silva"
        assert data["position"] == "MEI"

    def test_get_athlete_not_found(self, client, auth_headers):
        res = client.get("/api/athletes/9999", headers=auth_headers)
        assert res.status_code == 404

    def test_athlete_performances(self, client, auth_headers):
        # Criar atleta primeiro
        res = client.post("/api/athletes/", json={"name": "Teste", "number": 7, "position": "ATA"}, headers=auth_headers)
        athlete_id = res.json()["id"]
        res = client.get(f"/api/athletes/{athlete_id}/performances", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

# ===== TESTES GAMES =====
class TestGames:
    def test_list_games(self, client, auth_headers):
        res = client.get("/api/games/", headers=auth_headers)
        assert res.status_code == 200

    def test_create_game(self, client, auth_headers):
        payload = {"round_number": 1, "opponent": "Palmeiras", "date": "2026-04-10T20:00:00", "home_away": "home"}
        res = client.post("/api/games/", json=payload, headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["opponent"] == "Palmeiras"

    def test_kpis(self, client, auth_headers):
        res = client.get("/api/games/dashboard/kpis", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "avg_distance_km" in data
        assert "athletes_in_alert" in data

# ===== TESTES ALERTS =====
class TestAlerts:
    def test_list_alerts(self, client, auth_headers):
        res = client.get("/api/alerts/", headers=auth_headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

# ===== TESTES ML =====
class TestML:
    def test_kmeans_profile_service(self):
        from app.ml.ml_service import ProfileService
        import pandas as pd

        data = [
            {"athlete_id": i, "distance_km": 10+i*0.1, "sprint_distance_m": 600+i*30,
             "high_intensity_run_m": 1000+i*50, "max_speed_kmh": 30+i*0.5,
             "accelerations": 15+i, "work_load_index": 70+i*2}
            for i in range(20)
        ]
        svc = ProfileService()
        profiles = svc.train_and_classify(data)
        assert len(profiles) > 0
        assert all(v in ["explosivo","alta_resistencia","alta_carga_impacto","baixa_intensidade","nao_classificado"] for v in profiles.values())

    def test_isolation_forest_anomaly(self):
        from app.ml.ml_service import AnomalyDetectionService
        import random

        random.seed(42)
        train_data = [
            {"athlete_id": 1, "id": i, "game_id": i,
             "distance_km": 10 + random.uniform(-0.5, 0.5),
             "sprint_distance_m": 700 + random.uniform(-50, 50),
             "high_intensity_run_m": 1200 + random.uniform(-100, 100),
             "max_speed_kmh": 32 + random.uniform(-1, 1),
             "accelerations": 20 + random.randint(-2, 2),
             "work_load_index": 80 + random.uniform(-5, 5)}
            for i in range(30)
        ]
        anomaly_data = [{
            "athlete_id": 1, "id": 999, "game_id": 999,
            "distance_km": 4.0, "sprint_distance_m": 100,
            "high_intensity_run_m": 200, "max_speed_kmh": 20,
            "accelerations": 3, "work_load_index": 30,
        }]

        svc = AnomalyDetectionService()
        svc.train(train_data)
        results = svc.detect(anomaly_data)
        assert len(results) == 1
        assert results[0]["is_anomaly"] is True

    def test_health_endpoint(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
