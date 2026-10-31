from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.api import profiles, scenarios, experiments, results, reports
from backend.app.services.gateway import gateway_service
from backend.app.services.storage import storage_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Production API platform for Problem Statement PS-029: "
        "Application-Oriented Network Quality Evaluation Using QoO. "
        "Developed by Team DevElite for AIORI Hackathon 3."
    ),
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React/Vite dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(profiles.router, prefix=settings.API_PREFIX)
app.include_router(scenarios.router, prefix=settings.API_PREFIX)
app.include_router(experiments.router, prefix=settings.API_PREFIX)
app.include_router(results.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing %s v%s...", settings.PROJECT_NAME, settings.PROJECT_VERSION)
    storage_service.recompute_summaries()
    # Safety reset baseline
    gateway_service.reset_baseline()

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Shutting down... Executing safety baseline reset on gateway...")
    gateway_service.reset_baseline()

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "team": "Team DevElite (A3-PS029-TC237)",
        "hackathon": "AIORI Hackathon 3 - Internet Measurement",
        "problem_statement": "PS-029",
        "specification": "draft-ietf-ippm-qoo",
        "api_docs": "/docs",
        "endpoints": {
            "profiles": "/api/profiles",
            "scenarios": "/api/scenarios",
            "experiments": "/api/experiments",
            "results": "/api/results",
            "reports": "/api/reports"
        }
    }

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "gateway_connected": True,
        "active_impairment": gateway_service.current_state
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
