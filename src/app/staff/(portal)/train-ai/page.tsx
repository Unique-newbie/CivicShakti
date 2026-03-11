'use client';

import { useState, useRef, useEffect } from 'react';
import type * as tfTypes from '@tensorflow/tfjs';
import { toast } from 'sonner';

const CLASSES = ['pothole', 'garbage', 'water', 'electricity', 'pollution', 'infrastructure'];
const IMG_SIZE = 224;
const EPOCHS = 5;

export default function TrainModelPage() {
    const [status, setStatus] = useState<string>('Ready');
    const [progress, setProgress] = useState<number>(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [trainingData, setTrainingData] = useState<{file: File, url: string, category: string}[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>(CLASSES[0]);
    
    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
        setStatus(msg);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(file => ({
            file,
            url: URL.createObjectURL(file),
            category: selectedCategory
        }));
        setTrainingData(prev => [...prev, ...newFiles]);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setTrainingData(prev => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[index].url);
            copy.splice(index, 1);
            return copy;
        });
    };

    const processImageToTensor = async (url: string, tfInstance: typeof tfTypes): Promise<tfTypes.Tensor3D> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    // Use standard HTML Canvas to resize the image instead of tf.image.resizeBilinear
                    // This bypasses WebGL shader compilation issues on certain Windows GPUs
                    const canvas = document.createElement('canvas');
                    canvas.width = IMG_SIZE;
                    canvas.height = IMG_SIZE;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error("Could not get canvas context for resizing");
                    
                    ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
                    
                    const tensor = tfInstance.tidy(() => {
                        const pixels = tfInstance.browser.fromPixels(canvas);
                        return pixels.div(255.0) as tfTypes.Tensor3D;
                    });
                    
                    resolve(tensor);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

    const trainModel = async () => {
        if (trainingData.length === 0) {
            toast.error("Please upload at least some training images first.");
            return;
        }

        try {
            setProgress(0);
            setLogs([]);
            addLog('Initializing TensorFlow.js...');
            
            // Dynamically import tfjs to prevent SSR/Next.js bundling issues that cause 'backend' undefined errors
            const tf = await import('@tensorflow/tfjs');
            
            // Force CPU backend — WebGL shader compilation fails on many Windows GPU drivers.
            // CPU is slower but 100% reliable across all hardware.
            await tf.setBackend('cpu');
            await tf.ready();
            addLog(`Backend: ${tf.getBackend()} (CPU mode — reliable on all hardware)`);
            
            addLog('Downloading MobileNetV2 base model (approx 8MB)...');
            // Load MobileNet feature vector model
            const baseModel = await tf.loadGraphModel("https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/feature_vector/3/default/1", {fromTFHub: true});
            
            setProgress(10);
            addLog(`Processing ${trainingData.length} uploaded images...`);
            
            // Process real images into tensors
            const xsTensors: tfTypes.Tensor3D[] = [];
            const ysLabels: number[] = [];
            
            for (let i = 0; i < trainingData.length; i++) {
                addLog(`Converting image ${i+1}/${trainingData.length}...`);
                const item = trainingData[i];
                const tensor = await processImageToTensor(item.url, tf);
                xsTensors.push(tensor);
                ysLabels.push(CLASSES.indexOf(item.category));
                setProgress(10 + ((i+1)/trainingData.length)*15);
            }
            
            const { xs, ys } = tf.tidy(() => {
                return {
                    xs: tf.stack(xsTensors),
                    ys: tf.oneHot(tf.tensor1d(ysLabels, 'int32'), CLASSES.length)
                };
            });
            
            // Cleanup individual tensors to save memory
            xsTensors.forEach(t => t.dispose());
            
            setProgress(25);
            addLog('Extracting features through MobileNetV2...');
            // Forward pass through base model to get features
            const features = tf.tidy(() => baseModel.predict(xs)) as tfTypes.Tensor;
            
            // We no longer need the base model or origin images
            xs.dispose();
            
            setProgress(40);
            addLog('Building classification head...');
            // Build the top classification model
            const topModel = tf.sequential();
            topModel.add(tf.layers.dense({ inputShape: [1280], units: 128, activation: 'relu' }));
            topModel.add(tf.layers.dropout({ rate: 0.2 }));
            topModel.add(tf.layers.dense({ units: CLASSES.length, activation: 'softmax' }));
            
            topModel.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });
            
            addLog('Starting training...');
            
            await topModel.fit(features, ys, {
                epochs: EPOCHS,
                batchSize: Math.min(32, Math.max(1, Math.floor(trainingData.length / 2))),
                callbacks: {
                    onEpochEnd: async (epoch, logs) => {
                        const loss = logs?.loss?.toFixed(4) || '?';
                        const acc = logs?.acc?.toFixed(4) || '?';
                        addLog(`Epoch ${epoch+1}/${EPOCHS} - Loss: ${loss}, Acc: ${acc}`);
                        setProgress(40 + ((epoch+1)/EPOCHS)*50);
                    }
                }
            });
            
            addLog('Training complete! Downloading model files...');
            setProgress(95);
            
            // Trigger download of the resulting custom layers
            await topModel.save('downloads://model');
            
            // Provide the class indices
            const indicesJson = JSON.stringify(CLASSES.reduce((acc, curr, idx) => ({...acc, [curr]: idx}), {}), null, 2);
            const blob = new Blob([indicesJson], {type: "application/json"});
            const url  = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "class_indices.json";
            a.click();
            
            addLog('Success! Place the downloaded files into public/models/civicshakti/');
            setProgress(100);
            toast.success("Training Finished!");
            
            features.dispose();
            ys.dispose();
        } catch (e: any) {
            console.error(e);
            addLog(`Error: ${e.message}`);
            toast.error("Training failed: " + e.message);
        }
    };

    // Helper function to quickly load a few dummy images if they want to test without files
    const loadDummyData = () => {
        addLog("Generating 5 dummy noise images for quick testing...");
        const canvas = document.createElement('canvas');
        canvas.width = IMG_SIZE;
        canvas.height = IMG_SIZE;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;

        const newDummies: {url: string, file: File, category: string}[] = [];
        for(let c=0; c<CLASSES.length; c++) {
            for(let i=0; i<3; i++) {
                ctx.fillStyle = `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`;
                ctx.fillRect(0,0,IMG_SIZE,IMG_SIZE);
                const url = canvas.toDataURL('image/jpeg');
                newDummies.push({ url, file: new File([], 'dummy.jpg'), category: CLASSES[c] });
            }
        }
        setTrainingData(prev => [...prev, ...newDummies]);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Custom ML Trainer</h1>
                <p className="text-slate-500 mt-2">
                    Train the CivicShakti Custom AI Model directly in your browser. Upload examples of local civic issues
                    and teach the system to categorize them accurately.
                </p>
            </div>
            
            {/* Upload Section */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                <div className="p-6 md:w-1/3 bg-slate-50 border-r">
                    <h3 className="font-semibold mb-4 text-slate-800">1. Build Dataset</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Target Category</label>
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full rounded-md border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Add Images</label>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                multiple 
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex justify-center py-2 px-4 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                            >
                                Choose Files...
                            </button>
                        </div>
                        
                        <div className="pt-4 border-t">
                            <p className="text-xs text-slate-500 mb-2">Want to see it work without uploading real images?</p>
                            <button 
                                onClick={loadDummyData}
                                className="w-full flex justify-center py-1.5 px-3 border border-slate-300 shadow-sm text-xs font-medium rounded text-slate-600 bg-white hover:bg-slate-50"
                            >
                                Generate Dummy Images
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 md:w-2/3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-800">Uploaded Data ({trainingData.length})</h3>
                        <div className="text-xs text-slate-500">
                            {CLASSES.map(c => {
                                const count = trainingData.filter(d => d.category === c).length;
                                return count > 0 ? <span key={c} className="mr-2 px-2 py-1 bg-slate-100 rounded-full">{c}: {count}</span> : null;
                            })}
                        </div>
                    </div>
                    
                    {trainingData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                            No images added yet. Select a category and upload images.
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
                            {trainingData.map((item, idx) => (
                                <div key={idx} className="relative group aspect-square rounded overflow-hidden border">
                                    <img src={item.url} className="w-full h-full object-cover" alt="train data" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="text-white bg-red-500 rounded-full p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white p-0.5 truncate text-center">
                                        {item.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Training Section */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-semibold">2. Train Model</h3>
                        <p className="text-sm text-slate-500">Downloads MobileNetV2 and trains new layers on your uploaded dataset.</p>
                    </div>
                    <button 
                        onClick={trainModel}
                        disabled={(progress > 0 && progress < 100) || trainingData.length === 0}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                        {progress > 0 && progress < 100 ? 'Training...' : 'Start Training'}
                    </button>
                </div>
                
                {progress > 0 && (
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{status}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
                
                {logs.length > 0 && (
                    <div className="mt-4 bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 h-48 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 text-green-400">{`> ${log}`}</div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 text-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    Deployment Instructions
                </h4>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Build your dataset in step 1, then click Start Training.</li>
                    <li>Wait for the browser to download <code>model.json</code>, <code>model.weights.bin</code>, and <code>class_indices.json</code>.</li>
                    <li>Move these 3 downloaded files into your codebase at: <code>public/models/civicshakti/</code></li>
                    <li>The AI engine will automatically detect them and start scoring new user reports!</li>
                </ol>
            </div>
        </div>
    );
}
