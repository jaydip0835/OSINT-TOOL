from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import domain, ip, vehicle, username, metadata, dork, report

app = FastAPI(
    title="OSINT X",
    description="All-in-One OSINT Investigation Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(domain.router)
app.include_router(ip.router)
app.include_router(vehicle.router)
app.include_router(username.router)
app.include_router(metadata.router)
app.include_router(dork.router)
app.include_router(report.router)

@app.get("/")
def root():
    return {"name": "OSINT X", "status": "running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}