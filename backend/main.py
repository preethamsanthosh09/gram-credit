import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from routers import auth, kyc, loans, analytics, rosca, expenses, schemes, chatbot
from models.user import User
from models.expense import Expense

# Initialize the SQLite database and create tables
Base.metadata.create_all(bind=engine)

# Database startup seeding function for demo farmer
def seed_expenses():
    db = SessionLocal()
    try:
        # Ensure user_id=1 exists so FK constraint passes
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(
                id=1,
                phone="7975200593",
                name="Ravi Kumar",
                role="farmer",
                district="Mandya",
                crop_type="Paddy",
                land_acres=4.0,
                shg_member=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Seed expenses if empty
        expense_count = db.query(Expense).filter(Expense.user_id == 1).count()
        if expense_count == 0:
            seed_data = [
                Expense(user_id=1, category="Seeds", amount=3200.0, note="High yield hybrid seeds", expense_date="2026-05-10"),
                Expense(user_id=1, category="Fertilizer", amount=1800.0, note="Organic NPK fertilizer", expense_date="2026-05-12"),
                Expense(user_id=1, category="Labour", amount=5000.0, note="Sowing & tilling labor", expense_date="2026-05-15"),
                Expense(user_id=1, category="Equipment", amount=2500.0, note="Tractor rental", expense_date="2026-05-18"),
                Expense(user_id=1, category="Food", amount=1200.0, note="Catering for field workers", expense_date="2026-05-20"),
            ]
            for exp in seed_data:
                db.add(exp)
            db.commit()
            print("[Startup Seeder] GramCredit expenses seeded successfully for user 1.")
    except Exception as e:
        print(f"[Startup Seeder] Error during seeding: {e}")
    finally:
        db.close()

app = FastAPI(
    title="GramCredit Backend",
    description="GramCredit backend service with SQLite, SQLAlchemy, and JWT Authentication",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    seed_expenses()

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Default Vite React port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*",  # Allow all for development flexibility
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(kyc.router)
app.include_router(loans.router)
app.include_router(analytics.router)
app.include_router(rosca.router, prefix="/api/rosca", tags=["ROSCA"])
app.include_router(expenses.router)
app.include_router(schemes.router)
app.include_router(chatbot.router)







from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException
import os

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/my-react-app/dist"))

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        if catchall.startswith(("api", "docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "healthy", "service": "GramCredit API"}
else:
    @app.get("/")
    def read_root():
        return {
            "status": "healthy",
            "service": "GramCredit API",
            "docs": "/docs"
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
