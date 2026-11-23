"""
FastAPI Microservice for SANJHA Crop Yield Prediction.
Run locally with:
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predict import predict, SUPPORTED_CROPS

app = FastAPI(
    title="SANJHA Crop Intelligence ML Service (Prototype)",
    description="Experimental crop yield estimation API trained on synthetic benchmark data for hackathon prototype testing. Not validated for real-world yield prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class YieldPredictionInput(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. tomato, onion, chilli, rice, wheat)")
    season: Optional[str] = Field("kharif", description="Season: kharif, rabi, zaid, annual")
    soil_type: Optional[str] = Field("loamy", description="Soil type: loamy, black, clay, red, sandy")
    rainfall_mm: float = Field(..., ge=0, le=5000, description="Annual/seasonal rainfall in mm")
    temperature_c: float = Field(..., ge=-10, le=60, description="Mean growing temperature in Celsius")
    nitrogen: Optional[float] = Field(100.0, ge=0, le=500, description="Soil Nitrogen availability in kg/ha")
    phosphorus: Optional[float] = Field(50.0, ge=0, le=500, description="Soil Phosphorus availability in kg/ha")
    potassium: Optional[float] = Field(80.0, ge=0, le=500, description="Soil Potassium availability in kg/ha")

@app.get("/health")
def health():
    model_exists = os.path.exists(
        os.path.join(os.path.dirname(__file__), "artifacts", "crop_yield_pipeline.joblib")
    )
    return {
        "status": "healthy" if model_exists else "degraded",
        "model_loaded": model_exists,
        "service": "sanjha-ml-crop-intelligence"
    }

@app.get("/metadata")
def metadata():
    report_path = os.path.join(os.path.dirname(__file__), "artifacts", "model_evaluation_report.json")
    if os.path.exists(report_path):
        with open(report_path) as f:
            return json.load(f)
    return {
        "supported_crops": SUPPORTED_CROPS,
        "target": "yield_kg_per_acre"
    }

@app.post("/predict")
def predict_yield(payload: YieldPredictionInput):
    data = payload.model_dump()
    result = predict(data)
    
    if result.get("status") == 400:
        raise HTTPException(status_code=400, detail=result.get("error"))
    elif result.get("status") == 422:
        raise HTTPException(status_code=422, detail=result)
    elif result.get("status") != 200:
        raise HTTPException(status_code=500, detail=result.get("error"))
        
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
