"""
Standalone Predictor CLI for SANJHA Crop Yield Model.
Used both directly and as fallback when FastAPI service is not running.
"""

import sys
import json
import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'artifacts', 'crop_yield_pipeline.joblib')

DEFAULT_MEANS = {
    'rainfall_mm': 650.0,
    'temperature_c': 25.0,
    'nitrogen_n': 100.0,
    'phosphorus_p': 50.0,
    'potassium_k': 80.0,
    'season': 'kharif',
    'soil_type': 'loamy',
}

SUPPORTED_CROPS = [
    'chilli', 'cotton', 'maize', 'onion', 'potato', 'pulses', 'rice', 'sugarcane', 'tomato', 'wheat'
]

def predict(input_data: dict) -> dict:
    if not os.path.exists(MODEL_PATH):
        return {
            'error': 'Model artifact not found. Please run ml-service/train.py first.',
            'status': 500
        }
        
    crop = str(input_data.get('crop', '')).strip().lower()
    if not crop:
        return {'error': 'Crop name is required', 'status': 400}
        
    if crop not in SUPPORTED_CROPS:
        return {
            'error': f"Crop '{crop}' is not in the trained dataset. Supported crops: {', '.join(SUPPORTED_CROPS)}",
            'status': 422,
            'supported_crops': SUPPORTED_CROPS
        }
        
    try:
        pipeline = joblib.load(MODEL_PATH)
    except Exception as e:
        return {'error': f'Failed to load model artifact: {str(e)}', 'status': 500}
        
    row = {
        'crop': crop,
        'season': str(input_data.get('season') or DEFAULT_MEANS['season']).strip().lower(),
        'soil_type': str(input_data.get('soil_type') or DEFAULT_MEANS['soil_type']).strip().lower(),
        'rainfall_mm': float(input_data.get('rainfall_mm') if input_data.get('rainfall_mm') is not None else DEFAULT_MEANS['rainfall_mm']),
        'temperature_c': float(input_data.get('temperature_c') if input_data.get('temperature_c') is not None else DEFAULT_MEANS['temperature_c']),
        'nitrogen_n': float(input_data.get('nitrogen') or input_data.get('nitrogen_n') or DEFAULT_MEANS['nitrogen_n']),
        'phosphorus_p': float(input_data.get('phosphorus') or input_data.get('phosphorus_p') or DEFAULT_MEANS['phosphorus_p']),
        'potassium_k': float(input_data.get('potassium') or input_data.get('potassium_k') or DEFAULT_MEANS['potassium_k']),
    }
    
    df = pd.DataFrame([row])
    
    try:
        pred_val = float(pipeline.predict(df)[0])
        pred_val = max(50.0, round(pred_val, 1))
        
        return {
            'crop': crop,
            'predicted_yield_kg_per_acre': pred_val,
            'model_type': 'Experimental Prototype (Gradient Boosting Regressor)',
            'dataset_type': 'Synthetic Benchmark Data',
            'unit': 'kg/acre',
            'features_used': row,
            'disclaimer': 'Experimental model trained on synthetic data. Not validated for real-world yield prediction.',
            'status': 200
        }
    except Exception as e:
        return {'error': f'Prediction computation failed: {str(e)}', 'status': 500}

if __name__ == '__main__':
    if len(sys.argv) > 1:
        raw_json = sys.argv[1]
        try:
            payload = json.loads(raw_json)
        except Exception:
            payload = {}
    else:
        payload = json.loads(sys.stdin.read() or '{}')
        
    result = predict(payload)
    print(json.dumps(result))
