"""add_is_class_rep_to_class_enrollments

Revision ID: e1f2a3b4c5d6
Revises: d0bc1d263d8d
Create Date: 2026-05-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd0bc1d263d8d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'class_enrollments',
        sa.Column('is_class_rep', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column('class_enrollments', 'is_class_rep')
