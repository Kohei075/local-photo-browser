import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("launcher", Path(__file__).parents[1] / "start.py")
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class DependencySetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.backend = self.root / "backend"
        self.frontend = self.root / "frontend"
        self.backend.mkdir()
        self.frontend.mkdir()
        (self.backend / "requirements.txt").write_text("fastapi==0.115.6\n")
        (self.frontend / "package.json").write_text('{"dependencies": {}}')
        (self.frontend / "package-lock.json").write_text('{}')
        self.paths = patch.multiple(launcher, BACKEND_DIR=str(self.backend), FRONTEND_DIR=str(self.frontend))
        self.paths.start()

    def tearDown(self):
        self.paths.stop()
        self.temp.cleanup()

    def test_python_skips_unchanged_and_reinstalls_on_change(self):
        with patch.object(launcher, "run_cmd") as install:
            launcher.check_python_deps()
            launcher.check_python_deps()
            self.assertEqual(install.call_count, 1)
            (self.backend / "requirements.txt").write_text("fastapi==0.115.7\n")
            launcher.check_python_deps()
            launcher.check_python_deps(force=True)
            self.assertEqual(install.call_count, 3)

    def test_python_failure_does_not_record_success(self):
        with patch.object(launcher, "run_cmd", side_effect=RuntimeError("offline")):
            with self.assertRaises(RuntimeError):
                launcher.check_python_deps()
        self.assertFalse((self.backend / "data" / "python-dependencies.sha256").exists())

    def test_python_environment_change_invalidates_stamp(self):
        with patch.object(launcher, "run_cmd") as install:
            launcher.check_python_deps()
            with patch.object(launcher.importlib.metadata, "version", return_value="changed"):
                launcher.check_python_deps()
            self.assertEqual(install.call_count, 2)

    def test_node_skips_unchanged_and_recovers_missing_vite(self):
        vite = self.frontend / "node_modules" / "vite" / "bin" / "vite.js"

        def installed(*args, **kwargs):
            vite.parent.mkdir(parents=True, exist_ok=True)
            vite.write_text("")

        with patch.object(launcher.shutil, "which", side_effect=lambda name: name), \
                patch.object(launcher.subprocess, "check_output", return_value="v22.0.0"), \
                patch.object(launcher, "run_cmd", side_effect=installed) as install:
            launcher.check_node_deps()
            launcher.check_node_deps()
            self.assertEqual(install.call_count, 1)
            (self.frontend / "package-lock.json").write_text('{"changed":true}')
            launcher.check_node_deps()
            vite.unlink()
            launcher.check_node_deps()
            self.assertEqual(install.call_count, 3)


if __name__ == "__main__":
    unittest.main()
