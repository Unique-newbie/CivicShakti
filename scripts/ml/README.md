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
scripts/ml/
  └─ dataset/
      ├─ pothole/         ← put pothole photos here
      ├─ garbage/         ← put garbage photos here
      ├─ water_logging/   ← put water issue photos here
      ├─ power_issue/     ← put electrical issue photos here
      ├─ pollution/       ← put pollution photos here
      ├─ infrastructure/  ← put infrastructure damage photos here
      └─ normal/          ← put CLEAN road/park/area photos here
```

> **Tip:** Aim for at least 20–30 images per category. More images = better accuracy.

> **⚠️ Important:** The `normal` folder is **critical** for accuracy! Without it, the model will classify every image as an issue. Add 20-30 photos of clean roads, well-maintained parks, and normal public areas to teach the model the difference.

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
