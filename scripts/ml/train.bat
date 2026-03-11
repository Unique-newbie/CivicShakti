@echo off
title CivicShakti AI Model Training
color 0B

echo.
echo  ============================================================
echo         CivicShakti AI Model Training
echo         One Click Setup, Train, and Deploy
echo  ============================================================
echo.

:: ============================
:: STEP 1: Check Python 3.10
:: ============================
echo [1/6] Checking for Python 3.10...
py -3.10 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Python 3.10 not found!
    echo  Please download and install Python 3.10 from:
    echo  https://www.python.org/downloads/release/python-31011/
    echo.
    pause
    exit /b 1
)
py -3.10 --version
echo  [OK] Python 3.10 found!
echo.

:: ============================
:: STEP 2: Create/Activate Venv
:: ============================
if exist ml_env\Scripts\activate.bat (
    echo [2/6] Virtual environment already exists. Activating...
    call ml_env\Scripts\activate.bat
) else (
    echo [2/6] Creating Python 3.10 virtual environment...
    py -3.10 -m venv ml_env
    call ml_env\Scripts\activate.bat
    echo  [OK] Environment created!
    echo.

    echo [2b/6] Installing ML packages (first time only, may take a few minutes)...
    python -m pip install --upgrade pip >nul 2>&1
    pip install tensorflow==2.16.1 pillow
    if %errorlevel% neq 0 (
        echo  ERROR: Failed to install TensorFlow. Check your internet connection.
        pause
        exit /b 1
    )
    pip install tensorflowjs --no-deps
    pip install tf_keras importlib_resources
    echo  [OK] All packages installed!
)
echo.

:: ============================
:: STEP 3: Create dataset folders
:: ============================
echo [3/6] Ensuring dataset folders exist...
if not exist dataset mkdir dataset
if not exist dataset\pothole mkdir dataset\pothole
if not exist dataset\pothole_normal mkdir dataset\pothole_normal
if not exist dataset\garbage mkdir dataset\garbage
if not exist dataset\garbage_normal mkdir dataset\garbage_normal
if not exist dataset\water_logging mkdir dataset\water_logging
if not exist dataset\water_normal mkdir dataset\water_normal
if not exist dataset\power_issue mkdir dataset\power_issue
if not exist dataset\electricity_normal mkdir dataset\electricity_normal
if not exist dataset\pollution mkdir dataset\pollution
if not exist dataset\pollution_normal mkdir dataset\pollution_normal
if not exist dataset\infrastructure mkdir dataset\infrastructure
if not exist dataset\infrastructure_normal mkdir dataset\infrastructure_normal
if not exist dataset\normal mkdir dataset\normal
echo  [OK] All 13 dataset folders ready!
echo.

:: ============================
:: STEP 4: Check if images exist
:: ============================
echo [4/6] Checking for training images...
set HAS_IMAGES=0
for /d %%D in (dataset\*) do (
    for %%F in ("%%D\*.jpg" "%%D\*.jpeg" "%%D\*.png" "%%D\*.bmp" "%%D\*.webp") do (
        set HAS_IMAGES=1
        goto :found_images
    )
)

if %HAS_IMAGES%==0 (
    echo.
    echo  ============================================================
    echo   NO TRAINING IMAGES FOUND!
    echo  ============================================================
    echo.
    echo   Please add images to the folders inside dataset\
    echo.
    echo   ISSUE PHOTOS:                     NORMAL PHOTOS:
    echo   dataset\pothole\               -- dataset\pothole_normal\
    echo   dataset\garbage\               -- dataset\garbage_normal\
    echo   dataset\water_logging\         -- dataset\water_normal\
    echo   dataset\power_issue\           -- dataset\electricity_normal\
    echo   dataset\pollution\             -- dataset\pollution_normal\
    echo   dataset\infrastructure\        -- dataset\infrastructure_normal\
    echo.
    echo   Aim for 20-30 images per folder (JPG/PNG/WEBP).
    echo   Opening dataset folder for you...
    echo.
    explorer dataset
    pause
    exit /b 0
)

:found_images
echo  [OK] Training images found!
echo.

:: ============================
:: STEP 5: Train the model
:: ============================
echo [5/6] Starting model training...
echo  ============================================================
echo   Training MobileNetV2 (10 epochs with data augmentation)
echo   This may take 2-10 minutes depending on your hardware.
echo  ============================================================
echo.

python train_model.py
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Training failed! Check the error messages above.
    pause
    exit /b 1
)
echo.

:: ============================
:: STEP 6: Deploy to web app
:: ============================
echo [6/6] Deploying model to web app...

set DEPLOY_DIR=..\..\public\models\civicshakti
if not exist %DEPLOY_DIR% mkdir %DEPLOY_DIR%

xcopy /E /Y tfjs_model\* %DEPLOY_DIR%\ >nul
copy /Y class_indices.json %DEPLOY_DIR%\ >nul

echo.
echo  ============================================================
echo   SUCCESS! Your AI model is trained and deployed!
echo  ============================================================
echo.
echo   Model files copied to: public\models\civicshakti\
echo.
echo   Next steps:
echo   1. Run your app:  npm run dev
echo   2. The app will auto-load your custom model!
echo   3. To push to production:
echo      git add -A
echo      git commit -m "feat: retrained AI model"
echo      git push origin main
echo.
echo  ============================================================
pause
