"""create customers table

Revision ID: 9da8d5cf9193
Revises: 4768ab61c2fd
Create Date: 2026-06-17 21:23:44.231411

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9da8d5cf9193'
down_revision: Union[str, Sequence[str], None] = '4768ab61c2fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_customers_email", "customers", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_customers_email", table_name="customers")
    op.drop_table("customers")
