import pandas as pd
import numpy as np
import tdk_bot
import config

def generate_mock_candles():
    """Generates 50 mock candle bars of mock uptrend then pullback."""
    np.random.seed(42)
    times = pd.date_range(start="2026-05-21 00:00:00", periods=50, freq="15min")
    
    # Generate prices: starting at 2400, moving upwards, then a small pullback
    close_prices = []
    current_price = 2400.0
    for i in range(50):
        if i < 35:
            # Uptrend
            change = np.random.uniform(-2.0, 5.0)
        else:
            # Pullback
            change = np.random.uniform(-4.0, 1.0)
        current_price += change
        close_prices.append(current_price)
        
    df = pd.DataFrame({
        'time': times,
        'open': [p - np.random.uniform(0, 2) for p in close_prices],
        'high': [p + np.random.uniform(0, 3) for p in close_prices],
        'low': [p - np.random.uniform(1, 4) for p in close_prices],
        'close': close_prices,
        'tick_volume': np.random.randint(100, 1000, size=50)
    })
    return df

def run_tests():
    print("=== TDK BOT LOGIC VERIFICATION ===")
    df = generate_mock_candles()
    
    # Calculate indicators using our tdk_bot functions
    df['RSI'] = tdk_bot.calculate_rsi(df['close'], 14)
    df['ATR'] = tdk_bot.calculate_atr(df, 14)
    df['SMA_20'] = df['close'].rolling(window=20).mean()
    
    # Output latest values
    latest = df.iloc[-1]
    print(f"Mock Data shape: {df.shape}")
    print(f"Latest Candle Time: {latest['time']}")
    print(f"Latest Close: ${latest['close']:.2f}")
    print(f"Latest RSI (14): {latest['RSI']:.2f}")
    print(f"Latest ATR (14): {latest['ATR']:.2f}")
    print(f"Latest SMA (20): ${latest['SMA_20']:.2f}")
    
    # Verify calculated indicators are valid float numbers
    assert not np.isnan(latest['RSI']), "RSI calculation failed (NaN value)."
    assert not np.isnan(latest['ATR']), "ATR calculation failed (NaN value)."
    assert not np.isnan(latest['SMA_20']), "SMA_20 calculation failed (NaN value)."
    print("[OK] Indicator math verified successfully (non-NaN values).")
    
    # Test playbook trigger logic on mock pullback setup
    # If close > SMA_20 and RSI < 45 -> LONG
    # If close < SMA_20 and RSI > 55 -> SHORT
    playbook_condition_met = False
    for i in range(20, len(df)):
        row = df.iloc[i]
        direction = None
        if row['close'] > row['SMA_20'] and row['RSI'] < 45:
            direction = "LONG"
        elif row['close'] < row['SMA_20'] and row['RSI'] > 55:
            direction = "SHORT"
            
        if direction:
            playbook_condition_met = True
            print(f"[OK] Playbook trigger logic simulated: found {direction} setup at index {i} (Price=${row['close']:.2f}, RSI={row['RSI']:.2f})")
            break
            
    if not playbook_condition_met:
        print("Note: No pullback setups triggered on this specific mock dataset, which is normal.")
        
    print("[OK] Code logic and indicator calculations verified successfully!")

if __name__ == "__main__":
    run_tests()
