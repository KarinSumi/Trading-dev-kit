import os
import sys
import time
import json
import requests
import pandas as pd
import MetaTrader5 as mt5

import config

def initialize_mt5():
    """Initializes MetaTrader 5 terminal connection."""
    print("=== MT5 INITIALIZATION ===")
    if not mt5.initialize():
        print(f"MT5 Initialize failed. Error code: {mt5.last_error()}")
        sys.exit(1)
        
    print("MT5 library initialized successfully.")
    
    # If login details are configured, attempt login
    if config.MT5_LOGIN != 0:
        print(f"Attempting login to account {config.MT5_LOGIN} on server {config.MT5_SERVER}...")
        authorized = mt5.login(
            login=config.MT5_LOGIN,
            password=config.MT5_PASSWORD,
            server=config.MT5_SERVER
        )
        if not authorized:
            print(f"Login failed! Error code: {mt5.last_error()}")
            mt5.shutdown()
            sys.exit(1)
        print("Login successful and authorized.")
    else:
        print("No MT5 credentials provided in configuration. Using active MT5 terminal session.")
        
    # Check terminal connection status
    terminal_info = mt5.terminal_info()
    if terminal_info is None:
        print("Failed to get terminal info.")
        mt5.shutdown()
        sys.exit(1)
    
    print(f"Connected to terminal: {terminal_info.name} | Server: {mt5.account_info().server if mt5.account_info() else 'N/A'}")
    print(f"Account Balance: {mt5.account_info().balance if mt5.account_info() else 'N/A'} USD")

def calculate_rsi(prices, period=14):
    """Calculates Wilder's smoothed Relative Strength Index (RSI)."""
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    
    avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
    
    # Avoid division by zero
    rs = avg_gain / avg_loss.replace(0, 1e-10)
    return 100 - (100 / (1 + rs))

def calculate_atr(df, period=14):
    """Calculates Welles Wilder's Average True Range (ATR)."""
    high_low = df['high'] - df['low']
    high_cp = abs(df['high'] - df['close'].shift())
    low_cp = abs(df['low'] - df['close'].shift())
    tr = pd.concat([high_low, high_cp, low_cp], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, adjust=False).mean()

def fetch_market_data():
    """Fetches historical candles from MT5 and calculates indicators."""
    timeframe = config.get_mt5_timeframe()
    symbol = config.SYMBOL
    
    # Check if symbol is available
    selected = mt5.symbol_select(symbol, True)
    if not selected:
        print(f"Failed to select symbol: {symbol}")
        return None
        
    # Fetch 100 historical candles
    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, 100)
    if rates is None or len(rates) == 0:
        print(f"Failed to copy rates for {symbol}. Error: {mt5.last_error()}")
        return None
        
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')
    
    # Calculations
    df['RSI'] = calculate_rsi(df['close'], 14)
    df['ATR'] = calculate_atr(df, 14)
    df['SMA_20'] = df['close'].rolling(window=20).mean()
    
    return df

