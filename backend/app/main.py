from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.analysis import router as analysis_router

app = FastAPI(
    title="Melow Sales Intelligence",
    description="AI-powered sales call analysis, MEDPICC scoring, and deal room generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
