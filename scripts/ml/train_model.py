import os
import sys
import json
import tensorflow as tf
import tensorflowjs as tfjs
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model

# Default CivicShakti categories (will dynamically map based on your folders)
DEFAULT_CLASSES = ['pothole', 'garbage', 'water_logging', 'power_issue', 'pollution', 'infrastructure']

def create_model(num_classes):
    print("Loading MobileNetV2 base model...")
    # Load MobileNetV2 without the top classification layer
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    
    # Freeze the base model layers so we don't overwrite pre-trained features
    base_model.trainable = False
    
    # Add custom layers for CivicShakti categories on top
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    
    return model

def main():
    print(f"TensorFlow Version: {tf.__version__}")
    
    # Force GPU usage — use dedicated NVIDIA GPU, not CPU
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            # Use only the first dedicated GPU
            tf.config.set_visible_devices(gpus[0], 'GPU')
            # Enable memory growth so TF doesn't grab all VRAM at once
            tf.config.experimental.set_memory_growth(gpus[0], True)
            print(f"\n✅ Using GPU: {gpus[0].name}")
            print(f"   Total GPUs available: {len(gpus)}")
        except RuntimeError as e:
            print(f"⚠️ GPU setup error: {e}")
    else:
        print("\n⚠️ WARNING: No GPU detected! Training will be SLOW on CPU.")
        print("   Make sure you have NVIDIA drivers + CUDA + cuDNN installed.")
        print("   Install GPU TensorFlow: pip install tensorflow[and-cuda]")
    
    # 1. Check for dataset
    base_dir = os.path.join('dataset', 'garbage_classification')
    
    if not os.path.exists(base_dir):
        print(f"ERROR: Dataset directory '{base_dir}' not found!")
        print(f"Please create a '{base_dir}' folder with category subfolders inside it.")
        print(f"Example: dataset/garbage_classification/battery/, dataset/garbage_classification/biological/, etc.")
        sys.exit(1)
        
    print("Preparing data generators...")
    # Add data augmentation so the model learns better from small datasets
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input,
        validation_split=0.2, # 20% validation split
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )
    
    train_generator = datagen.flow_from_directory(
        base_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )
    
    validation_generator = datagen.flow_from_directory(
        base_dir,
        target_size=(224, 224),
        batch_size=32,
        class_mode='categorical',
        subset='validation'
    )
    
    if train_generator.samples == 0:
        print("ERROR: No images found! Make sure you put images INSIDE category folders inside 'dataset/'")
        sys.exit(1)
    
    # Save class indices so the Next.js app knows the mapping (0 -> pothole, 1 -> garbage, etc.)
    class_indices = train_generator.class_indices
    index_to_class = {v: k for k, v in class_indices.items()}
    with open('class_indices.json', 'w') as f:
        json.dump(index_to_class, f)
    print("Saved class_indices.json mapping")

    # 2. Build and Train
    model = create_model(num_classes=len(class_indices))
    
    print("\nStarting training (doing 10 epochs)...")
    history = model.fit(
        train_generator,
        epochs=10,
        validation_data=validation_generator
    )
    
    # 3. Save Model & Convert to TFJS
    keras_model_path = 'model.keras'
    print(f"\nTraining complete. Saving local model to {keras_model_path}...")
    model.save(keras_model_path)
    
    tfjs_target_dir = 'tfjs_model'
    print(f"Converting model to TensorFlow.js format in '{tfjs_target_dir}'...")
    # Use tensorflowjs library to convert the keras model to browser-compatible format
    tfjs.converters.save_keras_model(model, tfjs_target_dir)
    
    print("\n====== SUCCESS ======")
    print(f"1. Open the '{tfjs_target_dir}/' folder.")
    print(f"2. Grab 'model.json' and all 'group1-shard*' files.")
    print(f"3. Grab 'class_indices.json' from your current folder.")
    print(f"4. Place ALL of them inside your Next.js project at: public/models/civicshakti/")

if __name__ == '__main__':
    main()
