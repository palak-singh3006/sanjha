# Synthetic Agricultural Crop Yield Benchmark Dataset

> [!WARNING]
> **DISCLAIMER:** Experimental model trained on synthetic data. Not validated for real-world yield prediction.
> Neither ICAR nor the Government of India supplied raw observational rows for this dataset. This data was generated programmatically for machine learning pipeline demonstration and hackathon prototype mechanics.

## Provenance & Nature of Data
- **Dataset Classification:** **100% Synthetic Data**
- **Generator Script:** `ml-service/dataset/generate_dataset.py`
- **Purpose:** Hackathon prototype development, pipeline integration testing, and machine learning architecture demonstration.
- **Parametric Basis:** The generator uses mathematical response functions (quadratic penalty and Gaussian noise) loosely inspired by published agronomic ranges for semi-arid tropics.
- **Real-World Validity:** **NONE.** These numbers must NEVER be used for real-world agronomic advice, seed investment, financial planning, or farm credit decisions.
- **Target Variable:** `yield_kg_per_acre` (Synthetic target in kg/acre).

## Schema & Feature Dictionary
| Column Name | Type | Unit / Categories | Description |
|---|---|---|---|
| `crop` | Categorical | tomato, onion, chilli, rice, wheat, maize, pulses, cotton, potato, sugarcane | Synthetic crop category |
| `season` | Categorical | kharif, rabi, zaid, annual | Simulated seasonal cycle |
| `soil_type` | Categorical | black, clay, loamy, red, sandy | Simulated soil category |
| `rainfall_mm` | Numeric (float) | Millimetres (mm) | Simulated precipitation |
| `temperature_c` | Numeric (float) | Celsius (°C) | Simulated mean temperature |
| `nitrogen_n` | Numeric (float) | kg/ha | Simulated Nitrogen index |
| `phosphorus_p` | Numeric (float) | kg/ha | Simulated Phosphorus index |
| `potassium_k` | Numeric (float) | kg/ha | Simulated Potassium index |
| `yield_kg_per_acre` | Numeric (float) | kg/acre (SYNTHETIC TARGET) | Programmatically generated yield output |
