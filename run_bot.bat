@echo off
title TDK Automated Bot Launcher
echo Starting Vantage MT5 + NVIDIA NIM Automated Trading Bot...

:: Check if virtual environment (.venv) exists
if not exist .venv (
    echo Creating virtual environment (.venv)...
    python -m venv .venv
)

:: Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate

:: Upgrade pip
python -m pip install --upgrade pip

:: Install requirements
echo Installing requirements...
pip install -r requirements.txt

:: Check for .env file
if not exist .env (
    echo ========================================================
    echo WARNING: .env configuration file not found!
    echo Creating default .env from .env.example template.
    echo Please open and configure the .env file with your details.
    echo ========================================================
    copy .env.example .env
    pause
    exit /b 1
)

:: Execute the bot
echo Launching tdk_bot.py execution loop...
python tdk_bot.py

pause
