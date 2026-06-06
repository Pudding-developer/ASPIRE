"""merge_heads

Revision ID: 36712b2dcc6b
Revises: 4907b9d51769, b4e8c1f3d2a1
Create Date: 2026-05-10 14:32:22.451580

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36712b2dcc6b'
down_revision: Union[str, Sequence[str], None] = ('4907b9d51769', 'b4e8c1f3d2a1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
