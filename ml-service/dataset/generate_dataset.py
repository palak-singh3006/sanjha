"""
Generates the India Agro-Climatic Crop Yield & Soil Benchmark Dataset.
Deterministic random seed for complete reproducibility.
"""
import numpy as np
import pandas as pd

np.random.seed(42)

CROPS_CONFIG = {
    'tomato': {
        'base_yield': 9500, 'yield_std': 1800, 'min_yield': 3500, 'max_yield': 16000,
        'opt_rain': 650, 'rain_sens': 4.5,
        'opt_temp': 24, 'temp_sens': 180,
        'opt_n': 120, 'opt_p': 60, 'opt_k': 100,
        'seasons': ['kharif', 'rabi'],
        'soils': ['loamy', 'black', 'red'],
    },
    'onion': {
        'base_yield': 7800, 'yield_std': 1400, 'min_yield': 3000, 'max_yield': 12500,
        'opt_rain': 550, 'rain_sens': 3.8,
        'opt_temp': 22, 'temp_sens': 160,
        'opt_n': 90, 'opt_p': 50, 'opt_k': 80,
        'seasons': ['kharif', 'rabi', 'zaid'],
        'soils': ['black', 'loamy', 'clay'],
    },
    'chilli': {
        'base_yield': 2200, 'yield_std': 450, 'min_yield': 800, 'max_yield': 3800,
        'opt_rain': 600, 'rain_sens': 1.6,
        'opt_temp': 26, 'temp_sens': 55,
        'opt_n': 100, 'opt_p': 55, 'opt_k': 70,
        'seasons': ['kharif', 'rabi'],
        'soils': ['black', 'red', 'loamy'],
    },
    'rice': {
        'base_yield': 2400, 'yield_std': 380, 'min_yield': 1100, 'max_yield': 3600,
        'opt_rain': 1100, 'rain_sens': 1.8,
        'opt_temp': 28, 'temp_sens': 60,
        'opt_n': 110, 'opt_p': 45, 'opt_k': 50,
        'seasons': ['kharif', 'rabi'],
        'soils': ['clay', 'loamy', 'black'],
    },
    'wheat': {
        'base_yield': 2100, 'yield_std': 340, 'min_yield': 900, 'max_yield': 3200,
        'opt_rain': 450, 'rain_sens': 1.5,
        'opt_temp': 19, 'temp_sens': 90,
        'opt_n': 100, 'opt_p': 50, 'opt_k': 45,
        'seasons': ['rabi'],
        'soils': ['loamy', 'clay', 'black'],
    },
    'maize': {
        'base_yield': 2600, 'yield_std': 420, 'min_yield': 1200, 'max_yield': 4100,
        'opt_rain': 700, 'rain_sens': 2.0,
        'opt_temp': 25, 'temp_sens': 50,
        'opt_n': 110, 'opt_p': 55, 'opt_k': 60,
        'seasons': ['kharif', 'rabi'],
        'soils': ['loamy', 'red', 'black'],
    },
    'pulses': {
        'base_yield': 680, 'yield_std': 120, 'min_yield': 320, 'max_yield': 1150,
        'opt_rain': 480, 'rain_sens': 0.6,
        'opt_temp': 25, 'temp_sens': 20,
        'opt_n': 25, 'opt_p': 40, 'opt_k': 30,
        'seasons': ['kharif', 'rabi', 'zaid'],
        'soils': ['black', 'red', 'loamy', 'sandy'],
    },
    'cotton': {
        'base_yield': 920, 'yield_std': 180, 'min_yield': 400, 'max_yield': 1650,
        'opt_rain': 750, 'rain_sens': 0.8,
        'opt_temp': 29, 'temp_sens': 30,
        'opt_n': 90, 'opt_p': 45, 'opt_k': 60,
        'seasons': ['kharif'],
        'soils': ['black', 'clay'],
    },
    'potato': {
        'base_yield': 10500, 'yield_std': 1900, 'min_yield': 4200, 'max_yield': 16500,
        'opt_rain': 500, 'rain_sens': 5.0,
        'opt_temp': 18, 'temp_sens': 220,
        'opt_n': 130, 'opt_p': 70, 'opt_k': 120,
        'seasons': ['rabi'],
        'soils': ['loamy', 'sandy'],
    },
    'sugarcane': {
        'base_yield': 34000, 'yield_std': 4800, 'min_yield': 18000, 'max_yield': 48000,
        'opt_rain': 1400, 'rain_sens': 12.0,
        'opt_temp': 30, 'temp_sens': 400,
        'opt_n': 160, 'opt_p': 65, 'opt_k': 140,
        'seasons': ['annual'],
        'soils': ['black', 'loamy', 'clay'],
    },
}

rows = []
TOTAL_SAMPLES = 1500

crops = list(CROPS_CONFIG.keys())
samples_per_crop = TOTAL_SAMPLES // len(crops)

for crop in crops:
    cfg = CROPS_CONFIG[crop]
    for _ in range(samples_per_crop):
        season = np.random.choice(cfg['seasons'])
        soil = np.random.choice(cfg['soils'])
        
        # Environmental variations with realistic noise
        rainfall = float(np.clip(np.random.normal(cfg['opt_rain'], cfg['opt_rain'] * 0.28), 150, 2400))
        temperature = float(np.clip(np.random.normal(cfg['opt_temp'], 3.8), 10, 42))
        
        # Soil nutrients (kg/ha)
        n = float(np.clip(np.random.normal(cfg['opt_n'], 25), 10, 250))
        p = float(np.clip(np.random.normal(cfg['opt_p'], 15), 5, 120))
        k = float(np.clip(np.random.normal(cfg['opt_k'], 20), 10, 220))
        
        # Agronomic response function
        rain_diff = abs(rainfall - cfg['opt_rain'])
        temp_diff = abs(temperature - cfg['opt_temp'])
        
        n_ratio = min(n / cfg['opt_n'], 1.3)
        p_ratio = min(p / cfg['opt_p'], 1.25)
        k_ratio = min(k / cfg['opt_k'], 1.25)
        nutrient_factor = (n_ratio * 0.45 + p_ratio * 0.25 + k_ratio * 0.30)
        
        penalty = (rain_diff * cfg['rain_sens'] * 0.4) + (temp_diff * cfg['temp_sens'] * 0.5)
        base = cfg['base_yield'] * nutrient_factor - penalty
        noise = np.random.normal(0, cfg['yield_std'] * 0.4)
        
        yield_val = float(np.clip(base + noise, cfg['min_yield'], cfg['max_yield']))
        
        rows.append({
            'crop': crop,
            'season': season,
            'soil_type': soil,
            'rainfall_mm': round(rainfall, 1),
            'temperature_c': round(temperature, 1),
            'nitrogen_n': round(n, 1),
            'phosphorus_p': round(p, 1),
            'potassium_k': round(k, 1),
            'yield_kg_per_acre': round(yield_val, 1)
        })

df = pd.DataFrame(rows)
df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
csv_path = 'ml-service/dataset/crop_yield_india.csv'
df.to_csv(csv_path, index=False)
print(f"Generated {len(df)} rows across {len(crops)} crops saved to {csv_path}")
print(df.head(5))
