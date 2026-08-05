#!/bin/bash

cd "$(dirname "$0")/../backend/ai-service"

echo "========================================"
echo "  AI Mentor Backend Startup"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[ERROR] Virtual environment not found!"
    echo "Please create it first:"
    echo "  python3 -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "[1/3] Activating virtual environment..."
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "[WARNING] .env file not found!"
    echo "Please copy .env.example to .env and add your GROQ_API_KEY"
    echo ""
    exit 1
fi

# Check if requirements are installed
echo "[2/3] Checking dependencies..."
python -c "import fastapi" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[WARNING] Dependencies not installed!"
    echo "Installing requirements..."
    pip install -r requirements.txt
fi

# Start the server
echo "[3/3] Starting FastAPI server..."
echo ""
echo "========================================"
echo "  Backend running on:"
echo "  http://127.0.0.1:8000"
echo ""
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

python chatbot_api.py
