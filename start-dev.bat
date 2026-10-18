@echo off
chcp 65001 >nul 2>&1
pushd "%~dp0"
py scripts\start.py --dev %*
set "launch_result=%errorlevel%"
popd
exit /b %launch_result%
