from __future__ import annotations

from sqlalchemy import JSON, Column, ForeignKey, Index, Integer, UniqueConstraint
from sqlmodel import Field, SQLModel


class XPeXMercadoPagoCheckout(SQLModel, table=True):
    __tablename__ = "xpex_mercadopago_checkout"
    __table_args__ = (
        UniqueConstraint("checkout_id", name="uq_xpex_mp_checkout_id"),
        UniqueConstraint("preference_id", name="uq_xpex_mp_preference_id"),
        Index("ix_xpex_mp_checkout_org_status", "org_id", "status"),
    )

    id: int | None = Field(default=None, primary_key=True)
    checkout_id: str = Field(index=True, max_length=80)
    preference_id: str = Field(index=True, max_length=160)
    org_id: int = Field(sa_column=Column(Integer, ForeignKey("organization.id", ondelete="CASCADE"), nullable=False))
    created_by_user_id: int = Field(sa_column=Column(Integer, ForeignKey("user.id", ondelete="RESTRICT"), nullable=False))
    course_uuid: str | None = Field(default=None, max_length=100)
    title: str = Field(max_length=220)
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(gt=0)
    currency: str = Field(default="BRL", max_length=8)
    status: str = Field(default="PENDING", max_length=40)
    external_reference: str = Field(index=True, max_length=180)
    init_point: str | None = Field(default=None, max_length=1000)
    sandbox_init_point: str | None = Field(default=None, max_length=1000)
    provider_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_at: str = Field(max_length=64)
    updated_at: str = Field(max_length=64)


class XPeXMercadoPagoEvent(SQLModel, table=True):
    __tablename__ = "xpex_mercadopago_event"
    __table_args__ = (
        UniqueConstraint("event_key", name="uq_xpex_mp_event_key"),
        Index("ix_xpex_mp_event_resource", "resource_type", "resource_id"),
    )

    id: int | None = Field(default=None, primary_key=True)
    event_key: str = Field(index=True, max_length=220)
    notification_id: str | None = Field(default=None, max_length=120)
    action: str = Field(default="", max_length=120)
    resource_type: str = Field(default="", max_length=80)
    resource_id: str = Field(default="", max_length=180)
    live_mode: bool = False
    verified: bool = False
    processing_state: str = Field(default="RECEIVED", max_length=40)
    normalized_status: str | None = Field(default=None, max_length=40)
    external_reference: str | None = Field(default=None, max_length=180)
    provider_snapshot: dict = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    created_at: str = Field(max_length=64)
    updated_at: str = Field(max_length=64)
