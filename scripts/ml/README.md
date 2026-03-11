# CivicShakti — ML Training Pipeline

This directory contains the **local Python training script** for building a custom CivicShakti image classification model. For most users, we recommend the **browser-based trainer** at `/staff/train-ai` instead.

## Two Ways to Train

| Method | Best For | Requirements |
|--------|----------|--------------|
| **Browser Trainer** (`/staff/train-ai`) | Quick retraining, small datasets (10–100 images) | Just a browser |
| **Local Python Script** (this folder) | Large datasets (100+ images), offline training, GPU acceleration | Python 3.10+, pip |

---

## Local Python Setup (Windows)

### 1. Run the Setup Script

```cmd
cd scripts\ml
setup_windows.bat
```

This creates an isolated `ml_env` virtual environment and installs TensorFlow + TensorFlow.js converter.

### 2. Organize Your Dataset

```
scripts/ml/dataset/
  ├─ pothole/              ← pothole/damaged road photos
  ├─ pothole_normal/       ← CLEAN, smooth road photos
  ├─ garbage/              ← garbage/waste photos
  ├─ garbage_normal/       ← CLEAN area (no litter) photos
  ├─ water_logging/        ← waterlogging/drainage issue photos
  ├─ water_normal/         ← normal drainage/dry road photos
  ├─ power_issue/          ← electrical issue photos
  ├─ electricity_normal/   ← working street lights/poles photos
  ├─ pollution/            ← pollution photos
  ├─ pollution_normal/     ← clear sky/clean environment photos
  ├─ infrastructure/       ← damaged infrastructure photos
  ├─ infrastructure_normal/← well-maintained benches/fences photos
  └─ normal/               ← general clean areas (optional extra)
```

> **Tip:** Aim for at least 20–30 images per category. More images = better accuracy.

> **⚠️ Important:** The `_normal` folders are **critical** for accuracy! Without them, the model will classify every image as an issue. Each `_normal` folder should contain photos of the SAME type of scene but in GOOD condition (e.g., `pothole_normal` = smooth clean roads).

### 3. Train

```cmd
call ml_env\Scripts\activate.bat
python train_model.py
```

Training runs 10 epochs of MobileNetV2 transfer learning with data augmentation. Output:
- `tfjs_model/model.json` + weight shards
- `class_indices.json`

### 4. Deploy

Copy the output files into your Next.js project:

```
public/models/civicshakti/
  ├─ model.json
  ├─ group1-shard1of1.bin   (or similar weight files)
  └─ class_indices.json
```

The app automatically detects and loads the model on startup — no code changes needed.

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `train_model.py` | MobileNetV2 transfer learning script with data augmentation |
| `requirements.txt` | Pinned Python dependencies |
| `setup_windows.bat` | One-click Windows environment setup |
| `README.md` | This file |
