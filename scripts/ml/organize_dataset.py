"""
Organize the garbage dataset:
1. Move classification images (battery_*, biological_*, cardboard_*, clothes_*) 
   from dataset/garbage/ into dataset/garbage_classification/<category>/
2. Leave YOLO detection data (train/, test/, valid/) in dataset/garbage/ as-is.
"""
import os
import shutil
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GARBAGE_DIR = os.path.join(SCRIPT_DIR, "dataset", "garbage")
CLASSIFICATION_DIR = os.path.join(SCRIPT_DIR, "dataset", "garbage_classification")

# Categories based on filename prefixes
CATEGORIES = ["battery", "biological", "cardboard", "clothes"]

def organize():
    # Create classification subdirectories
    for cat in CATEGORIES:
        cat_dir = os.path.join(CLASSIFICATION_DIR, cat)
        os.makedirs(cat_dir, exist_ok=True)
        print(f"Created: {cat_dir}")

    # Scan garbage/ for classification images (only top-level files)
    moved = {cat: 0 for cat in CATEGORIES}
    skipped = 0

    for filename in os.listdir(GARBAGE_DIR):
        filepath = os.path.join(GARBAGE_DIR, filename)
        
        # Skip directories (train/, test/, valid/) and non-image files
        if os.path.isdir(filepath):
            continue
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue

        # Check if filename starts with a known category prefix
        matched = False
        for cat in CATEGORIES:
            if filename.lower().startswith(cat + "_"):
                dest = os.path.join(CLASSIFICATION_DIR, cat, filename)
                shutil.move(filepath, dest)
                moved[cat] += 1
                matched = True
                break
        
        if not matched:
            skipped += 1

    print("\n=== Organization Complete ===")
    print(f"\nMoved to {CLASSIFICATION_DIR}:")
    for cat in CATEGORIES:
        print(f"  {cat}/: {moved[cat]} images")
    print(f"\nSkipped (not matching any category): {skipped} files")
    print(f"\nYOLO data remains in: {GARBAGE_DIR}")

if __name__ == "__main__":
    organize()
