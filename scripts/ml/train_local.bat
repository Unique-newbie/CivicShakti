@echo off
echo ==================================================
echo  CivicShakti - Local ML Training Pipeline
echo ==================================================
echo.
echo  Choose training mode:
echo.
echo    [1] YOLO Object Detection (needs images + _annotations.csv)
echo        - Draws bounding boxes around issues
echo        - Requires annotated dataset in dataset/pothole/
echo.
echo    [2] MobileNet Classification (needs images in folders)
echo        - Classifies whole image by category
echo        - Just put images in dataset/pothole/, dataset/garbage/, etc.
echo.
echo    [3] Both (run classification first, then detection)
echo.
set /p MODE="Enter choice (1/2/3): "
echo.

:: ============================
:: STEP 1 — Virtual Environment
:: ============================
if not exist "ml_env\Scripts\python.exe" (
    echo [SETUP] Creating virtual environment with Python 3.10...
    echo [SETUP] (TensorFlow requires Python 3.10-3.12, your default is 3.14)
    py -3.10 -m venv ml_env
    call ml_env\Scripts\activate.bat
    echo [SETUP] Installing dependencies with NVIDIA GPU support...
    python -m pip install --upgrade pip
    echo [SETUP] Installing PyTorch with CUDA 12.6 for NVIDIA GPU...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
    echo [SETUP] Installing TensorFlow...
    pip install tensorflow tensorflowjs pandas "tf_keras<=2.19.0"
    echo [SETUP] Installing YOLO and export tools...
    pip install ultralytics onnx onnxslim onnxruntime onnx2tf sng4onnx onnx_graphsurgeon
) else (
    echo [SETUP] Virtual environment ready, activating...
    call ml_env\Scripts\activate.bat
)
echo.
echo [GPU CHECK] Verifying NVIDIA GPU detection...
python -c "import torch; print(f'PyTorch CUDA: {torch.cuda.is_available()} - {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"No GPU\"}')"
python -c "import tensorflow as tf; gpus=tf.config.list_physical_devices('GPU'); print(f'TensorFlow GPU: {len(gpus)} device(s) found')"
echo.

:: ============================
:: CLASSIFICATION MODE
:: ============================
if "%MODE%"=="2" goto CLASSIFY
if "%MODE%"=="3" goto CLASSIFY
goto DETECT

:CLASSIFY
echo ==================================================
echo  CLASSIFICATION: MobileNetV2 Transfer Learning
echo ==================================================
echo.

echo [CLASSIFY 1/3] Training MobileNetV2 classifier...
python train_model.py
if %ERRORLEVEL% neq 0 (
    echo ERROR: Classification training failed!
    pause
    exit /b 1
)
echo.

:: Deploy classification model
set CLS_DEST=..\..\public\models\civicshakti
echo [CLASSIFY 2/3] Deploying classification model to %CLS_DEST%...
if not exist "%CLS_DEST%" mkdir "%CLS_DEST%"
if exist "tfjs_model" (
    copy "tfjs_model\*" "%CLS_DEST%\" /Y
    if exist "class_indices.json" copy "class_indices.json" "%CLS_DEST%\" /Y
)
echo.

echo [CLASSIFY 3/3] Classification model deployed!
echo.

if "%MODE%"=="2" goto DONE
:: Fall through to detection if mode is 3

:: ============================
:: DETECTION MODE
:: ============================
:DETECT
echo ==================================================
echo  DETECTION: YOLOv8 Object Detection
echo ==================================================
echo.

echo [DETECT 1/4] Converting dataset to YOLO format...
python convert_to_yolo.py
if %ERRORLEVEL% neq 0 (
    echo ERROR: Dataset conversion failed!
    echo Make sure dataset folders have train/valid folders with _annotations.csv
    pause
    exit /b 1
)
echo.

echo [DETECT 2/4] Training YOLOv8 model...
python train_yolo.py
if %ERRORLEVEL% neq 0 (
    echo ERROR: YOLO training failed!
    pause
    exit /b 1
)
echo.

echo [DETECT 3/4] Exporting to TensorFlow.js...
echo   (Export is handled by train_yolo.py automatically)
echo.

set DET_DEST=..\..\public\models\civic_od
echo [DETECT 4/4] Deploying detection model to %DET_DEST%...
if not exist "%DET_DEST%" mkdir "%DET_DEST%"
:: Find and copy the latest exported tfjs model
for /f "delims=" %%i in ('dir /b /s "civic_ai_models\civic_detection*\*_web_model" 2^>nul') do set TFJS_DIR=%%i
if defined TFJS_DIR (
    copy "%TFJS_DIR%\*" "%DET_DEST%\" /Y
) else (
    echo WARNING: Could not find exported TFJS model. You may need to copy it manually.
)
echo.

:: ============================
:: DONE
:: ============================
:DONE
echo ==================================================
echo  ALL DONE!
echo.
if "%MODE%"=="1" echo   Detection model  -^> public/models/civic_od/
if "%MODE%"=="2" echo   Classification   -^> public/models/civicshakti/
if "%MODE%"=="3" (
    echo   Classification   -^> public/models/civicshakti/
    echo   Detection model  -^> public/models/civic_od/
)
echo.
echo   Run 'npm run dev' to test in the browser.
echo ==================================================
pause
