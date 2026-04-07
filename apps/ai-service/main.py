"""AI service (FastAPI) — độc lập với các NestJS service."""

import io
import os
from typing import Any

from fastapi import FastAPI, File, UploadFile
from PIL import Image

app = FastAPI(title="car-marketplace-ai", version="0.1.0")

# UC17: bật để luôn trả valid=False (test luồng từ chối / chờ QTV)
_SIMULATE_VIOLATION = os.environ.get("AI_SIMULATE_IMAGE_VIOLATION", "").lower() in (
    "1",
    "true",
    "yes",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/v1/suggest")
def suggest_placeholder(payload: dict):
    """Placeholder — gợi ý mô tả / tag từ ảnh hoặc text."""
    return {"suggestions": [], "input": payload}


@app.post("/v1/images/validate")
async def validate_listing_image(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    UC17 — kiểm tra ảnh bài đăng (stub có thể thay bằng model thật).

    - Từ chối nếu không đọc được ảnh hoặc quá nhỏ.
    - Nếu AI_SIMULATE_IMAGE_VIOLATION=true: luôn coi là vi phạm (test).
    - Ngược lại: chấp nhận JPEG/PNG hợp lệ kích thước tối thiểu.
    """
    raw = await file.read()
    if len(raw) < 256:
        return {
            "valid": False,
            "reason": "file_too_small_or_corrupt",
            "violations": ["size"],
        }

    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()
    except Exception:
        return {
            "valid": False,
            "reason": "invalid_image_data",
            "violations": ["format"],
        }

    if _SIMULATE_VIOLATION:
        return {
            "valid": False,
            "reason": "simulated_policy_violation",
            "violations": ["simulated"],
        }

    return {
        "valid": True,
        "reason": None,
        "violations": [],
    }
