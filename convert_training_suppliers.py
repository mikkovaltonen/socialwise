#!/usr/bin/env python3
"""
Special converter for Training Suppliers Excel file with proper field mapping
"""
import pandas as pd
import json
import os
from datetime import datetime
import numpy as np

def clean_value(val):
    """Clean and convert values for JSON serialization"""
    if pd.isna(val) or val is None:
        return None
    elif isinstance(val, (np.integer, np.int64)):
        return int(val)
    elif isinstance(val, (np.floating, np.float64)):
        if np.isnan(val):
            return None
        return float(val)
    elif isinstance(val, (pd.Timestamp, datetime)):
        return val.isoformat()
    else:
        return str(val).strip() if str(val).strip() else None

def convert_training_suppliers():
    """Convert Training Suppliers Excel to properly formatted JSON"""

    excel_file = "/mnt/c/Users/mikbu/Documents/valmet-buyer/public/firestore/Training_suppliers_training_attributes.xlsx"
    output_file = "/mnt/c/Users/mikbu/Documents/valmet-buyer/public/firestore/training_suppliers_attributes.json"

    print(f"📊 Processing: Training Suppliers Excel")

    # Read Excel file
    df = pd.read_excel(excel_file, sheet_name='FI_dataPOCcleaned')

    # Row 1 contains the actual column names - extract them
    header_row = df.iloc[1]

    # Create column mapping based on header row values
    column_mapping = {}
    for col in df.columns:
        header_val = str(header_row[col]) if pd.notna(header_row[col]) else ''
        if 'Company Name' in header_val or col.startswith('This sheet'):
            column_mapping[col] = 'company_name'
        elif 'Supplier code' in header_val:
            column_mapping[col] = 'supplier_code'
        elif 'Training supplier Y/N' in header_val:
            column_mapping[col] = 'is_training_supplier'
        elif 'Pricing' in header_val:
            column_mapping[col] = 'pricing_per_day_eur'
        elif 'Country' in header_val and 'Delivery' not in header_val:
            column_mapping[col] = 'country'
        elif 'Delivery country' in header_val:
            column_mapping[col] = 'delivery_country'
        elif 'Contract available' in header_val:
            column_mapping[col] = 'contract_available'
        elif 'Classification' in header_val:
            column_mapping[col] = 'classification'
        elif 'Nature of the service' in header_val:
            column_mapping[col] = 'nature_of_service'
        elif 'Training area' in header_val:
            column_mapping[col] = 'training_area'
        elif 'HSE training provider' in header_val:
            column_mapping[col] = 'hse_training_provider'
        elif 'Valmet contact person' in header_val:
            column_mapping[col] = 'valmet_contact_person'
        elif 'Catalog in Basware' in header_val:
            column_mapping[col] = 'catalog_in_basware'
        elif 'Preferred supplier' in header_val:
            column_mapping[col] = 'preferred_supplier'
        else:
            # Keep original column name for unmapped columns
            column_mapping[col] = col

    # Skip the first two rows (0: blank, 1: headers) and start from actual data
    df_clean = df.iloc[2:].copy()

    # Rename columns using the mapping
    df_clean.columns = [column_mapping.get(col, col) for col in df_clean.columns]

    # Convert to records
    records = []
    for idx, row in df_clean.iterrows():
        record = {}
        for col in df_clean.columns:
            value = clean_value(row[col])
            if value is not None:
                # Special handling for Yes/No fields
                if col in ['is_training_supplier', 'contract_available', 'catalog_in_basware',
                          'preferred_supplier', 'hse_training_provider']:
                    if value and value.upper() in ['Y', 'YES']:
                        record[col] = True
                    elif value and value.upper() in ['N', 'NO']:
                        record[col] = False
                    elif value:
                        record[col] = value
                # Special handling for pricing
                elif col == 'pricing_per_day_eur':
                    # Try to extract numeric value if possible
                    if value and value not in ['no detailed info', 'nan']:
                        try:
                            # Remove non-numeric characters except dots and commas
                            numeric_str = ''.join(c for c in str(value) if c.isdigit() or c in '.,')
                            if numeric_str:
                                record[col] = float(numeric_str.replace(',', '.'))
                            else:
                                record[col + '_text'] = value
                        except:
                            record[col + '_text'] = value
                    elif value and value != 'nan':
                        record[col + '_text'] = value
                else:
                    record[col] = value

        # Add metadata
        record['_importedAt'] = datetime.now().isoformat()
        record['_sourceFile'] = 'Training_suppliers_training_attributes.xlsx'
        record['_dataRow'] = idx - 1  # Adjusted index after skipping headers

        records.append(record)

    # Save to JSON - use consistent structure with other converters
    output_data = {
        'training_suppliers': records
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Converted {len(records)} supplier records")
    print(f"💾 Saved to: {output_file}")

    # Print sample record for verification
    if records:
        print("\n📋 Sample record:")
        sample = records[0]
        for key, value in sample.items():
            if not key.startswith('_'):
                print(f"   {key}: {value}")

    return output_data

if __name__ == "__main__":
    convert_training_suppliers()