"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'])

    op.create_table('athletes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('number', sa.Integer(), nullable=True),
        sa.Column('position', sa.String(10), nullable=True),
        sa.Column('birth_date', sa.DateTime(), nullable=True),
        sa.Column('nationality', sa.String(100), nullable=True),
        sa.Column('profile_type', sa.String(50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_athletes_id', 'athletes', ['id'])

    op.create_table('games',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('round_number', sa.Integer(), nullable=False),
        sa.Column('opponent', sa.String(255), nullable=True),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('home_away', sa.String(10), nullable=True),
        sa.Column('score_home', sa.Integer(), nullable=True),
        sa.Column('score_away', sa.Integer(), nullable=True),
        sa.Column('season', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_games_id', 'games', ['id'])

    op.create_table('performances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('athlete_id', sa.Integer(), nullable=False),
        sa.Column('game_id', sa.Integer(), nullable=False),
        sa.Column('minutes_played', sa.Float(), nullable=True),
        sa.Column('distance_km', sa.Float(), nullable=True),
        sa.Column('sprint_distance_m', sa.Float(), nullable=True),
        sa.Column('high_intensity_run_m', sa.Float(), nullable=True),
        sa.Column('max_speed_kmh', sa.Float(), nullable=True),
        sa.Column('accelerations', sa.Integer(), nullable=True),
        sa.Column('decelerations', sa.Integer(), nullable=True),
        sa.Column('work_load_index', sa.Float(), nullable=True),
        sa.Column('heart_rate_avg', sa.Float(), nullable=True),
        sa.Column('heart_rate_max', sa.Float(), nullable=True),
        sa.Column('is_anomaly', sa.Boolean(), nullable=True),
        sa.Column('anomaly_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['athlete_id'], ['athletes.id']),
        sa.ForeignKeyConstraint(['game_id'], ['games.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_performances_id', 'performances', ['id'])
    op.create_index('ix_performances_athlete_id', 'performances', ['athlete_id'])

    op.create_table('alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('athlete_id', sa.Integer(), nullable=False),
        sa.Column('game_id', sa.Integer(), nullable=True),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('indicators', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['athlete_id'], ['athletes.id']),
        sa.ForeignKeyConstraint(['game_id'], ['games.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_alerts_id', 'alerts', ['id'])

def downgrade():
    op.drop_table('alerts')
    op.drop_table('performances')
    op.drop_table('games')
    op.drop_table('athletes')
    op.drop_table('users')
