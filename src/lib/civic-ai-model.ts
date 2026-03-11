/**
 * CivicShakti AI Model — Primary Image Analysis Engine
 * 
 * Multi-signal analysis using TensorFlow.js:
 * 1. MobileNet deep feature extraction + classification
 * 2. COCO-SSD real-time object detection
 * 3. Canvas-based color distribution analysis
 * 4. Canvas-based edge density / texture analysis
 * 5. Weighted fusion classifier
 * 
 * Gemini Vision API is FALLBACK ONLY — this model is the primary.
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// =====================================================
// TYPES
// =====================================================

export interface DetectedObject {
    class: string;
    score: number;
    bbox: [number, number, number, number];
}

export interface ColorProfile {
    dominant_colors: { name: string; percentage: number }[];
    brightness: number; // 0-255
    saturation: number; // 0-1
    has_water_blue: boolean;
    has_road_gray: boolean;
    has_vegetation_green: boolean;
    has_dirt_brown: boolean;
    has_night_dark: boolean;
}

export interface TextureProfile {
    edge_density: number; // 0-1, higher = more edges/damage
    roughness: number; // 0-1, higher = more rough/damaged
    uniformity: number; // 0-1, higher = more uniform/clean
}

export interface CivicAnalysis {
    detected_issue: {
        category: string;
        sub_type: string;
        description: string;
        objects_detected: string[];
    };
    severity: {
        score: number;
        level: string;
        reasoning: string;
        safety_hazard: boolean;
        estimated_affected: string;
    };
    department: {
        primary: string;
        secondary: string;
        escalation: string;
    };
    quality: {
        confidence: number;
        image_relevant: boolean;
        is_duplicate_risk: boolean;
        suggestions: string;
    };
    model_source: 'civicshakti-ai';
    analysis_details: {
        objects: DetectedObject[];
        color_profile: ColorProfile;
        texture_profile: TextureProfile;
        mobilenet_classes: { className: string; probability: number }[];
        signal_scores: Record<string, number>;
    };
}

// =====================================================
// CATEGORY KNOWLEDGE BASE — Our model's "training"
// =====================================================

interface CategoryProfile {
    id: string;
    label: string;
    // Object signals: COCO-SSD objects that indicate this category
    object_signals: Record<string, number>;
    // MobileNet class signals: ImageNet classes that correlate
    mobilenet_signals: Record<string, number>;
    // Color signals: what colors indicate this issue
    color_signals: {
        road_gray?: number;
        water_blue?: number;
        vegetation_green?: number;
        dirt_brown?: number;
        dark?: number;
    };
    // Texture signals: edge/roughness patterns
    texture_signals: {
        high_edge_density?: number;   // damaged surfaces
        low_uniformity?: number;      // broken/uneven
        high_roughness?: number;      // rough texture
    };
    // Sub-type determination rules
    sub_types: { condition: string; label: string; severity_boost: number }[];
    // Department routing
    department: { primary: string; secondary: string };
    // Base severity range
    base_severity: [number, number];
    // Description template
    description_template: string;
}

const CATEGORY_PROFILES: CategoryProfile[] = [
    {
        id: 'pothole',
        label: 'Pothole / Road Damage',
        object_signals: {
            'car': 0.3, 'truck': 0.35, 'bus': 0.3, 'motorcycle': 0.25, 'bicycle': 0.2,
            'person': 0.1, 'traffic light': 0.15, 'stop sign': 0.15,
        },
        mobilenet_signals: {
            'manhole cover': 0.8, 'street sign': 0.4, 'cab': 0.3, 'minivan': 0.3,
            'moving van': 0.3, 'trailer truck': 0.35, 'garbage truck': 0.25,
            'road': 0.5, 'pavement': 0.5, 'sidewalk': 0.4, 'gravel': 0.6,
            'stone wall': 0.3, 'concrete': 0.4, 'asphalt': 0.6,
        },
        color_signals: { road_gray: 0.7, dirt_brown: 0.4, water_blue: 0.2 },
        texture_signals: { high_edge_density: 0.6, low_uniformity: 0.5, high_roughness: 0.6 },
        sub_types: [
            { condition: 'water_blue', label: 'pothole with water accumulation', severity_boost: 10 },
            { condition: 'high_edge_density', label: 'large road crater', severity_boost: 15 },
            { condition: 'vehicle_nearby', label: 'pothole on active road', severity_boost: 10 },
            { condition: 'default', label: 'road surface damage', severity_boost: 0 },
        ],
        department: { primary: 'Public Works Department', secondary: 'Road Maintenance Division' },
        base_severity: [40, 70],
        description_template: 'Road surface damage detected requiring immediate attention from the road maintenance department. The affected area poses risk to commuters and vehicles.',
    },
    {
        id: 'garbage',
        label: 'Garbage / Waste',
        object_signals: {
            'bottle': 0.7, 'cup': 0.6, 'backpack': 0.3, 'handbag': 0.3,
            'suitcase': 0.35, 'dog': 0.3, 'cat': 0.2, 'bird': 0.2, 'cow': 0.4,
            'person': 0.05, 'bench': 0.15, 'potted plant': 0.1,
        },
        mobilenet_signals: {
            'garbage': 0.9, 'trash': 0.9, 'plastic bag': 0.8, 'paper towel': 0.6,
            'water bottle': 0.7, 'pop bottle': 0.7, 'beer bottle': 0.7,
            'wine bottle': 0.6, 'shopping cart': 0.4, 'barrel': 0.3,
            'bucket': 0.4, 'cardboard': 0.5, 'diaper': 0.7, 'carton': 0.5,
            'dumpster': 0.8, 'dustbin': 0.8, 'wheelie bin': 0.6,
        },
        color_signals: { dirt_brown: 0.5, vegetation_green: 0.2 },
        texture_signals: { low_uniformity: 0.4, high_roughness: 0.3 },
        sub_types: [
            { condition: 'animal_nearby', label: 'waste dump attracting stray animals', severity_boost: 15 },
            { condition: 'bottles_detected', label: 'littered area with discarded containers', severity_boost: 5 },
            { condition: 'high_roughness', label: 'large illegal dumping site', severity_boost: 20 },
            { condition: 'default', label: 'garbage accumulation requiring cleanup', severity_boost: 0 },
        ],
        department: { primary: 'Sanitation Department', secondary: 'Solid Waste Management' },
        base_severity: [25, 55],
        description_template: 'Garbage accumulation detected in a public area. The waste requires cleanup by the sanitation department to prevent health hazards and environmental contamination.',
    },
    {
        id: 'water',
        label: 'Water / Drainage Issue',
        object_signals: {
            'boat': 0.7, 'fire hydrant': 0.6, 'umbrella': 0.3,
            'person': 0.05, 'car': 0.1,
        },
        mobilenet_signals: {
            'dam': 0.6, 'lakeside': 0.5, 'fountain': 0.5, 'geyser': 0.5,
            'manhole cover': 0.5, 'drain': 0.7, 'sewer': 0.7, 'pipeline': 0.6,
            'water': 0.7, 'puddle': 0.8, 'flood': 0.9, 'rain': 0.3,
        },
        color_signals: { water_blue: 0.8, road_gray: 0.2, dirt_brown: 0.3 },
        texture_signals: { low_uniformity: 0.3 },
        sub_types: [
            { condition: 'water_blue', label: 'water logging or pipe leakage', severity_boost: 15 },
            { condition: 'vehicle_nearby', label: 'waterlogged road causing traffic disruption', severity_boost: 20 },
            { condition: 'high_edge_density', label: 'open manhole or drainage damage', severity_boost: 25 },
            { condition: 'default', label: 'water supply or drainage issue', severity_boost: 0 },
        ],
        department: { primary: 'Water Supply & Sewerage Board', secondary: 'Pipeline Maintenance' },
        base_severity: [35, 65],
        description_template: 'Water-related issue detected, possibly involving pipe leakage, waterlogging, or drainage malfunction. Requires attention from the water supply department.',
    },
    {
        id: 'electricity',
        label: 'Electrical Issue',
        object_signals: {
            'traffic light': 0.7, 'stop sign': 0.3,
            'car': 0.1, 'person': 0.05,
        },
        mobilenet_signals: {
            'traffic light': 0.8, 'street sign': 0.4, 'pole': 0.6,
            'electric fan': 0.3, 'switch': 0.4, 'power line': 0.9,
            'wire': 0.7, 'cable': 0.6, 'transformer': 0.8,
            'streetlight': 0.9, 'lamp': 0.5, 'lantern': 0.4,
        },
        color_signals: { dark: 0.4, road_gray: 0.3 },
        texture_signals: { high_edge_density: 0.3 },
        sub_types: [
            { condition: 'dark', label: 'non-functional street light in dark area', severity_boost: 20 },
            { condition: 'high_edge_density', label: 'broken electrical pole or exposed wiring', severity_boost: 30 },
            { condition: 'traffic_light', label: 'malfunctioning traffic signal', severity_boost: 25 },
            { condition: 'default', label: 'electrical infrastructure damage', severity_boost: 0 },
        ],
        department: { primary: 'State Electricity Board', secondary: 'Street Lighting Division' },
        base_severity: [50, 85],
        description_template: 'Electrical infrastructure issue detected. This may involve broken street lights, exposed wiring, or malfunctioning signals, posing safety risks to the public.',
    },
    {
        id: 'pollution',
        label: 'Pollution',
        object_signals: {
            'person': 0.1, 'car': 0.15, 'truck': 0.2, 'bus': 0.2,
        },
        mobilenet_signals: {
            'smoke': 0.8, 'smokestack': 0.8, 'volcano': 0.4,
            'factory': 0.6, 'chimney': 0.5, 'fire': 0.5,
            'smog': 0.9, 'haze': 0.5, 'dust': 0.5, 'fog': 0.3,
        },
        color_signals: { dark: 0.5, dirt_brown: 0.3 },
        texture_signals: { low_uniformity: 0.3 },
        sub_types: [
            { condition: 'dark', label: 'air pollution or burning waste', severity_boost: 15 },
            { condition: 'vehicle_nearby', label: 'vehicular pollution in congested area', severity_boost: 10 },
            { condition: 'default', label: 'environmental pollution', severity_boost: 0 },
        ],
        department: { primary: 'Environment Department', secondary: 'Pollution Control Board' },
        base_severity: [30, 60],
        description_template: 'Environmental pollution detected in the area. This may include air pollution, illegal burning, or industrial emissions affecting public health.',
    },
    {
        id: 'infrastructure',
        label: 'Infrastructure Damage',
        object_signals: {
            'bench': 0.5, 'parking meter': 0.4, 'clock': 0.3,
            'stop sign': 0.4, 'fire hydrant': 0.3, 'potted plant': 0.2,
            'person': 0.05, 'car': 0.1,
        },
        mobilenet_signals: {
            'park bench': 0.6, 'fence': 0.4, 'picket fence': 0.4,
            'stone wall': 0.5, 'brick': 0.4, 'iron': 0.3,
            'bridge': 0.5, 'overpass': 0.4, 'guardrail': 0.5,
            'building': 0.2, 'railing': 0.4, 'barrier': 0.5,
        },
        color_signals: { road_gray: 0.4, dirt_brown: 0.3 },
        texture_signals: { high_edge_density: 0.4, low_uniformity: 0.4, high_roughness: 0.3 },
        sub_types: [
            { condition: 'high_edge_density', label: 'damaged public infrastructure', severity_boost: 15 },
            { condition: 'bench', label: 'broken public seating or amenity', severity_boost: 5 },
            { condition: 'default', label: 'general infrastructure issue', severity_boost: 0 },
        ],
        department: { primary: 'Municipal Corporation', secondary: 'General Maintenance' },
        base_severity: [20, 50],
        description_template: 'Public infrastructure damage detected. The affected structure requires maintenance by the municipal maintenance division.',
    },
];

// Non-civic MobileNet classes (selfies, indoor, irrelevant)
const NON_CIVIC_CLASSES = new Set([
    'television', 'monitor', 'desktop computer', 'laptop', 'mouse', 'keyboard',
    'cellular telephone', 'iPod', 'notebook', 'book', 'comic book',
    'bed', 'pillow', 'quilt', 'dining table', 'plate', 'bowl', 'cup',
    'pizza', 'hamburger', 'hot dog', 'ice cream', 'cake',
    'face', 'wig', 'sunglasses', 'lipstick', 'lotion', 'perfume',
    'bathtub', 'shower curtain', 'toilet seat', 'washbasin',
]);

// =====================================================
// MODEL SINGLETONS
// =====================================================

let cocoModel: cocoSsd.ObjectDetection | null = null;
let mobilenetModel: tf.GraphModel | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

// MobileNet V2 ImageNet class labels (top-level, loaded dynamically)
let imagenetClasses: string[] = [];

/**
 * Load both models (COCO-SSD + MobileNet V2).
 */
