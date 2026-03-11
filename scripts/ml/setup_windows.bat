@echo off
echo ==============================================
echo CivicShakti ML Training Setup (Windows)
echo ==============================================

echo 1. Creating Python Virtual Environment (ml_env)...
python -m venv ml_env

echo 2. Activating environment...
call ml_env\Scripts\activate.bat

echo 3. Upgrading pip...
python -m pip install --upgrade pip

echo 4. Installing required ML packages (This might take a few minutes)...
pip install -r requirements.txt

echo ==============================================
echo Setup Complete! 
echo.
echo To train your model, follow these steps:
echo 1. Make sure you are in the 'ml_env' environment (you should see (ml_env) in your prompt).
echo    If not, run: call ml_env\Scripts\activate.bat
echo 2. Place your photos inside folders in the 'dataset/' directory.
echo 3. Run the script: python train_model.py
echo ==============================================
pause
