"""AI service (FastAPI) — độc lập với các NestJS service."""

from fastapi import FastAPI

app = FastAPI(title="car-marketplace-ai", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/v1/suggest")
def suggest_placeholder(payload: dict):
    """Placeholder — gợi ý mô tả / tag từ ảnh hoặc text."""
    return {"suggestions": [], "input": payload}