export async function loadModels(): Promise<void> {
    if (cocoModel && mobilenetModel) return;
    if (loadPromise) return loadPromise;

    isLoading = true;
    loadPromise = (async () => {
        try {
            await tf.ready();
            console.log('[CivicAI] TensorFlow.js backend:', tf.getBackend());

            // Load both models in parallel
            const [coco, mobilenet] = await Promise.all([
                cocoSsd.load({ base: 'lite_mobilenet_v2' }),
                tf.loadGraphModel(
                    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1',
                    { fromTFHub: true }
                ),
            ]);

            cocoModel = coco;
            mobilenetModel = mobilenet;

            // Load ImageNet class labels
            try {
                const labelsRes = await fetch('https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt');
                const labelsText = await labelsRes.text();
                imagenetClasses = labelsText.trim().split('\n').map(l => l.trim());
            } catch {
                console.warn('[CivicAI] Could not load ImageNet labels, using indices');
            }

            isLoading = false;
            console.log('[CivicAI] All models loaded successfully');
        } catch (error) {
            isLoading = false;
            loadPromise = null;
            console.error('[CivicAI] Model loading failed:', error);
            throw error;
        }
    })();

    return loadPromise;
}

export function isModelReady(): boolean { return cocoModel !== null && mobilenetModel !== null; }
export function isModelLoading(): boolean { return isLoading; }

