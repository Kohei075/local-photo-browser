"""
Web Pic Browser - Startup Script

Usage:
  py scripts/start.py          # Production mode (serves built frontend)
  py scripts/start.py --dev    # Development mode (backend + frontend dev server)
"""
import os
import sys
import signal
import subprocess
import shutil
import atexit

# Force unbuffered output so prints appear immediately
os.environ["PYTHONUNBUFFERED"] = "1"

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

frontend_process = None


def run_cmd(args, **kwargs):
    """Run a command with real-time output."""
    print(f"  > {' '.join(args)}", flush=True)
    subprocess.check_call(args, **kwargs)


def check_python_deps():
    print("[check] Python dependencies...", flush=True)
    missing = []
    for pkg, import_name in [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("sqlalchemy", "sqlalchemy"),
        ("pillow", "PIL"),
    ]:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"[setup] Installing Python dependencies ({', '.join(missing)})...", flush=True)
        run_cmd([
            sys.executable, "-m", "pip", "install", "-r",
            os.path.join(BACKEND_DIR, "requirements.txt")
        ])
        print("[setup] Python dependencies installed.", flush=True)
    else:
        print("[check] Python dependencies OK.", flush=True)


def check_node_deps():
    print("[check] Frontend dependencies...", flush=True)
    node_modules = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.isdir(node_modules):
        npm_cmd = shutil.which("npm")
        if npm_cmd is None:
            print("[error] npm not found. Please install Node.js first.", flush=True)
            sys.exit(1)
        print("[setup] Installing frontend dependencies (npm install)...", flush=True)
        run_cmd([npm_cmd, "install"], cwd=FRONTEND_DIR)
        print("[setup] Frontend dependencies installed.", flush=True)
    else:
        print("[check] Frontend dependencies OK.", flush=True)


def start_frontend_dev():
    global frontend_process
    npm_cmd = shutil.which("npm")
    if npm_cmd is None:
        print("[error] npm not found. Skipping frontend dev server.", flush=True)
        return
    print("[start] Launching frontend dev server...", flush=True)
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
    )


def cleanup():
    global frontend_process
    if frontend_process and frontend_process.poll() is None:
        print("\n[shutdown] Stopping frontend dev server...", flush=True)
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            frontend_process.kill()


def main():
    is_dev = "--dev" in sys.argv

    print("", flush=True)
    check_python_deps()

    os.chdir(BACKEND_DIR)
    sys.path.insert(0, BACKEND_DIR)

    if is_dev:
        check_node_deps()
        start_frontend_dev()
        atexit.register(cleanup)
        signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))

        print("", flush=True)
        print("=" * 50, flush=True)
        print("  Web Pic Browser - Development Mode", flush=True)
        print("=" * 50, flush=True)
        print("  Frontend : http://localhost:5173", flush=True)
        print("  Backend  : http://127.0.0.1:8000", flush=True)
        print("  API Docs : http://127.0.0.1:8000/docs", flush=True)
        print("=" * 50, flush=True)
        print("  Press Ctrl+C to stop both servers", flush=True)
        print("=" * 50, flush=True)
        print("", flush=True)
    else:
        frontend_dist = os.path.join(FRONTEND_DIR, "dist")
        if not os.path.isdir(frontend_dist):
            print("[warn] Frontend build not found at frontend/dist/", flush=True)
            print("  Run 'cd frontend && npm run build' first, or use --dev mode.", flush=True)
            print("  Starting backend only...", flush=True)
        else:
            print("Starting in production mode...", flush=True)
        print("Open http://127.0.0.1:8000 in your browser", flush=True)

    print("[start] Launching backend server...", flush=True)
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=is_dev)


if __name__ == "__main__":
    main()
