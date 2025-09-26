#!/usr/bin/env python3
"""
Convert Excel files to JSON for Firestore import
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

def excel_to_json(excel_file, output_file):
    """Convert Excel file to JSON"""
    print(f"\n📊 Processing: {excel_file}")

    try:
        # Read all sheets from Excel file
        excel_data = pd.read_excel(excel_file, sheet_name=None)

        all_data = {}

        for sheet_name, df in excel_data.items():
            print(f"  📄 Sheet: {sheet_name} ({len(df)} rows)")

            # Convert DataFrame to list of dictionaries
            records = []
            for idx, row in df.iterrows():
                record = {}
                for col in df.columns:
                    # Clean column name (remove spaces, special chars)
                    clean_col = str(col).strip().replace(' ', '_').replace('/', '_').replace('&', 'and')
                    value = clean_value(row[col])
                    if value is not None:  # Only include non-null values
                        record[clean_col] = value

                # Add metadata
                record['_importedAt'] = datetime.now().isoformat()
                record['_sourceFile'] = os.path.basename(excel_file)
                record['_sheetName'] = sheet_name
                record['_rowIndex'] = idx

                records.append(record)

            # Store records for this sheet
            all_data[sheet_name] = records
            print(f"    ✅ Converted {len(records)} records")

        # Save to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)

        print(f"  💾 Saved to: {output_file}")
        return all_data

    except Exception as e:
        print(f"  ❌ Error processing {excel_file}: {e}")
        return None

def main():
    """Main conversion function"""
    base_dir = "/mnt/c/Users/mikbu/Documents/valmet-buyer/public/firestore"

    excel_files = [
        {
            "input": "Invoices 2023 Training subcategory.xlsx",
            "output": "invoices_2023_training.json",
            "collection": "invoices_training_2023"
        },
        {
            "input": "iPRO conrtacts.xlsx",
            "output": "ipro_contracts.json",
            "collection": "ipro_contracts"
        },
        {
            "input": "Training_suppliers_training_attributes.xlsx",
            "output": "training_suppliers_attributes.json",
            "collection": "training_suppliers"
        }
    ]

    print("🚀 Starting Excel to JSON conversion")
    print("=" * 60)

    results = []

    for file_info in excel_files:
        input_path = os.path.join(base_dir, file_info["input"])
        output_path = os.path.join(base_dir, file_info["output"])

        if os.path.exists(input_path):
            data = excel_to_json(input_path, output_path)
            if data:
                results.append({
                    "file": file_info["input"],
                    "json": file_info["output"],
                    "collection": file_info["collection"],
                    "sheets": list(data.keys()),
                    "total_records": sum(len(records) for records in data.values())
                })
        else:
            print(f"  ⚠️ File not found: {input_path}")

    # Print summary
    print("\n" + "=" * 60)
    print("📈 Conversion Summary:")
    for result in results:
        print(f"\n  📁 {result['file']}")
        print(f"     → JSON: {result['json']}")
        print(f"     → Collection: {result['collection']}")
        print(f"     → Sheets: {', '.join(result['sheets'])}")
        print(f"     → Total Records: {result['total_records']}")

    print("\n✅ Conversion complete!")
    return results

if __name__ == "__main__":
    main()