"""
SANJHA Crop Intelligence — ML Training Script
Trains a regression model to estimate crop yield (kg/acre)
from agricultural, soil and environmental features.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'crop_yield_india.csv')
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'artifacts')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def train_and_evaluate():
    print(f"Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    
    # 1. Exploratory Data Audit
    print(f"Total observations: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print(f"Missing values count: {df.isnull().sum().to_dict()}")
    print(f"Unique crops ({len(df['crop'].unique())}): {sorted(df['crop'].unique())}")
    
    # Check duplicates and drop if any
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        print(f"Removing {duplicates} duplicate rows")
        df = df.drop_duplicates()
    
    categorical_features = ['crop', 'season', 'soil_type']
    numeric_features = ['rainfall_mm', 'temperature_c', 'nitrogen_n', 'phosphorus_p', 'potassium_k']
    target = 'yield_kg_per_acre'
    
    X = df[categorical_features + numeric_features]
    y = df[target]
    
    # 2. Train / Test Split (80 / 20) with fixed seed to avoid leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    
    # 3. Preprocessing Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features),
        ]
    )
    
    # 4. Compare Models
    models = {
        'Baseline (Mean Predictor)': DummyRegressor(strategy='mean'),
        'Random Forest Regressor': RandomForestRegressor(
            n_estimators=120, max_depth=14, min_samples_split=4, random_state=42, n_jobs=-1
        ),
        'Gradient Boosting Regressor': GradientBoostingRegressor(
            n_estimators=120, learning_rate=0.08, max_depth=6, random_state=42
        ),
    }
    
    results = {}
    best_model_name = None
    best_r2 = -float('inf')
    best_pipeline = None
    
    for name, reg in models.items():
        pipe = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', reg)
        ])
        
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)
        
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))
        
        results[name] = {
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'r2_score': round(r2, 4),
        }
        
        print(f"\n--- {name} ---")
        print(f"  MAE:  {mae:,.2f} kg/acre")
        print(f"  RMSE: {rmse:,.2f} kg/acre")
        print(f"  R²:   {r2:.4f}")
        
        if r2 > best_r2:
            best_r2 = r2
            best_model_name = name
            best_pipeline = pipe
            
    print(f"\n>> Selected Best Model: {best_model_name} (R² = {best_r2:.4f})")
    
    # 5. Save Artifacts
    model_file = os.path.join(ARTIFACTS_DIR, 'crop_yield_pipeline.joblib')
    joblib.dump(best_pipeline, model_file)
    print(f"Saved pipeline to: {model_file}")
    
    # 6. Save Evaluation Report
    report = {
        'dataset': {
            'file': 'crop_yield_india.csv',
            'type': 'synthetic',
            'provenance': 'Synthetic benchmark dataset generated via generate_dataset.py for hackathon prototype testing',
            'disclaimer': 'Experimental model trained on synthetic data. Not validated for real-world yield prediction.',
            'samples': len(df),
            'crops_supported': sorted(df['crop'].unique().tolist()),
            'features': categorical_features + numeric_features,
            'target': target,
            'target_unit': 'kg/acre',
        },
        'evaluation_synthetic_test_set': results,
        'best_model': {
            'name': best_model_name,
            'synthetic_test_r2': results[best_model_name]['r2_score'],
            'synthetic_test_mae_kg_per_acre': results[best_model_name]['mae'],
            'synthetic_test_rmse_kg_per_acre': results[best_model_name]['rmse'],
        },
        'limitations': [
            'Experimental model trained on synthetic data. Not validated for real-world yield prediction.',
            'Data was programmatically generated using mathematical response curves, not raw ICAR field observations.',
            'Evaluation scores reflect fit on synthetic test data and do NOT represent real-world agronomic accuracy.',
            'Never use these predictions for real-world farm finance, seed purchase, or agronomic planning.',
        ],
    }
    
    report_file = os.path.join(ARTIFACTS_DIR, 'model_evaluation_report.json')
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"Saved evaluation report to: {report_file}")
    return report

if __name__ == '__main__':
    train_and_evaluate()
