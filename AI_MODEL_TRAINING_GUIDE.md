# CivicShakti — AI Model Training Guide

Currently, CivicShakti uses pre-trained general models (COCO-SSD and MobileNet V2) combined with color and texture analysis to guess the civic issue. While this works as a baseline, **to make a truly original and highly accurate "Smart Model," you need to train a custom model on specific civic data.**

This guide explains how to collect data, train a custom image classification model using Transfer Learning, convert it for the web, and integrate it into CivicShakti.

---

## Phase 1: Data Collection & Preparation

To train an AI model, you need a dataset consisting of images of various civic issues categorized correctly. 

### 1. Collect Initial Data (Public Datasets)
Before you have real user data, you can jumpstart your model using open-source datasets (like from Kaggle):
- **Garbage/Litter:** "TACO (Trash Annotations in Context)" or "Garbage Classification Dataset".
- **Potholes/Roads:** "Pothole Image Dataset" or "Global Road Damage Detection".
- **Water Leaks/Floods:** "Water Leakage Dataset".
- **Category Structure:** Organize your downloaded images into folders corresponding to your system's categories:
  ```text
  dataset/
  ├── pothole/
  ├── garbage/
  ├── water/
  ├── electricity/
  ├── pollution/
  └── infrastructure/
  ```

### 2. Collect Real-World Data (The Feedback Loop)
CivicShakti already has a built-in mechanism to get smarter! When staff members correct an AI prediction, it gets saved to the `ai_feedback` collection in Appwrite.
- **Action:** Every month, export the images and the corrected staff labels from Appwrite to add to your training dataset. This ensures the model learns what real complaints in your specific city look like.

---

## Phase 2: Training the Model (Transfer Learning)

Instead of training a neural network from scratch (which takes weeks and massive computing power), we will use **Transfer Learning**. We take a model that already knows how to process images (MobileNet V2) and retrain its "brain" to recognize our 6 civic categories.

The easiest way to do this for free is using **Google Colab**.

### Code to run in a Google Colab Notebook (Python):

```python
import tensorflow as tf
from tensorflow.keras.preprocessing import image_dataset_from_directory

# 1. Load Data
train_dataset = image_dataset_from_directory(
    'dataset/',
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=(224, 224),
    batch_size=32
)
validation_dataset = image_dataset_from_directory(
    'dataset/',
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=(224, 224),
    batch_size=32
)

# 2. Add Data Augmentation to prevent overfitting
data_augmentation = tf.keras.Sequential([
  tf.keras.layers.RandomFlip('horizontal'),
  tf.keras.layers.RandomRotation(0.2),
])

# 3. Load Base Model (MobileNetV2) without the top classification layer
base_model = tf.keras.applications.MobileNetV2(input_shape=(224, 224, 3),
                                               include_top=False,
                                               weights='imagenet')

# Freeze the base model so we don't destroy its pre-trained weights yet
base_model.trainable = False

# 4. Build the custom Civic Model
inputs = tf.keras.Input(shape=(224, 224, 3))
x = data_augmentation(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dropout(0.2)(x)
# Add our 6 categories output layer
outputs = tf.keras.layers.Dense(6, activation='softmax')(x) 

model = tf.keras.Model(inputs, outputs)

# 5. Compile and Train
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

print("Training Initial Layers...")
history = model.fit(train_dataset, epochs=10, validation_data=validation_dataset)

# 6. Save the model in Keras format
model.save("civicshakti_custom_model.keras")
print("Model Saved!")
```

---

## Phase 3: Converting for the Web (TensorFlow.js)

Your Next.js web app runs JavaScript in the browser. It cannot read a Python model directly. You must convert it into a `model.json` format for TensorFlow.js.

1. **Install the converter in your terminal (or Colab):**
   ```bash
   pip install tensorflowjs
   ```

2. **Run the conversion tool:**
   ```bash
   tensorflowjs_converter --input_format=keras civicshakti_custom_model.keras ./tfjs_civic_model
   ```

3. **Check Output:** 
   This will generate a folder named `tfjs_civic_model` containing a `model.json` file and several `groupX-shardYofZ.bin` weight files.

---

## Phase 4: Integrating the Custom Model into CivicShakti

Now that you have your own `model.json`, here is how you replace the generic pipeline in your app with your custom brain.

1. **Move files:** Place the `tfjs_civic_model` folder inside the `public/models/` directory of your Next.js app. So the path is `public/models/tfjs_civic_model/model.json`.

2. **Update your code:** Open `src/lib/civic-ai-model.ts` and modify it to load your custom model instead of the default ImageNet one:

```typescript
import * as tf from '@tensorflow/tfjs';

let customCivicModel: tf.LayersModel | null = null;
const CATEGORY_MAP = ['electricity', 'garbage', 'infrastructure', 'pollution', 'pothole', 'water']; // Make sure this alphabetical order matches training data

export async function loadModels() {
    if (!customCivicModel) {
        // Load YOUR custom trained model from the public folder
        customCivicModel = await tf.loadLayersModel('/models/tfjs_civic_model/model.json');
    }
}

export async function analyzeImage(imageElement: HTMLImageElement | HTMLCanvasElement) {
    if (!customCivicModel) throw new Error("Model not loaded");

    // Convert image to tensor and preprocess
    const tensor = tf.browser.fromPixels(imageElement)
        .resizeBilinear([224, 224])
        .expandDims(0)
        .toFloat();
    
    // Normalize pixel values to [-1, 1] as expected by MobileNetV2 preprocessing
    const preprocessed = tensor.div(127.5).sub(1);

    // Run prediction using your custom brain
    const prediction = customCivicModel.predict(preprocessed) as tf.Tensor;
    const scores = await prediction.data();
    
    // Clean up memory
    tensor.dispose();
    preprocessed.dispose();
    prediction.dispose();

    // Find highest score
    let highestIndex = 0;
    let highestScore = 0;
    
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] > highestScore) {
            highestScore = scores[i];
            highestIndex = i;
        }
    }

    const predictedCategory = CATEGORY_MAP[highestIndex];
    
    return {
        category: predictedCategory,
        confidence: Math.round(highestScore * 100),
        source: 'CivicShakti Custom AI'
    };
}
```

---

## Phase 5: Continuous Improvement (MLOps)

An AI is never truly "finished." To make it world-class:
1. Citizen submits a complaint (e.g., a blurry picture of a pothole).
2. AI wrongly predicts "Garbage".
3. Staff member reviews it on the dashboard, changes department to "Roads", and updates category to "Pothole".
4. The `ai_feedback` API logs this correction to Appwrite.
5. Every month, you extract these corrected images, add them to your dataset folder, and re-run Phase 2 (the Colab notebook). 
6. Replace the old `model.json` in your `/public/models` folder with the newly trained one.

By doing this, your CivicShakti model will continually learn the specific visual characteristics of your own city's infrastructure issues!