def audit_trade_with_nvidia_nim(state, direction):
    """
    Submits current market indicators to NVIDIA NIM.
    Returns (approved: bool, reason: str).
    """
    if not config.NVIDIA_NIM_API_KEY:
        print("NVIDIA NIM API key is missing. Skipping audit and denying trade for safety.")
        return False, "NVIDIA NIM API key not configured."
        
    headers = {
        "Authorization": f"Bearer {config.NVIDIA_NIM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""
    You are the Layer 4 Risk & Playbook Compliance Auditor for the Trading Development Kit (TDK).
    Audit this proposed Gold (XAUUSD) trade:
    - Symbol: {config.SYMBOL}
    - Direction: {direction}
    - Current Price: ${state['close']:.2f}
    - RSI (14): {state['RSI']:.2f}
    - ATR (14): {state['ATR']:.2f}
    - SMA (20): {state['SMA_20']:.2f}
    - Price Relative to SMA(20): {"Above" if state['close'] > state['SMA_20'] else "Below"}
    
    Trading Playbook Rules:
    1. For LONG: Close must be above SMA_20 and RSI must be < 45 (indicating a pullback in uptrend).
    2. For SHORT: Close must be below SMA_20 and RSI must be > 55 (indicating a pullback in downtrend).
    3. Do not approve a LONG if RSI is > 70 (Overbought).
    4. Do not approve a SHORT if RSI is < 30 (Oversold).
    
    Your output MUST be a valid JSON object ONLY. Do not include markdown code block formatting or any explanation outside the JSON.
    Format:
    {{
        "approved": true or false,
        "reason": "Detailed rule-by-rule audit explanation"
    }}
    """
    
    data = {
        "model": config.NIM_MODEL,
        "messages": [
            {"role": "system", "content": "You are a quantitative compliance subagent. You output valid raw JSON matching the specified format without markdown decoration."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1
    }
    
    print(f"Consulting NVIDIA NIM subagent ({config.NIM_MODEL}) for trade clearance...")
    try:
        response = requests.post(config.NIM_URL, headers=headers, json=data, timeout=12)
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content'].strip()
        
        # Strip markdown syntax if LLM returns it anyway
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        audit = json.loads(content)
        return bool(audit.get("approved", False)), str(audit.get("reason", "No reason provided."))
    except Exception as e:
        print(f"NVIDIA NIM query failed: {e}")
        return False, f"Failed to verify setup with NIM subagent due to communication error: {e}"

def place_trade(direction, entry_price, stop_loss_price):
    """Calculates position sizing and routes order to Vantage MT5 client."""
    symbol = config.SYMBOL
    
    # 1. Position Sizing Math
    account = mt5.account_info()
    if account is None:
        print("Error: Could not retrieve account balance details.")
        return
        
    balance = account.balance
    risk_usd = balance * config.RISK_PCT
    sl_distance = abs(entry_price - stop_loss_price)
    
    if sl_distance <= 0:
        print("Error: Stop Loss distance is zero or negative.")
        return
        
    # XAUUSD Standard contract size = 100. Sizing calculation:
    lots = risk_usd / (sl_distance * 100.0)
    lots = round(lots, 2)
    
    # Safety bounds check
    if lots < 0.01:
        lots = 0.01
    elif lots > 10.0:  # Max size cap for safety
        lots = 10.0
        
    print(f"Risk Profile: Balance=${balance:.2f} | Risk Amount=${risk_usd:.2f} | Calculated Lots={lots} | SL Distance=${sl_distance:.2f}")
    
    # 2. Dry Run Check
    if config.DRY_RUN:
        print("====================================================")
        print("[WARNING] DRY RUN TRIGGERED (NO REAL MONEY TRADED) [WARNING]")
        print(f"Action: {direction} | Symbol: {symbol} | Lots: {lots}")
        print(f"Entry Price: ${entry_price:.2f} | Stop Loss: ${stop_loss_price:.2f}")
        print("====================================================")
        return
        
    # 3. Live Trade Routing
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        print(f"Error: Could not fetch ticks for {symbol}")
        return
        
    order_type = mt5.ORDER_TYPE_BUY if direction == "LONG" else mt5.ORDER_TYPE_SELL
    price = tick.ask if direction == "LONG" else tick.bid
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lots,
        "type": order_type,
        "price": price,
        "sl": stop_loss_price,
        "deviation": 20,
        "magic": 202605,
        "comment": "TDK NIM Autopilot",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    
    print(f"Sending live trade request to Vantage MT5: {direction} {lots} lots at {price}...")
    result = mt5.order_send(request)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        print(f"TRADE REJECTED! Retcode: {result.retcode} | Message: {result.comment}")
    else:
        print(f"TRADE EXECUTED SUCCESS! Deal ID: {result.deal} | Fill Price: {result.price}")

def run_scanner_cycle(last_candle_time):
    """Runs a single analysis and scanning execution step."""
    df = fetch_market_data()
    if df is None or len(df) == 0:
        return last_candle_time
        
    latest_row = df.iloc[-1]
    candle_time = latest_row['time']
    
    # Prevent multiple entries on the same candle
    if last_candle_time is not None and candle_time <= last_candle_time:
        return last_candle_time
        
    close_price = latest_row['close']
    rsi = latest_row['RSI']
    sma = latest_row['SMA_20']
    atr = latest_row['ATR']
    
    print(f"Scan Check: Time={candle_time} | Price=${close_price:.2f} | RSI={rsi:.2f} | SMA20=${sma:.2f}")
    
    # Playbook pullbacks scanning triggers
    direction = None
    if close_price > sma and rsi < 45:
        direction = "LONG"
    elif close_price < sma and rsi > 55:
        direction = "SHORT"
        
    if direction:
        print(f"[TARGET] Playbook setup pattern found! Direction: {direction}")
        
        # Consultation validation
        approved, reason = audit_trade_with_nvidia_nim(latest_row, direction)
        print(f"Audit Status: {'APPROVED' if approved else 'DENIED'}")
        print(f"Audit Logs: {reason}")
        
        if approved:
            # Sizing and stop calculations
            sl_distance = atr * config.ATR_SL_MULTIPLIER
            stop_loss = close_price - sl_distance if direction == "LONG" else close_price + sl_distance
            place_trade(direction, close_price, stop_loss)
            
            # Update last processed candle time to prevent repeat entries
            return candle_time
            
    return last_candle_time

def main():
    print("====================================================")
    print("   TDK AUTOMATED TRADING BOT Cockpit Activated      ")
    print("====================================================")
    
    # Run configuration validation check
    errors = config.check_config()
    if errors:
        print("Configuration Warnings:")
        for err in errors:
            print(f"  - {err}")
        print("Please check your .env setup.")
        
    initialize_mt5()
    
    last_candle_time = None
    print("\nBot scan loop is active. Monitoring market conditions...")
    
    try:
        while True:
            last_candle_time = run_scanner_cycle(last_candle_time)
            # Sleep 60 seconds between scans
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nTermination signal received. Shutting down MT5 session...")
    finally:
        mt5.shutdown()
        print("MT5 interface closed. Bot offline.")

if __name__ == "__main__":
    main()
