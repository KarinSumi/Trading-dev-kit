import os
from dotenv import load_dotenv

# Load local environment variables from .env if present
load_dotenv()

# NVIDIA NIM Config
NVIDIA_NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY", "")
NIM_MODEL = os.getenv("NIM_MODEL", "meta/llama3-70b-instruct")
NIM_URL = os.getenv("NIM_URL", "https://integrate.api.nvidia.com/v1/chat/completions")

# MT5 Account Configuration
try:
    MT5_LOGIN = int(os.getenv("MT5_LOGIN", "0"))
except ValueError:
    MT5_LOGIN = 0

MT5_PASSWORD = os.getenv("MT5_PASSWORD", "")
MT5_SERVER = os.getenv("MT5_SERVER", "Vantage-Demo")

# Trading Rules
SYMBOL = os.getenv("SYMBOL", "XAUUSD")
TIMEFRAME_STR = os.getenv("TIMEFRAME", "M15").upper()
DRY_RUN = os.getenv("DRY_RUN", "True").lower() in ("true", "1", "yes")

# Risk Metrics
try:
    RISK_PCT = float(os.getenv("RISK_PCT", "0.01"))
except ValueError:
    RISK_PCT = 0.01

try:
    MAX_DAILY_DRAWDOWN_PCT = float(os.getenv("MAX_DAILY_DRAWDOWN_PCT", "0.03"))
except ValueError:
    MAX_DAILY_DRAWDOWN_PCT = 0.03

try:
    ATR_SL_MULTIPLIER = float(os.getenv("ATR_SL_MULTIPLIER", "1.5"))
except ValueError:
    ATR_SL_MULTIPLIER = 1.5

# Timeframe Helper Mapping
def get_mt5_timeframe():
    """Maps string timeframes to MT5 timeframe constants."""
    import MetaTrader5 as mt5
    mapping = {
        "M1": mt5.TIMEFRAME_M1,
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
        "D1": mt5.TIMEFRAME_D1
    }
    return mapping.get(TIMEFRAME_STR, mt5.TIMEFRAME_M15)

def check_config():
    """Validates configuration parameters and returns error messages if any."""
    errors = []
    if not NVIDIA_NIM_API_KEY:
        errors.append("NVIDIA_NIM_API_KEY environment variable is missing.")
    if MT5_LOGIN == 0:
        errors.append("MT5_LOGIN is missing or invalid.")
    if not MT5_PASSWORD:
        errors.append("MT5_PASSWORD environment variable is missing.")
    return errors
