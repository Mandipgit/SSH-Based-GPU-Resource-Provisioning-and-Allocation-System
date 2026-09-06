"""Keep marketplace GPU rows in sync with host profiles."""
from __future__ import annotations

import re
from decimal import Decimal

from django.conf import settings


def _parse_vram_gb(vram_total: str | None, vram_gb: int | None) -> int:
    if vram_gb and int(vram_gb) > 0:
        return int(vram_gb)
    if not vram_total:
        return 4
    digits = re.sub(r"[^0-9]", "", str(vram_total))
    if not digits:
        return 4
    raw = int(digits)
    # nvidia-smi often reports MiB
    if raw >= 256:
        return max(1, round(raw / 1024))
    return max(1, raw)


def _default_price() -> Decimal:
    raw = getattr(settings, "DEFAULT_PRICE_PER_HOUR", None)
    try:
        value = Decimal(str(raw if raw is not None else "2.00"))
    except Exception:
        value = Decimal("2.00")
    return value if value > 0 else Decimal("2.00")


def sync_host_gpu_listing(host_profile, *, mark_available: bool | None = None):
    """
    Upsert the host's primary marketplace GPU from HostProfile detection data.
    Returns the GPU instance, or None if the profile has no GPU name yet.
    """
    from gpus.models import GPU

    gpu_name = (host_profile.gpu_name or "").strip()
    if not gpu_name:
        return None

    vram_gb = _parse_vram_gb(host_profile.vram_total, host_profile.vram_gb)
    vram_total = (host_profile.vram_total or f"{vram_gb * 1024} MiB").strip()
    defaults = {
        "gpu_name": gpu_name,
        "vram_total": vram_total,
        "vram_gb": vram_gb,
        "driver_version": host_profile.driver_version,
        "cuda_version": host_profile.cuda_version,
        "location": host_profile.location or "Unknown",
    }

    gpu = (
        host_profile.gpus.order_by("created_at").first()
        or GPU.objects.filter(host=host_profile, gpu_name=gpu_name).order_by("created_at").first()
    )

    if gpu is None:
        gpu = GPU.objects.create(
            host=host_profile,
            price_per_hour=_default_price(),
            is_available=True if mark_available is None else bool(mark_available),
            **defaults,
        )
    else:
        for key, value in defaults.items():
            setattr(gpu, key, value)

        from sessions.models import Session
        has_active = Session.objects.filter(
            gpu=gpu,
            status__in=[
                "pending",
                "starting",
                "container_running",
                "tunnel_connecting",
                "active",
            ],
        ).exists()
        if not has_active and gpu.current_session_id is not None:
            gpu.current_session_id = None

        if mark_available is not None and not has_active:
            gpu.is_available = bool(mark_available)
        elif mark_available is None and host_profile.status == "online" and not has_active:
            gpu.is_available = True
        gpu.save()

    # Persist normalized vram_gb back onto profile when missing
    if not host_profile.vram_gb:
        host_profile.vram_gb = vram_gb
        host_profile.save(update_fields=["vram_gb", "updated_at"])

    # Fresh registration from the host app should appear online/rentable
    if host_profile.status == "offline" and mark_available is not False:
        host_profile.mark_online()

    return gpu
