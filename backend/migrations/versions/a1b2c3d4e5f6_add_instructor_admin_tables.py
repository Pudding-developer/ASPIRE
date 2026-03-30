"""add_instructor_admin_tables

Revision ID: a1b2c3d4e5f6
Revises: 371c0cdf1011
Create Date: 2026-03-26

Adds: instructor, instructor_invite_token, admin tables.
Does NOT touch the existing user table.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '371c0cdf1011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admin',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('google_id', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=False, server_default='admin'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_admin_email'), 'admin', ['email'], unique=True)

    op.create_table(
        'instructor',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('google_id', sa.String(), nullable=True),
        sa.Column('auth_provider', sa.String(), nullable=False, server_default='google'),
        sa.Column('role', sa.String(), nullable=False, server_default='instructor'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_instructor_email'), 'instructor', ['email'], unique=True)

    op.create_table(
        'instructorinvitetoken',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('assigned_email', sa.String(), nullable=True),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('used_by_email', sa.String(), nullable=True),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_instructorinvitetoken_token'), 'instructorinvitetoken', ['token'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_instructorinvitetoken_token'), table_name='instructorinvitetoken')
    op.drop_table('instructorinvitetoken')
    op.drop_index(op.f('ix_instructor_email'), table_name='instructor')
    op.drop_table('instructor')
    op.drop_index(op.f('ix_admin_email'), table_name='admin')
    op.drop_table('admin')
