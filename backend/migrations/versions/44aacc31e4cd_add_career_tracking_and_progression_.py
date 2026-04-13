"""add_career_tracking_and_progression_columns

Revision ID: 44aacc31e4cd
Revises: c88e066d8fbc
Create Date: 2026-04-13 09:00:03.839931

Adds 4 new columns:
  - career_reports.chosen_career   (VARCHAR, nullable)
  - career_reports.progression_json (TEXT, nullable)
  - user.chosen_career             (VARCHAR, nullable)
  - user.career_chosen_at         (TIMESTAMP, nullable)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44aacc31e4cd'
down_revision: Union[str, Sequence[str], None] = 'c88e066d8fbc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('career_reports', sa.Column('chosen_career', sa.String(), nullable=True))
    op.add_column('career_reports', sa.Column('progression_json', sa.Text(), nullable=True))
    op.add_column('user', sa.Column('chosen_career', sa.String(), nullable=True))
    op.add_column('user', sa.Column('career_chosen_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('user', 'career_chosen_at')
    op.drop_column('user', 'chosen_career')
    op.drop_column('career_reports', 'progression_json')
    op.drop_column('career_reports', 'chosen_career')

