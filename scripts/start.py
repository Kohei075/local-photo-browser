"""
Local Photo Browser - Startup Script

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
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path

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


def dependency_fingerprint(paths, runtime):
    digest = hashlib.sha256(runtime.encode())
    for path in paths:
        digest.update(Path(path).read_bytes())
    return digest.hexdigest()


def python_fingerprint():
    requirements = Path(BACKEND_DIR) / "requirements.txt"
    versions = {}
    for line in requirements.read_text().splitlines():
        name = line.split("[")[0].split("==")[0].split(">=")[0].strip()
        if not name or name.startswith("#"):
            continue
        try:
            versions[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            versions[name] = None
    return dependency_fingerprint(
        [requirements], sys.executable + sys.version + json.dumps(versions, sort_keys=True)
    )


def check_python_deps(force=False):
    print("[check] Python dependencies...", flush=True)
    stamp = Path(BACKEND_DIR) / "data" / "python-dependencies.sha256"
    fingerprint = python_fingerprint()
    if force or not stamp.is_file() or stamp.read_text() != fingerprint:
        print("[setup] Installing Python dependencies (first run or dependencies changed)...", flush=True)
        run_cmd([
            sys.executable, "-m", "pip", "install", "-r",
            os.path.join(BACKEND_DIR, "requirements.txt")
        ])
        stamp.parent.mkdir(parents=True, exist_ok=True)
        stamp.write_text(python_fingerprint())
        print("[setup] Python dependencies installed.", flush=True)
    else:
        print("[check] Python dependencies OK.", flush=True)


def check_node_deps(force=False):
    print("[check] Frontend dependencies...", flush=True)
    npm_cmd = shutil.which("npm")
    node_cmd = shutil.which("node")
    if npm_cmd is None or node_cmd is None:
        raise RuntimeError("npm/node not found. Please install Node.js first.")
    node_version = subprocess.check_output([node_cmd, "--version"], text=True).strip()
    manifest = Path(FRONTEND_DIR) / "package.json"
    lock = Path(FRONTEND_DIR) / "package-lock.json"
    paths = [manifest, lock] if lock.is_file() else [manifest]
    fingerprint = dependency_fingerprint(paths, node_cmd + node_version)
    stamp = Path(FRONTEND_DIR) / "node_modules" / ".photo-browser-dependencies.sha256"
    vite_cli = Path(FRONTEND_DIR) / "node_modules" / "vite" / "bin" / "vite.js"
    if force or not vite_cli.is_file() or not stamp.is_file() or stamp.read_text() != fingerprint:
        print("[setup] Installing frontend dependencies (npm install)...", flush=True)
        run_cmd([npm_cmd, "install"], cwd=FRONTEND_DIR)
        # npm may update the lockfile; remember the successfully installed inputs.
        paths = [manifest, lock] if lock.is_file() else [manifest]
        stamp.write_text(dependency_fingerprint(paths, node_cmd + node_version))
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
    parser = argparse.ArgumentParser(description="Start Local Photo Browser")
    parser.add_argument("--dev", action="store_true", help="Start the Vite development server too")
    parser.add_argument("--setup-only", action="store_true", help="Reinstall dependencies without starting servers")
    args = parser.parse_args()
    is_dev = args.dev

    print("", flush=True)
    check_python_deps(force=args.setup_only)

    if args.setup_only:
        check_node_deps(force=True)
        return

    os.chdir(BACKEND_DIR)
    sys.path.insert(0, BACKEND_DIR)

    if is_dev:
        check_node_deps()
        start_frontend_dev()
        atexit.register(cleanup)
        signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))

        print("", flush=True)
        print("=" * 50, flush=True)
        print("  Local Photo Browser - Development Mode", flush=True)
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
