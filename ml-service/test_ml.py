"""
Unit and Integration Tests for SANJHA Crop Yield Machine Learning Module.
Run with:
ml-service/.venv/bin/python ml-service/test_ml.py
"""

import json
import os
import unittest
import numpy as np
import pandas as pd
from predict import predict, SUPPORTED_CROPS

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'artifacts')
MODEL_PATH = os.path.join(ARTIFACTS_DIR, 'crop_yield_pipeline.joblib')
REPORT_PATH = os.path.join(ARTIFACTS_DIR, 'model_evaluation_report.json')
DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'crop_yield_india.csv')

class TestCropYieldML(unittest.TestCase):

    def test_01_dataset_integrity(self):
        self.assertTrue(os.path.exists(DATASET_PATH), "Dataset CSV must exist")
        df = pd.read_csv(DATASET_PATH)
        self.assertGreaterEqual(len(df), 1000, "Dataset should have at least 1,000 rows")
        expected_cols = [
            'crop', 'season', 'soil_type', 'rainfall_mm', 'temperature_c',
            'nitrogen_n', 'phosphorus_p', 'potassium_k', 'yield_kg_per_acre'
        ]
        for col in expected_cols:
            self.assertIn(col, df.columns, f"Missing column: {col}")
        self.assertEqual(df.isnull().sum().sum(), 0, "No missing values allowed in dataset")

    def test_02_model_artifact_exists(self):
        self.assertTrue(os.path.exists(MODEL_PATH), "Model artifact .joblib must exist")
        self.assertTrue(os.path.exists(REPORT_PATH), "Model evaluation report .json must exist")

    def test_03_evaluation_metrics_quality(self):
        with open(REPORT_PATH) as f:
            report = json.load(f)

        # Verify honesty in dataset description
        self.assertEqual(report['dataset']['type'], 'synthetic')
        self.assertIn('Experimental model trained on synthetic data', report['dataset']['disclaimer'])

        best = report['best_model']
        self.assertIn('synthetic_test_r2', best)
        self.assertGreater(best['synthetic_test_r2'], 0.85, f"Model R² should exceed 0.85 (was {best['synthetic_test_r2']})")
        self.assertIn('synthetic_test_mae_kg_per_acre', best)
        self.assertLess(best['synthetic_test_mae_kg_per_acre'], 1000.0, "MAE should be reasonably bounded")

        # Verify baseline was compared on synthetic test set
        eval_dict = report['evaluation_synthetic_test_set']
        self.assertIn('Baseline (Mean Predictor)', eval_dict)
        self.assertIn('Random Forest Regressor', eval_dict)
        self.assertIn('Gradient Boosting Regressor', eval_dict)

    def test_04_valid_prediction(self):
        inp = {
            'crop': 'tomato',
            'season': 'kharif',
            'soil_type': 'loamy',
            'rainfall_mm': 650.0,
            'temperature_c': 24.0,
            'nitrogen': 120.0,
            'phosphorus': 60.0,
            'potassium': 100.0,
        }
        res = predict(inp)
        self.assertEqual(res['status'], 200)
        self.assertEqual(res['crop'], 'tomato')
        self.assertEqual(res['unit'], 'kg/acre')
        self.assertGreater(res['predicted_yield_kg_per_acre'], 1000.0)
        self.assertLess(res['predicted_yield_kg_per_acre'], 20000.0)
        self.assertIn('disclaimer', res)
        self.assertEqual(
            res['disclaimer'],
            'Experimental model trained on synthetic data. Not validated for real-world yield prediction.'
        )
        self.assertIn('model_type', res)
        self.assertEqual(res['dataset_type'], 'Synthetic Benchmark Data')

    def test_05_unsupported_crop_honesty(self):
        inp = {'crop': 'dragonfruit', 'rainfall_mm': 600, 'temperature_c': 25}
        res = predict(inp)
        self.assertEqual(res['status'], 422)
        self.assertIn('error', res)
        self.assertIn('Supported crops', res['error'])
        self.assertIn('supported_crops', res)

    def test_06_missing_crop_error(self):
        inp = {'rainfall_mm': 600}
        res = predict(inp)
        self.assertEqual(res['status'], 400)
        self.assertIn('error', res)

    def test_07_all_supported_crops_predictable(self):
        for crop in SUPPORTED_CROPS:
            res = predict({'crop': crop, 'rainfall_mm': 600, 'temperature_c': 25})
            self.assertEqual(res['status'], 200, f"Failed prediction for crop: {crop}")
            self.assertGreater(res['predicted_yield_kg_per_acre'], 0)

if __name__ == '__main__':
    unittest.main()
