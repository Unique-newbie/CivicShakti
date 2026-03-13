import os
import pandas as pd
import shutil

# YOLO needs:
# class_id x_center y_center bbox_width bbox_height
# (All normalized 0.0 to 1.0)

def discover_datasets(base_dir='dataset'):
    """Auto-discover all dataset folders that have train/valid/test splits with _annotations.csv"""
    datasets = {}
    for folder in sorted(os.listdir(base_dir)):
        folder_path = os.path.join(base_dir, folder)
        if not os.path.isdir(folder_path):
            continue
        # Check if this folder has annotated splits (train/valid/test with _annotations.csv)
        has_annotations = False
        for split in ['train', 'valid', 'test']:
            csv_path = os.path.join(folder_path, split, '_annotations.csv')
            if os.path.exists(csv_path):
                has_annotations = True
                break
        if has_annotations:
            datasets[folder] = folder_path
    return datasets

def convert_to_yolo():
    datasets = discover_datasets()
    
    if not datasets:
        print("ERROR: No annotated datasets found!")
        print("Expected: dataset/<name>/train/_annotations.csv")
        return
    
    print(f"Found {len(datasets)} annotated dataset(s): {', '.join(datasets.keys())}")
    
    # Build a unified class map from ALL datasets
    all_classes = set()
    for name, path in datasets.items():
        for split in ['train', 'valid', 'test']:
            csv_path = os.path.join(path, split, '_annotations.csv')
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                all_classes.update(df['class'].unique())
    
    class_map = {cls: idx for idx, cls in enumerate(sorted(all_classes))}
    print(f"Classes found: {class_map}")
    
    # Output directory for unified YOLO dataset
    yolo_dir = 'dataset/yolo_combined'
    
    # Create YOLO directory structure
    for split in ['train', 'valid', 'test']:
        os.makedirs(f"{yolo_dir}/images/{split}", exist_ok=True)
        os.makedirs(f"{yolo_dir}/labels/{split}", exist_ok=True)
    
    # Process each dataset
    total_images = 0
    for dataset_name, dataset_path in datasets.items():
        print(f"\n--- Processing '{dataset_name}' ---")
        
        for split in ['train', 'valid', 'test']:
            csv_path = os.path.join(dataset_path, split, '_annotations.csv')
            if not os.path.exists(csv_path):
                print(f"  Skipping {split}, CSV not found.")
                continue
            
            print(f"  Converting {split} set...")
            df = pd.read_csv(csv_path)
            
            for filename, group in df.groupby('filename'):
                # Prefix filename with dataset name to avoid collisions
                prefixed_name = f"{dataset_name}_{filename}"
                
                # Copy image
                src_img = os.path.join(dataset_path, split, filename)
                dst_img = f"{yolo_dir}/images/{split}/{prefixed_name}"
                if os.path.exists(src_img):
                    shutil.copy(src_img, dst_img)
                else:
                    print(f"  Warning: Image {filename} not found.")
                    continue
                
                # Create label file
                txt_filename = os.path.splitext(prefixed_name)[0] + '.txt'
                dst_txt = f"{yolo_dir}/labels/{split}/{txt_filename}"
                
                with open(dst_txt, 'w') as f:
                    for _, row in group.iterrows():
                        class_name = row['class']
                        if class_name not in class_map:
                            continue
                        
                        class_id = class_map[class_name]
                        img_w = float(row['width'])
                        img_h = float(row['height'])
                        
                        x_min = float(row['xmin'])
                        y_min = float(row['ymin'])
                        x_max = float(row['xmax'])
                        y_max = float(row['ymax'])
                        
                        box_w = x_max - x_min
                        box_h = y_max - y_min
                        x_center = x_min + (box_w / 2.0)
                        y_center = y_min + (box_h / 2.0)
                        
                        # Normalize to 0.0 - 1.0
                        n_x_center = x_center / img_w
                        n_y_center = y_center / img_h
                        n_box_w = box_w / img_w
                        n_box_h = box_h / img_h
                        
                        f.write(f"{class_id} {n_x_center:.6f} {n_y_center:.6f} {n_box_w:.6f} {n_box_h:.6f}\n")
                
                total_images += 1

    # Create dataset.yaml for Ultralytics YOLO
    abs_path = os.path.abspath(yolo_dir).replace('\\', '/')
    names_section = "\n".join(f"  {idx}: {cls}" for cls, idx in sorted(class_map.items(), key=lambda x: x[1]))
    yaml_content = f"""path: {abs_path}
train: images/train
val: images/valid
test: images/test

names:
{names_section}
"""
    with open(f"{yolo_dir}/dataset.yaml", 'w') as f:
        f.write(yaml_content)
    
    print(f"\n{'='*50}")
    print(f"Conversion complete!")
    print(f"Total images processed: {total_images}")
    print(f"Classes: {class_map}")
    print(f"YOLO dataset ready at: '{yolo_dir}'")
    print(f"Dataset config: '{yolo_dir}/dataset.yaml'")

if __name__ == "__main__":
    convert_to_yolo()