// Re-export for backward compat
export const loadModel = loadModels;
export const isModelLoaded = isModelReady;

// =====================================================
// CORE ANALYSIS ENGINE
// =====================================================

/**
 * PRIMARY analysis function. Runs the full CivicShakti AI pipeline.
 */
export async function analyzeImage(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<CivicAnalysis> {
    try {
        await loadModels();

        // Run all analysis stages in parallel
        const [objects, mobilenetResults, colorProfile, textureProfile] = await Promise.all([
            detectObjects(imageElement),
            classifyWithMobileNet(imageElement),
            analyzeColors(imageElement),
            analyzeTexture(imageElement),
        ]);

        // Fuse all signals into a civic issue classification
        return classifyIssue(objects, mobilenetResults, colorProfile, textureProfile);
    } catch (error) {
        console.error('[CivicAI] Analysis failed:', error);
        return getDefaultAnalysis();
    }
}

/**
 * Analyze from base64 data URL.
 */
export async function analyzeFromBase64(base64Data: string): Promise<CivicAnalysis> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
            try {
                const result = await analyzeImage(img);
                resolve(result);
            } catch {
                resolve(getDefaultAnalysis());
            }
        };
        img.onerror = () => resolve(getDefaultAnalysis());
        img.src = base64Data;
    });
}

