@echo off
chcp 65001 >nul 2>&1
echo.
echo [check] Python version:
py --version
echo.

echo [setup] Installing Python dependencies...
py -m pip install -r backend\requirements.txt
echo.

echo [setup] Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo ==================================================
echo   Local Photo Browser - Development Mode
echo ==================================================
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo   API Docs : http://127.0.0.1:8000/docs
echo ==================================================
echo   Close this window to stop both servers
echo ==================================================
echo.

echo [start] Starting frontend dev server...
cd frontend
start "frontend" cmd /c "npm run dev"
cd ..

echo [start] Starting backend server...
cd backend
py -u main.py
