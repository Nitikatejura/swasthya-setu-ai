"""add temperature_unit and clinical_orders

Revision ID: 002_add_temperature_unit_and_orders
Revises: 001_initial_schema
Create Date: 2026-07-31 03:55:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_temperature_unit_and_orders'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add temperature_unit column to vitals table if it doesn't exist
    try:
        op.add_column('vitals', sa.Column('temperature_unit', sa.String(length=10), server_default='F', nullable=True))
    except Exception:
        pass

    # Add clinical_orders column to doctor_notes table if it doesn't exist
    try:
        op.add_column('doctor_notes', sa.Column('clinical_orders', sa.Text(), nullable=True))
    except Exception:
        pass

def downgrade() -> None:
    try:
        op.drop_column('vitals', 'temperature_unit')
    except Exception:
        pass
    try:
        op.drop_column('doctor_notes', 'clinical_orders')
    except Exception:
        pass
