"""
Web Pic Browser - Startup Script

Usage:
  python scripts/start.py          # Production mode (serves built frontend)
  python scripts/start.py --dev    # Development mode (backend only, use npm run dev for frontend)
"""
import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")


def check_dependencies():
    try:
        import fastapi  # noqa: F401
        import uvicorn  # noqa: F401
        import sqlalchemy  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError:
        print("Installing Python dependencies...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r",
            os.path.join(BACKEND_DIR, "requirements.txt")
        ])


def main():
    check_dependencies()

    is_dev = "--dev" in sys.argv

    os.chdir(BACKEND_DIR)
    sys.path.insert(0, BACKEND_DIR)

    if is_dev:
        print("Starting in development mode...")
        print("Backend: http://127.0.0.1:8000")
        print("Run 'npm run dev' in frontend/ for the dev server at http://localhost:5173")
    else:
        frontend_dist = os.path.join(FRONTEND_DIR, "dist")
        if not os.path.isdir(frontend_dist):
            print("Warning: Frontend build not found at frontend/dist/")
            print("Run 'cd frontend && npm run build' first, or use --dev mode.")
            print("Starting backend only...")
        else:
            print("Starting in production mode...")
        print("Open http://127.0.0.1:8000 in your browser")

    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=is_dev)


if __name__ == "__main__":
    main()
