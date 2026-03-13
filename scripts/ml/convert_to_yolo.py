import os
import pandas as pd
import shutil

# YOLO needs:
# class_id x_center y_center bbox_width bbox_height
# (All normalized 0.0 to 1.0)

CLASS_MAP = {
    'pothole': 0
}

def convert_to_yolo():
    base_dir = 'dataset/pothole'
    yolo_dir = 'dataset/yolo_potholes'
    
    # Create YOLO directory structure
    for split in ['train', 'valid', 'test']:
        os.makedirs(f"{yolo_dir}/images/{split}", exist_ok=True)
        os.makedirs(f"{yolo_dir}/labels/{split}", exist_ok=True)
        
        csv_path = f"{base_dir}/{split}/_annotations.csv"
        if not os.path.exists(csv_path):
            print(f"Skipping {split}, CSV not found.")
            continue
            
        print(f"Converting {split} set...")
        df = pd.read_csv(csv_path)
        
        # Group by image filename since one image can have multiple annotations
        for filename, group in df.groupby('filename'):
            # Copy image
            src_img = f"{base_dir}/{split}/{filename}"
            dst_img = f"{yolo_dir}/images/{split}/{filename}"
            if os.path.exists(src_img):
                shutil.copy(src_img, dst_img)
            else:
                print(f"Warning: Image {filename} not found.")
                continue
            
            # Create label file
            txt_filename = os.path.splitext(filename)[0] + '.txt'
            dst_txt = f"{yolo_dir}/labels/{split}/{txt_filename}"
            
            with open(dst_txt, 'w') as f:
                for _, row in group.iterrows():
                    class_name = row['class']
                    if class_name not in CLASS_MAP:
                        continue
                        
                    class_id = CLASS_MAP[class_name]
                    img_w = float(row['width'])
                    img_h = float(row['height'])
                    
                    # Calculate center x, center y, width, height
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

    # Create dataset.yaml for Ultralytics YOLO
    abs_path = os.path.abspath(yolo_dir).replace('\\', '/')
    yaml_content = f"""path: {abs_path}
train: images/train
val: images/valid
test: images/test

names:
  0: pothole
"""
    with open(f"{yolo_dir}/dataset.yaml", 'w') as f:
        f.write(yaml_content)
        
    print(f"\nConversion complete. YOLO dataset is ready at '{yolo_dir}'.")
    print(f"Dataset config written to '{yolo_dir}/dataset.yaml'.")

if __name__ == "__main__":
    convert_to_yolo()
