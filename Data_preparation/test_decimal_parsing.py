#!/usr/bin/env python3
"""
Quick test script to verify decimal comma parsing
"""

import pandas as pd

# Test data with European decimal format
test_data = {
    'MaterialID': [106910, 106910],
    'In': ['40', '0'],
    'Out': ['0', '1,32'],
    'StockBefore': [0, 40],
    'StockAfter': [40, '38,68']
}

df = pd.DataFrame(test_data)

print("Before conversion:")
print(df)
print(f"\nData types:\n{df.dtypes}\n")

# Function to fix decimal columns
def fix_decimal_columns(df, columns):
    """Convert European decimal format (comma) to standard format (period)"""
    for col in columns:
        if col in df.columns:
            df[col] = df[col].apply(lambda x:
                float(str(x).replace(',', '.')) if pd.notna(x) and str(x).strip() != '' else 0.0
            )
            print(f"✓ Converted {col} to numeric (handling comma decimals)")

# Apply fix
fix_decimal_columns(df, ['In', 'Out', 'StockBefore', 'StockAfter'])

print("\nAfter conversion:")
print(df)
print(f"\nData types:\n{df.dtypes}\n")

# Test calculations
reservations = df['Out'].sum()
available_stock = df.iloc[0]['StockAfter']
final_stock = available_stock - reservations

print(f"\n📊 Calculated values:")
print(f"  Available Stock:    {available_stock:.2f}")
print(f"  Total Reservations: {reservations:.2f}")
print(f"  Final Stock:        {final_stock:.2f}")
print(f"\n✅ Expected: Stock=40.00, Reservations=1.32, Final=38.68")