// For backward compat
export const detectFromBase64 = analyzeFromBase64;

// =====================================================
// STAGE 1: Object Detection (COCO-SSD)
// =====================================================

async function detectObjects(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<DetectedObject[]> {
    if (!cocoModel) return [];
    try {
        const predictions = await cocoModel.detect(imageElement, 20, 0.3);
        return predictions.map(p => ({
            class: p.class,
            score: Math.round(p.score * 100) / 100,
            bbox: p.bbox as [number, number, number, number],
        }));
    } catch {
        return [];
    }
}

// =====================================================
// STAGE 2: MobileNet Feature Classification
// =====================================================

async function classifyWithMobileNet(
    imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<{ className: string; probability: number }[]> {
    if (!mobilenetModel) return [];
    try {
        const tensor = tf.tidy(() => {
            const img = tf.browser.fromPixels(imageElement);
            const resized = tf.image.resizeBilinear(img, [224, 224]);
            const normalized = resized.div(255.0);
            return normalized.expandDims(0);
        });

        const predictions = mobilenetModel.predict(tensor) as tf.Tensor;
        const data = await predictions.data();
        tensor.dispose();
        predictions.dispose();

        // Get top 15 classes
        const indexed = Array.from(data).map((prob, i) => ({ i, prob }));
        indexed.sort((a, b) => b.prob - a.prob);
        const top = indexed.slice(0, 15);

        return top.map(t => ({
            className: imagenetClasses[t.i] || `class_${t.i}`,
            probability: Math.round(t.prob * 10000) / 10000,
        }));
    } catch (e) {
        console.warn('[CivicAI] MobileNet classification failed:', e);
        return [];
    }
}

// =====================================================
// STAGE 3: Color Analysis (Canvas)
// =====================================================

function analyzeColors(imageElement: HTMLImageElement | HTMLCanvasElement): ColorProfile {
    try {
        const canvas = document.createElement('canvas');
        const size = 100; // Downscale for speed
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return getDefaultColorProfile();

        ctx.drawImage(imageElement, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        let totalR = 0, totalG = 0, totalB = 0;
        let bluePixels = 0, grayPixels = 0, greenPixels = 0, brownPixels = 0, darkPixels = 0;
        const totalPixels = size * size;

        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
            totalR += r; totalG += g; totalB += b;

            const brightness = (r + g + b) / 3;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;

            // Blue detection (water, sky)
            if (b > 120 && b > r * 1.3 && b > g * 1.1) bluePixels++;
            // Gray detection (roads, concrete)
            if (saturation < 0.15 && brightness > 80 && brightness < 200) grayPixels++;
            // Green detection (vegetation)
            if (g > 100 && g > r * 1.2 && g > b * 1.2) greenPixels++;
            // Brown detection (dirt, mud)
            if (r > 100 && g > 60 && g < r * 0.85 && b < g * 0.8) brownPixels++;
            // Dark detection (night, shadows)
            if (brightness < 60) darkPixels++;
        }

        const avgBrightness = (totalR + totalG + totalB) / (3 * totalPixels);

        // Map percentages
        const colors: { name: string; percentage: number }[] = [];
        const pGray = grayPixels / totalPixels;
        const pBlue = bluePixels / totalPixels;
        const pGreen = greenPixels / totalPixels;
        const pBrown = brownPixels / totalPixels;
        const pDark = darkPixels / totalPixels;

        if (pGray > 0.05) colors.push({ name: 'gray', percentage: Math.round(pGray * 100) });
        if (pBlue > 0.05) colors.push({ name: 'blue', percentage: Math.round(pBlue * 100) });
        if (pGreen > 0.05) colors.push({ name: 'green', percentage: Math.round(pGreen * 100) });
        if (pBrown > 0.05) colors.push({ name: 'brown', percentage: Math.round(pBrown * 100) });
        if (pDark > 0.1) colors.push({ name: 'dark', percentage: Math.round(pDark * 100) });
        colors.sort((a, b) => b.percentage - a.percentage);

        return {
            dominant_colors: colors.slice(0, 5),
            brightness: Math.round(avgBrightness),
            saturation: Math.round((bluePixels + greenPixels + brownPixels) / totalPixels * 100) / 100,
            has_water_blue: pBlue > 0.08,
            has_road_gray: pGray > 0.15,
            has_vegetation_green: pGreen > 0.1,
            has_dirt_brown: pBrown > 0.08,
            has_night_dark: pDark > 0.3,
        };
    } catch {
        return getDefaultColorProfile();
    }
}

// =====================================================
// STAGE 4: Texture / Edge Analysis (Canvas)
// =====================================================

function analyzeTexture(imageElement: HTMLImageElement | HTMLCanvasElement): TextureProfile {
    try {
        const canvas = document.createElement('canvas');
        const size = 64; // Small for speed
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { edge_density: 0.3, roughness: 0.3, uniformity: 0.5 };

        ctx.drawImage(imageElement, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        // Convert to grayscale
        const gray: number[] = [];
        for (let i = 0; i < imageData.length; i += 4) {
            gray.push((imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3);
        }

        // Sobel edge detection (simplified)
        let edgeSum = 0;
        let pixelDiffs: number[] = [];

        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                const idx = y * size + x;
                // Horizontal gradient
                const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
                // Vertical gradient
                const gy = Math.abs(gray[idx + size] - gray[idx - size]);
                const edge = Math.sqrt(gx * gx + gy * gy);
                edgeSum += edge;
                pixelDiffs.push(edge);
            }
        }

        const totalInnerPixels = (size - 2) * (size - 2);
        const avgEdge = edgeSum / totalInnerPixels;
        const edgeDensity = Math.min(avgEdge / 80, 1); // Normalize

        // Roughness: variance of edge values
        const edgeMean = edgeSum / totalInnerPixels;
        let edgeVariance = 0;
        for (const d of pixelDiffs) {
            edgeVariance += (d - edgeMean) * (d - edgeMean);
        }
        edgeVariance /= totalInnerPixels;
        const roughness = Math.min(Math.sqrt(edgeVariance) / 40, 1);

        // Uniformity: how similar are pixel values
        const grayMean = gray.reduce((s, v) => s + v, 0) / gray.length;
        let grayVariance = 0;
        for (const g of gray) {
            grayVariance += (g - grayMean) * (g - grayMean);
        }
        grayVariance /= gray.length;
        const uniformity = Math.max(0, 1 - Math.sqrt(grayVariance) / 100);

        return {
            edge_density: Math.round(edgeDensity * 100) / 100,
            roughness: Math.round(roughness * 100) / 100,
            uniformity: Math.round(uniformity * 100) / 100,
        };
    } catch {
        return { edge_density: 0.3, roughness: 0.3, uniformity: 0.5 };
    }
}

// =====================================================
// FUSION CLASSIFIER — Combines all signals
// =====================================================

function classifyIssue(
    objects: DetectedObject[],
    mobilenetResults: { className: string; probability: number }[],
    colorProfile: ColorProfile,
    textureProfile: TextureProfile
): CivicAnalysis {
    const objectNames = objects.map(o => o.class);
    const mobilenetNames = mobilenetResults.map(m => m.className.toLowerCase());

    // Check if image is non-civic (selfie, indoor, food, etc.)
    const nonCivicMatches = mobilenetResults.filter(m => NON_CIVIC_CLASSES.has(m.className.toLowerCase()));
    const isLikelyNonCivic = nonCivicMatches.length > 0 && nonCivicMatches[0].probability > 0.3;

    const NON_CIVIC_OBJECTS = ['person', 'chair', 'couch', 'bed', 'dining table', 'tv', 'laptop', 'mouse', 'keyboard', 'cell phone', 'book'];
    const onlyNonCivicObjects = objects.length > 0 && objects.every(o => NON_CIVIC_OBJECTS.includes(o.class));
    const isSelfie = objects.length <= 2 && objects.some(o => o.class === 'person' && o.score > 0.7) && onlyNonCivicObjects;

    // Score each category
    const scores: Record<string, { score: number; signals: string[] }> = {};

    for (const profile of CATEGORY_PROFILES) {
        let score = 0;
        const signals: string[] = [];

        // Signal 1: COCO-SSD objects (weight: 25%)
        let objectScore = 0;
        for (const obj of objects) {
            const weight = profile.object_signals[obj.class];
            if (weight) {
                objectScore += weight * obj.score;
                signals.push(`obj:${obj.class}`);
            }
        }
        score += Math.min(objectScore, 1) * 25;

        // Signal 2: MobileNet classes (weight: 35%)
        let mobilenetScore = 0;
        for (const result of mobilenetResults) {
            const className = result.className.toLowerCase();
            for (const [key, weight] of Object.entries(profile.mobilenet_signals)) {
                if (className.includes(key.toLowerCase())) {
                    mobilenetScore += weight * result.probability;
                    signals.push(`mn:${key}`);
                }
            }
        }
        score += Math.min(mobilenetScore, 1) * 35;

        // Signal 3: Color analysis (weight: 20%)
        let colorScore = 0;
        if (profile.color_signals.road_gray && colorProfile.has_road_gray) {
            colorScore += profile.color_signals.road_gray;
            signals.push('color:gray');
        }
        if (profile.color_signals.water_blue && colorProfile.has_water_blue) {
            colorScore += profile.color_signals.water_blue;
            signals.push('color:blue');
        }
        if (profile.color_signals.vegetation_green && colorProfile.has_vegetation_green) {
            colorScore += profile.color_signals.vegetation_green;
            signals.push('color:green');
        }
        if (profile.color_signals.dirt_brown && colorProfile.has_dirt_brown) {
            colorScore += profile.color_signals.dirt_brown;
            signals.push('color:brown');
        }
        if (profile.color_signals.dark && colorProfile.has_night_dark) {
            colorScore += profile.color_signals.dark;
            signals.push('color:dark');
        }
        score += Math.min(colorScore, 1) * 20;

        // Signal 4: Texture analysis (weight: 20%)
        let textureScore = 0;
        if (profile.texture_signals.high_edge_density && textureProfile.edge_density > 0.4) {
            textureScore += profile.texture_signals.high_edge_density * textureProfile.edge_density;
            signals.push('tex:edges');
        }
        if (profile.texture_signals.low_uniformity && textureProfile.uniformity < 0.5) {
            textureScore += profile.texture_signals.low_uniformity * (1 - textureProfile.uniformity);
            signals.push('tex:rough');
        }
        if (profile.texture_signals.high_roughness && textureProfile.roughness > 0.3) {
            textureScore += profile.texture_signals.high_roughness * textureProfile.roughness;
            signals.push('tex:uneven');
        }
        score += Math.min(textureScore, 1) * 20;

        scores[profile.id] = { score, signals };
    }

    // Find best category
    const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    const [bestCategoryId, bestData] = sorted[0];
    const bestProfile = CATEGORY_PROFILES.find(p => p.id === bestCategoryId)!;

    // Determine confidence (0-100)
    const rawConfidence = Math.min(bestData.score, 100);
    let confidence = Math.round(rawConfidence);
    if (isSelfie || isLikelyNonCivic) confidence = Math.min(confidence, 15);

    // Determine sub-type
    const conditions: Record<string, boolean> = {
        water_blue: colorProfile.has_water_blue,
        high_edge_density: textureProfile.edge_density > 0.5,
        vehicle_nearby: objectNames.some(o => ['car', 'truck', 'bus', 'motorcycle'].includes(o)),
        animal_nearby: objectNames.some(o => ['dog', 'cat', 'cow', 'bird'].includes(o)),
        bottles_detected: objectNames.includes('bottle') || objectNames.includes('cup'),
        dark: colorProfile.has_night_dark,
        traffic_light: objectNames.includes('traffic light'),
        bench: objectNames.includes('bench'),
        high_roughness: textureProfile.roughness > 0.5,
    };

    let subType = bestProfile.sub_types.find(st => st.condition !== 'default' && conditions[st.condition]);
    if (!subType) subType = bestProfile.sub_types.find(st => st.condition === 'default')!;

    // Calculate severity
    const [sevMin, sevMax] = bestProfile.base_severity;
    let severity = sevMin + (confidence / 100) * (sevMax - sevMin) + subType.severity_boost;
    severity = Math.min(Math.round(severity), 100);

    const severityLevel = severity >= 76 ? 'critical' : severity >= 51 ? 'high' : severity >= 26 ? 'medium' : 'low';
    const safetyHazard = severity >= 70 || bestCategoryId === 'electricity';

    // Escalation
    const escalation = severity >= 76 ? 'emergency' : severity >= 51 ? 'urgent' : 'normal';

    // Estimated affected
    const hasVehicles = conditions.vehicle_nearby;
    const hasPeople = objectNames.includes('person');
    let estimatedAffected = '~100 residents/day';
    if (hasVehicles && hasPeople) estimatedAffected = '~500+ commuters and pedestrians/day';
    else if (hasVehicles) estimatedAffected = '~300 commuters/day';
    else if (hasPeople) estimatedAffected = '~200 pedestrians/day';

    // Quality suggestions
    let suggestions = '';
    if (confidence >= 70) suggestions = 'Great photo! Clear and relevant for the detected issue.';
    else if (confidence >= 40) suggestions = 'Photo is usable. Including more context or closer detail could improve analysis.';
    else if (isSelfie) suggestions = 'This appears to be a selfie or indoor photo. Please take a photo of the civic issue itself.';
    else suggestions = 'Image is unclear. Try capturing a clearer photo with better lighting and more of the affected area visible.';

    // Build signal scores for transparency
    const signalScores: Record<string, number> = {};
    for (const [catId, data] of Object.entries(scores)) {
        signalScores[catId] = Math.round(data.score * 10) / 10;
    }

    return {
        detected_issue: {
            category: isSelfie || isLikelyNonCivic ? 'infrastructure' : bestCategoryId,
            sub_type: subType.label,
            description: bestProfile.description_template,
            objects_detected: objectNames,
        },
        severity: {
            score: severity,
            level: severityLevel,
            reasoning: `AI detected ${bestData.signals.slice(0, 5).join(', ')} signals correlating with ${bestProfile.label}. Severity based on visual damage indicators and estimated impact.`,
            safety_hazard: safetyHazard,
            estimated_affected: estimatedAffected,
        },
        department: {
            primary: bestProfile.department.primary,
            secondary: bestProfile.department.secondary,
            escalation,
        },
        quality: {
            confidence,
            image_relevant: !isSelfie && !isLikelyNonCivic,
            is_duplicate_risk: false,
            suggestions,
        },
        model_source: 'civicshakti-ai',
        analysis_details: {
            objects,
            color_profile: colorProfile,
            texture_profile: textureProfile,
            mobilenet_classes: mobilenetResults.slice(0, 10),
            signal_scores: signalScores,
        },
    };
}

// =====================================================
// DEFAULTS
// =====================================================

function getDefaultColorProfile(): ColorProfile {
    return {
        dominant_colors: [], brightness: 128, saturation: 0.5,
        has_water_blue: false, has_road_gray: false,
        has_vegetation_green: false, has_dirt_brown: false, has_night_dark: false,
    };
}

function getDefaultAnalysis(): CivicAnalysis {
    return {
        detected_issue: {
            category: 'infrastructure', sub_type: 'unclassified',
            description: 'AI model could not analyze this image. Please describe the issue manually.',
            objects_detected: [],
        },
        severity: {
            score: 50, level: 'medium',
            reasoning: 'Default severity — AI analysis unavailable.',
            safety_hazard: false, estimated_affected: 'Unknown',
        },
        department: {
            primary: 'Municipal Corporation', secondary: 'General Maintenance', escalation: 'normal',
        },
        quality: {
            confidence: 0, image_relevant: true, is_duplicate_risk: false,
            suggestions: 'AI analysis failed. Your complaint will be reviewed manually.',
        },
        model_source: 'civicshakti-ai',
        analysis_details: {
            objects: [], color_profile: getDefaultColorProfile(),
            texture_profile: { edge_density: 0, roughness: 0, uniformity: 1 },
            mobilenet_classes: [], signal_scores: {},
        },
    };
}

// Backward compat exports
export type CivicPreScreen = CivicAnalysis;
