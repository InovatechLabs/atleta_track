#!/usr/bin/env python3
"""
Seed do banco com atletas e performances de exemplo.
Execute: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import random
from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, Athlete, Game, Performance, Alert

Base.metadata.create_all(bind=engine)

random.seed(42)

ATHLETES = [
    ("Lucas Ferreira",  9,  "ATA"), ("Rodrigo Lima",   11, "ATA"),
    ("Marcos Silva",    8,  "MEI"), ("Felipe Santos",  10, "MEI"),
    ("Gabriel Costa",  4,  "DEF"), ("Carlos Mota",    5,  "DEF"),
    ("Diego Souza",    7,  "ALA"), ("Rafael Alves",   3,  "DEF"),
    ("Pedro Henrique", 6,  "MEI"), ("Thiago Alves",   1,  "GOL"),
    ("Bruno Lima",     2,  "DEF"), ("Anderson Silva", 12, "ATA"),
    ("Matheus Costa",  17, "ALA"), ("Ricardo Nunes",  14, "MEI"),
    ("Eduardo Melo",   20, "DEF"),
]

OPPONENTS = [
    "Corinthians","Palmeiras","São Paulo","Flamengo","Santos",
    "Grêmio","Cruzeiro","Fluminense","Botafogo","Vasco",
    "Internacional","Atlético-MG","Bahia","Fortaleza","Ceará",
    "Sport","Goiás","Cuiabá","Bragantino","América-MG","Juventude","Avaí",
]

def rand_perf(athlete_id: int, game_id: int, round_num: int, has_anomaly: bool = False) -> dict:
    base = {
        "athlete_id":           athlete_id,
        "game_id":              game_id,
        "minutes_played":       random.uniform(60, 90),
        "distance_km":          random.uniform(8.0, 12.5),
        "sprint_distance_m":    random.uniform(300, 1100),
        "high_intensity_run_m": random.uniform(500, 1800),
        "max_speed_kmh":        random.uniform(26, 36),
        "accelerations":        random.randint(10, 35),
        "decelerations":        random.randint(8, 30),
        "work_load_index":      random.uniform(60, 95),
        "heart_rate_avg":       random.uniform(140, 170),
        "heart_rate_max":       random.uniform(175, 195),
        "is_anomaly":           False,
        "anomaly_score":        random.uniform(-0.1, 0.2),
    }
    if has_anomaly:
        base["distance_km"]       *= random.uniform(0.45, 0.65)
        base["sprint_distance_m"] *= random.uniform(0.40, 0.60)
        base["work_load_index"]   *= random.uniform(0.45, 0.65)
        base["max_speed_kmh"]     *= random.uniform(0.75, 0.85)
        base["is_anomaly"]         = True
        base["anomaly_score"]      = random.uniform(-0.55, -0.25)
    return base

def main():
    db = SessionLocal()
    try:
        # Admin user
        if not db.query(User).filter(User.email == "admin@atletatrack.app").first():
            db.add(User(
                email="admin@atletatrack.app",
                name="Administrador",
                hashed_password=hash_password("atletatrack123"),
                role="admin",
            ))
            db.add(User(
                email="comissao@atletatrack.app",
                name="Comissão Técnica",
                hashed_password=hash_password("atletatrack123"),
                role="staff",
            ))
            db.commit()
            print("✓ Usuários criados")

        # Athletes
        athletes = []
        if db.query(Athlete).count() == 0:
            for name, number, pos in ATHLETES:
                a = Athlete(name=name, number=number, position=pos, nationality="Brasileiro")
                db.add(a)
            db.commit()
            print(f"✓ {len(ATHLETES)} atletas criados")
        athletes = db.query(Athlete).all()

        # Games + Performances (22 rounds)
        if db.query(Game).count() == 0:
            base_date = datetime(2025, 8, 10)
            for r in range(1, 23):
                opp = OPPONENTS[(r - 1) % len(OPPONENTS)]
                g = Game(
                    round_number=r,
                    opponent=opp,
                    date=base_date + timedelta(weeks=r - 1),
                    home_away="home" if r % 2 == 1 else "away",
                    score_home=random.randint(0, 4),
                    score_away=random.randint(0, 3),
                    season="2025/26",
                )
                db.add(g)
                db.commit()
                db.refresh(g)

                for athlete in athletes:
                    # Last 3 rounds: Marcos Silva (id 3) e Pedro Henrique (id 9) com anomalia
                    has_anomaly = (
                        r >= 20 and athlete.id in [3, 9]
                    )
                    p = Performance(**rand_perf(athlete.id, g.id, r, has_anomaly))
                    db.add(p)
                db.commit()

            print("✓ 22 rodadas + performances criadas")

        # Alerts for anomaly athletes
        if db.query(Alert).count() == 0:
            marcos = db.query(Athlete).filter(Athlete.name == "Marcos Silva").first()
            pedro  = db.query(Athlete).filter(Athlete.name == "Pedro Henrique").first()
            diego  = db.query(Athlete).filter(Athlete.name == "Diego Souza").first()
            last_game = db.query(Game).order_by(Game.round_number.desc()).first()

            if marcos:
                db.add(Alert(
                    athlete_id=marcos.id, game_id=last_game.id if last_game else None,
                    severity="high",
                    title=f"{marcos.name} — Queda crítica de desempenho",
                    description="Distância de sprint 42% abaixo da média histórica. Velocidade máxima 18% abaixo do padrão individual. Possível fadiga acumulada.",
                    is_read=False, is_resolved=False,
                ))
            if pedro:
                db.add(Alert(
                    athlete_id=pedro.id, game_id=last_game.id if last_game else None,
                    severity="high",
                    title=f"{pedro.name} — Carga de impacto anômala",
                    description="Número de acelerações 3.2 desvios padrão acima do histórico. Risco de sobrecarga muscular.",
                    is_read=False, is_resolved=False,
                ))
            if diego:
                db.add(Alert(
                    athlete_id=diego.id, game_id=None,
                    severity="medium",
                    title=f"{diego.name} — Queda progressiva de resistência",
                    description="Tendência de queda na distância total percorrida ao longo das últimas 4 partidas. Redução de 8% por rodada.",
                    is_read=False, is_resolved=False,
                ))
            db.commit()
            print("✓ Alertas de exemplo criados")

        print("\n✅ Seed concluído!")
        print("   Login: admin@atletatrack.app / atletatrack123")
        print("   Login: comissao@atletatrack.app / atletatrack123")

    finally:
        db.close()

if __name__ == "__main__":
    main()
