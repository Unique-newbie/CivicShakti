from ultralytics import YOLO

model = YOLO('C:/Users/vishu/Downloads/Projects/civic-shakti-master-main/runs/detect/civic_ai_models/pothole_detection/weights/best.pt')
print("Exporting model to tfjs format...")
export_path = model.export(format='tfjs')
print(f"Exported to {export_path}")
