"""add_activity_events_table

Revision ID: b4e8c1f3d2a1
Revises: 44aacc31e4cd
Create Date: 2026-05-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'b4e8c1f3d2a1'
down_revision: Union[str, Sequence[str], None] = '44aacc31e4cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'activity_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('subtitle', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('payload_json', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_activity_events_user_id'), 'activity_events', ['user_id'], unique=False)
    op.create_index(op.f('ix_activity_events_type'), 'activity_events', ['type'], unique=False)
    op.create_index(op.f('ix_activity_events_created_at'), 'activity_events', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_activity_events_created_at'), table_name='activity_events')
    op.drop_index(op.f('ix_activity_events_type'), table_name='activity_events')
    op.drop_index(op.f('ix_activity_events_user_id'), table_name='activity_events')
    op.drop_table('activity_events')
