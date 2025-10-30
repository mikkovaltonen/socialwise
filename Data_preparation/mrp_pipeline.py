"""
MRP (Material Requirement Planning) ETL Pipeline
Processes MaterialStockMovement.xlsx and MaterialModule.xlsx
Groups data by substrate family (keyword) and uploads to Firestore

See Data praration logic.md for complete specifications
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import logging
import os
import json
from collections import defaultdict
import requests
import argparse

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Firebase imports
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_ADMIN_AVAILABLE = True
except ImportError:
    FIREBASE_ADMIN_AVAILABLE = False
    logger.warning("firebase-admin not installed, will use REST API")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MOVEMENT_FILE = "MaterialStockMovement.xlsx"
MATERIAL_MASTER_FILE = "MaterialModule.xlsx"
FIRESTORE_COLLECTION = "stock_management"
OUTPUT_DIR = "output"
OUTPUT_JSON = "output/mrp_summary.json"


class MRPPipeline:
    """Pipeline to process material stock movements grouped by substrate family"""

    def __init__(self, filter_material_id=None):
        self.movements_df = None
        self.material_master_df = None
        self.mrp_data = None  # Will be dict grouped by keyword
        self.db = None
        self.filter_material_id = filter_material_id  # Optional material ID filter for testing
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase using email/password authentication from .env"""
        try:
            # Get credentials from environment
            self.firebase_email = os.getenv('FIRESTORE_USER')
            self.firebase_password = os.getenv('FIRESTORE_PW')
            self.firebase_api_key = os.getenv('VITE_FIREBASE_API_KEY')
            self.firebase_project_id = os.getenv('VITE_FIREBASE_PROJECT_ID')

            if not all([self.firebase_email, self.firebase_password, self.firebase_api_key, self.firebase_project_id]):
                raise Exception("Missing required credentials in .env: FIRESTORE_USER, FIRESTORE_PW, VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID")

            logger.info(f"Authenticating as: {self.firebase_email}")

            # Authenticate and get ID token
            self.id_token = self._authenticate_firebase()

            if self.id_token:
                logger.info("✓ Firebase authentication successful")
                self.db = "REST"  # Flag to use REST API
            else:
                raise Exception("Failed to get authentication token")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            logger.warning("Continuing without Firestore (will save to local JSON only)")
            self.db = None
            self.id_token = None
            self.firebase_project_id = None

    def _authenticate_firebase(self):
        """Authenticate with Firebase using email/password and return ID token"""
        try:
            # Firebase Auth REST API endpoint
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={self.firebase_api_key}"

            payload = {
                "email": self.firebase_email,
                "password": self.firebase_password,
                "returnSecureToken": True
            }

            response = requests.post(url, json=payload)
            response.raise_for_status()

            data = response.json()
            return data.get('idToken')

        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None

    def extract(self):
        """Extract: Read MaterialStockMovement.xlsx and MaterialModule.xlsx"""
        logger.info("=" * 80)
        logger.info("EXTRACT PHASE")
        logger.info("=" * 80)

        try:
            # Extract material movements
            logger.info(f"Reading material movements from {MOVEMENT_FILE}")
            self.movements_df = pd.read_excel(MOVEMENT_FILE)
            logger.info(f"✓ Loaded {len(self.movements_df)} movement rows")

            # Fix decimal comma format (European format: 1,32 -> 1.32)
            self._fix_decimal_columns(self.movements_df, ['In', 'Out', 'StockBefore', 'StockAfter'])

            # Extract material master data
            logger.info(f"Reading material master data from {MATERIAL_MASTER_FILE}")
            self.material_master_df = pd.read_excel(MATERIAL_MASTER_FILE)
            logger.info(f"✓ Loaded {len(self.material_master_df)} materials from master data")

            return self
        except Exception as e:
            logger.error(f"Failed to extract data: {e}")
            raise

    def _fix_decimal_columns(self, df, columns):
        """Convert European decimal format (comma) to standard format (period)"""
        for col in columns:
            if col in df.columns:
                # Convert to string first, replace comma with period, then to float
                df[col] = df[col].apply(lambda x:
                    float(str(x).replace(',', '.')) if pd.notna(x) and str(x).strip() != '' else 0.0
                )
                logger.debug(f"  Converted {col} to numeric (handling comma decimals)")

    def transform(self):
        """Transform: Aggregate movements and group by keyword"""
        logger.info("=" * 80)
        logger.info("TRANSFORM PHASE - Grouping by substrate family (keyword)")
        logger.info("=" * 80)

        # Apply material ID filter if provided
        if self.filter_material_id:
            logger.info(f"🔍 FILTERING: Processing only Material ID = {self.filter_material_id}")
            material_ids = [self.filter_material_id]
        else:
            material_ids = self.movements_df['MaterialID'].unique()
            logger.info(f"Processing all {len(material_ids)} materials")

        today = pd.Timestamp.now().normalize()

        # Dictionary to group materials by keyword
        grouped_data = defaultdict(lambda: {
            'keyword': '',
            'materials': [],
            'material_count': 0,
            'current_stock': 0,
            'total_to_be_delivered': 0,
            'total_reservations': 0,
            'total_final_stock': 0
        })

        # Process each material
        for material_id in material_ids:
            material_df = self.movements_df[self.movements_df['MaterialID'] == material_id].copy()

            # Check if material exists
            if len(material_df) == 0:
                if self.filter_material_id:
                    logger.error(f"❌ Material ID {material_id} not found in MaterialStockMovement.xlsx")
                    logger.info(f"Available material IDs: {sorted(self.movements_df['MaterialID'].unique())[:10]}... (showing first 10)")
                continue

            material_df = material_df.sort_values(['Date', 'Hour'])

            # Separate historical vs future
            material_df['is_future'] = material_df['Date'] > today
            historical = material_df[~material_df['is_future']]
            future = material_df[material_df['is_future']]

            # Debug output for test mode
            if self.filter_material_id and material_id == self.filter_material_id:
                logger.info(f"\n📋 Movement Data for Material {material_id}:")
                logger.info(f"  Total movements: {len(material_df)}")
                logger.info(f"  Historical: {len(historical)}, Future: {len(future)}")
                logger.info(f"\n  Recent movements:")
                for idx, row in material_df.head(5).iterrows():
                    logger.info(f"    {row['Date']} | {row['KindOfMovement']:30s} | In: {row['In']:8.2f} | Out: {row['Out']:8.2f} | Stock: {row['StockAfter']:8.2f}")

            # Calculate stock levels (use float for decimals)
            # If historical movements exist, use StockAfter of last historical movement
            # If only future movements, use StockBefore of first future movement
            if len(historical) > 0:
                available_stock = float(historical.iloc[-1]['StockAfter'])
            elif len(future) > 0:
                available_stock = float(future.iloc[0]['StockBefore'])
            else:
                available_stock = 0.0  # No movements at all

            # Calculate ALL future deliveries (Purchase Orders, Deliveries, Goods returned, etc.)
            to_be_delivered = float(future['In'].sum())

            # Calculate ALL future outgoing movements (Reservations, Consumption, Waste, etc.)
            reservations = float(future['Out'].sum())

            # Final stock = Current stock + All Future In - All Future Out
            final_stock = available_stock + to_be_delivered - reservations

            # Find first shortage date (simulates timeline chronologically)
            expected_date = self._find_first_shortage_date(future, available_stock)
            historical_slit = self._assess_historical_slit(historical)

            # Get material master data
            master_data = self._get_material_master_data(material_id)
            keyword = master_data.get('keyword', 'UNKNOWN')

            # Create material record (use float to preserve decimals)
            material_record = {
                'material_id': str(material_id),
                'supplier_keyword': master_data.get('supplier_keyword', ''),
                'width': master_data.get('width', ''),
                'length': master_data.get('length', ''),
                'ref_at_supplier': master_data.get('ref_at_supplier', ''),
                'description': master_data.get('description', ''),
                'lead_time': master_data.get('lead_time', ''),
                'safety_stock': master_data.get('safety_stock', 0),
                'current_stock': round(available_stock, 2),
                'to_be_delivered': round(to_be_delivered, 2),
                'reservations': round(reservations, 2),
                'final_stock': round(final_stock, 2),
                'expected_date': expected_date.strftime('%Y-%m-%d') if expected_date else None,
                'historical_slit': historical_slit
            }

            # Add to grouped data (use float to preserve decimals)
            grouped_data[keyword]['keyword'] = keyword
            grouped_data[keyword]['materials'].append(material_record)
            grouped_data[keyword]['material_count'] += 1
            grouped_data[keyword]['current_stock'] += round(available_stock, 2)
            grouped_data[keyword]['total_to_be_delivered'] += round(to_be_delivered, 2)
            grouped_data[keyword]['total_reservations'] += round(reservations, 2)
            grouped_data[keyword]['total_final_stock'] += round(final_stock, 2)

        self.mrp_data = dict(grouped_data)

        logger.info(f"✓ Grouped into {len(self.mrp_data)} substrate families (keywords)")
        logger.info(f"✓ Total materials: {sum(g['material_count'] for g in self.mrp_data.values())}")

        return self

    def _get_material_master_data(self, material_id):
        """Get material master data for a given material ID"""
        master_row = self.material_master_df[self.material_master_df['MaterialID'] == material_id]

        if len(master_row) == 0:
            return {'keyword': 'UNKNOWN'}

        row = master_row.iloc[0]

        width_value = row.get('Material idth', '')
        width = f"{width_value} mm" if pd.notna(width_value) and width_value != '' else ''

        length_value = row.get('MaterialLength', '')
        length = f"{length_value} mm" if pd.notna(length_value) and length_value != '' else ''

        return {
            'supplier_keyword': str(row['SupplierKeyword']).strip() if pd.notna(row['SupplierKeyword']) else '',
            'keyword': str(row['MaterialKeyword']).strip() if pd.notna(row['MaterialKeyword']) else 'UNKNOWN',
            'width': width,
            'length': length,
            'ref_at_supplier': str(row['RefSupplier']) if pd.notna(row['RefSupplier']) else '',
            'description': str(row['MaterialDescription']) if pd.notna(row['MaterialDescription']) else '',
            'lead_time': str(int(row['LeadTime'])) if pd.notna(row['LeadTime']) else 'n/a',
            'safety_stock': int(row['MinStock']) if pd.notna(row['MinStock']) else 0
        }

    def _find_first_shortage_date(self, future_df, starting_stock):
        """Find the first date when a reservation causes negative stock"""
        if len(future_df) == 0:
            return None

        current_stock = starting_stock
        for _, row in future_df.iterrows():
            current_stock = current_stock + row['In'] - row['Out']
            if current_stock < 0:
                return row['Date']

        return None

    def _assess_historical_slit(self, historical_df):
        """Assess historical slit based on Correction movements"""
        if len(historical_df) == 0:
            return "No data"

        corrections = historical_df[
            historical_df['KindOfMovement'].str.contains('Correction', case=False, na=False)
        ]

        if len(corrections) == 0:
            return "No corrections"

        if (corrections['In'] > 0).any():
            return "Slit output"
        if (corrections['Out'] > 0).any():
            return "Consumed by slit"

        return "Corrections with no movement"

    def save_local_json(self):
        """Save grouped data to local JSON file"""
        logger.info("=" * 80)
        logger.info("SAVING LOCAL JSON BACKUP")
        logger.info("=" * 80)

        Path(OUTPUT_DIR).mkdir(exist_ok=True)

        # Simple structure: keyword -> materials array
        output_data = {}
        for keyword, data in self.mrp_data.items():
            output_data[keyword] = {
                'keyword': keyword,
                'materials': data['materials']
            }

        with open(OUTPUT_JSON, 'w') as f:
            json.dump(output_data, f, indent=2, default=str)

        logger.info(f"✓ Saved {len(output_data)} substrate families to {OUTPUT_JSON}")

        # Print file size
        file_size = Path(OUTPUT_JSON).stat().st_size
        logger.info(f"✓ File size: {file_size:,} bytes ({file_size/1024/1024:.2f} MB)")

        return self

    def upload_to_firestore(self):
        """Upload grouped data to Firestore using REST API"""
        logger.info("=" * 80)
        logger.info("UPLOADING TO FIRESTORE")
        logger.info("=" * 80)

        # Skip Firestore upload in test mode
        if self.filter_material_id:
            logger.info("🧪 TEST MODE: Skipping Firestore upload (local JSON only)")
            return self

        if self.db is None:
            logger.error("Firestore not initialized. Skipping upload.")
            return self

        try:
            base_url = f"https://firestore.googleapis.com/v1/projects/{self.firebase_project_id}/databases/(default)/documents/{FIRESTORE_COLLECTION}"

            # UPSERT: Use PATCH to create or update documents (no delete needed)
            logger.info("Starting upsert operation (create or update documents)...")

            # Upload/update documents
            total_written = 0
            total_keywords = len(self.mrp_data)

            for keyword, data in self.mrp_data.items():
                # Prepare document
                doc_data = {
                    'keyword': keyword,
                    'materials': data['materials']
                }

                # Upload document
                success = self._upload_document(base_url, keyword, doc_data)

                if success:
                    total_written += 1
                    if total_written % 100 == 0:
                        logger.info(f"  Uploaded {total_written}/{total_keywords} documents...")

            logger.info(f"✓ Successfully uploaded {total_written} substrate families to Firestore")

            return self

        except Exception as e:
            logger.error(f"Failed to upload to Firestore: {e}")
            raise

    def _upload_document(self, base_url, keyword, doc_data):
        """Upload a single document to Firestore using REST API"""
        try:
            # Sanitize keyword for document ID
            doc_id = keyword.replace('/', '_').replace(' ', '_')
            doc_url = f"{base_url}/{doc_id}"

            # Convert to Firestore format
            firestore_doc = self._convert_to_firestore_format(doc_data)

            headers = {
                "Authorization": f"Bearer {self.id_token}",
                "Content-Type": "application/json"
            }

            # Use PATCH to create or update
            response = requests.patch(
                doc_url,
                headers=headers,
                json={"fields": firestore_doc}
            )

            return response.status_code in [200, 201]

        except Exception as e:
            logger.error(f"Failed to upload document {keyword}: {e}")
            return False

    def _convert_to_firestore_format(self, data):
        """Convert Python dict to Firestore REST API format"""
        def convert_value(value):
            if value is None:
                return {"nullValue": None}
            elif isinstance(value, bool):
                return {"booleanValue": value}
            elif isinstance(value, int):
                return {"integerValue": str(value)}
            elif isinstance(value, float):
                return {"doubleValue": value}
            elif isinstance(value, str):
                return {"stringValue": value}
            elif isinstance(value, list):
                return {"arrayValue": {"values": [convert_value(v) for v in value]}}
            elif isinstance(value, dict):
                return {"mapValue": {"fields": {k: convert_value(v) for k, v in value.items()}}}
            else:
                return {"stringValue": str(value)}

        return {k: convert_value(v) for k, v in data.items()}

    def validate(self):
        """Validate the output data"""
        logger.info("=" * 80)
        logger.info("VALIDATE PHASE")
        logger.info("=" * 80)

        total_materials = sum(g['material_count'] for g in self.mrp_data.values())
        current_stock = sum(g['current_stock'] for g in self.mrp_data.values())
        total_reservations = sum(g['total_reservations'] for g in self.mrp_data.values())

        logger.info(f"✓ {len(self.mrp_data)} substrate families")
        logger.info(f"✓ {total_materials} total materials")
        logger.info(f"✓ {current_stock:,} current stock")
        logger.info(f"✓ {total_reservations:,} total reservations")

        # Check for unknown keywords
        unknown = self.mrp_data.get('UNKNOWN', None)
        if unknown:
            logger.warning(f"⚠  {unknown['material_count']} materials with UNKNOWN keyword")

        return self

    def run(self):
        """Execute the complete ETL pipeline"""
        logger.info("="*80)
        logger.info("MRP ETL PIPELINE - GROUPED BY SUBSTRATE FAMILY")
        logger.info("="*80)

        start_time = datetime.now()

        try:
            self.extract()
            self.transform()
            self.validate()
            self.save_local_json()
            self.upload_to_firestore()

            duration = (datetime.now() - start_time).total_seconds()
            logger.info("="*80)
            logger.info(f"✓ Pipeline completed successfully in {duration:.2f} seconds")
            logger.info("="*80)

            # Save execution summary
            self.save_execution_summary(start_time, duration)

            return self.mrp_data

        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            # Save error summary
            self.save_execution_summary(start_time, (datetime.now() - start_time).total_seconds(), error=str(e))
            raise

    def save_execution_summary(self, start_time, duration, error=None):
        """Save execution summary to markdown file"""
        try:
            summary_file = Path("last_data_prep_summary.md")

            # Count materials with shortages
            materials_with_shortages = sum(
                1 for data in self.mrp_data.values()
                for material in data['materials']
                if material.get('expected_date') is not None
            )

            # Count materials with low stock
            materials_low_stock = sum(
                1 for data in self.mrp_data.values()
                for material in data['materials']
                if material['final_stock'] < material['safety_stock']
            )

            # Top families by stock
            top_families = sorted(
                [(k, v['current_stock']) for k, v in self.mrp_data.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10]

            # Top families by reservations
            top_reservations = sorted(
                [(k, v['total_reservations']) for k, v in self.mrp_data.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10]

            summary = f"""# Data Preparation Execution Summary

## Run Information

- **Execution Time**: {start_time.strftime('%Y-%m-%d %H:%M:%S')}
- **Duration**: {duration:.2f} seconds ({duration/60:.1f} minutes)
- **Status**: {"✅ SUCCESS" if not error else "❌ FAILED"}
- **Authenticated As**: {self.firebase_email if hasattr(self, 'firebase_email') else 'N/A'}
- **Project**: {self.firebase_project_id if hasattr(self, 'firebase_project_id') else 'N/A'}

"""

            if error:
                summary += f"""## Error Details

```
{error}
```

"""
            else:
                summary += f"""## Processing Statistics

### Input Data
- **Movement Rows Processed**: {len(self.movements_df):,}
- **Material Master Records**: {len(self.material_master_df):,}
- **Unique Materials**: {self.movements_df['MaterialID'].nunique():,}

### Output Data
- **Substrate Families**: {len(self.mrp_data):,}
- **Total Materials Processed**: {sum(g['material_count'] for g in self.mrp_data.values()):,}
- **Current Stock**: {sum(g['current_stock'] for g in self.mrp_data.values()):,} units
- **Total Reservations**: {sum(g['total_reservations'] for g in self.mrp_data.values()):,} units
- **Final Available Stock**: {sum(g['total_final_stock'] for g in self.mrp_data.values()):,} units

### Alerts
- **Materials with Shortages**: {materials_with_shortages}
- **Materials Below Safety Stock**: {materials_low_stock}
- **Unknown Keywords**: {self.mrp_data.get('UNKNOWN', {}).get('material_count', 0)}

## Firestore Upload

- **Collection**: `stock_management`
- **Documents Uploaded**: {len(self.mrp_data):,}
- **Upload Status**: {"✅ Completed" if self.db else "⚠️ Skipped (no connection)"}

## Top 10 Substrate Families by Stock

| Keyword | Current Stock |
|---------|-------------|
"""
                for keyword, stock in top_families:
                    summary += f"| {keyword} | {stock:,} |\n"

                summary += f"""
## Top 10 Substrate Families by Reservations

| Keyword | Total Reservations |
|---------|-------------------|
"""
                for keyword, reservations in top_reservations:
                    summary += f"| {keyword} | {reservations:,} |\n"

                summary += f"""
## Output Files

- **Local JSON Backup**: `output/mrp_summary.json` ({Path('output/mrp_summary.json').stat().st_size / 1024 / 1024:.2f} MB)
- **Firestore Collection**: `stock_management` ({len(self.mrp_data):,} documents)

## Data Structure

```json
{{
  "keyword": "Substrate family identifier",
  "materials": [
    {{
      "material_id": "Material ID",
      "supplier_keyword": "Supplier name",
      "width": "Width with unit",
      "length": "Length with unit",
      "ref_at_supplier": "Supplier reference",
      "description": "Material description",
      "lead_time": "Lead time in days",
      "safety_stock": "Minimum stock level",
      "current_stock": "Current stock",
      "reservations": "Future reservations",
      "final_stock": "Available after reservations",
      "expected_date": "First shortage date (if any)",
      "historical_slit": "Slit history assessment"
    }}
  ]
}}
```

---

*Generated by MRP ETL Pipeline v1.0*
*Next scheduled run: Daily at 2:00 AM UTC*
"""

            with open(summary_file, 'w', encoding='utf-8') as f:
                f.write(summary)

            logger.info(f"✓ Saved execution summary to {summary_file}")

            # Copy to public folder for web access
            try:
                public_folder = Path("../public/Data_preparation")
                public_folder.mkdir(parents=True, exist_ok=True)
                import shutil
                shutil.copy(summary_file, public_folder / summary_file.name)
                logger.info(f"✓ Copied summary to public folder for web access")
            except Exception as copy_err:
                logger.warning(f"Could not copy to public folder: {copy_err}")

        except Exception as e:
            logger.warning(f"Failed to save execution summary: {e}")


def main():
    """Main entry point"""
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description='MRP ETL Pipeline - Process material stock movements grouped by substrate family',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process all materials (default)
  python3 mrp_pipeline.py

  # Process only a specific material ID for testing
  python3 mrp_pipeline.py --material-id 100026

  # Debug a specific material
  python3 mrp_pipeline.py -m 100059
        """
    )

    parser.add_argument(
        '--material-id', '-m',
        type=str,
        help='Optional: Filter to process only a specific material ID (for testing/debugging)',
        default=None
    )

    args = parser.parse_args()

    # Convert material_id to int if provided
    filter_material_id = None
    if args.material_id:
        try:
            filter_material_id = int(args.material_id)
            logger.info(f"🎯 Running in TEST MODE: Processing only Material ID = {filter_material_id}")
        except ValueError:
            logger.error(f"Invalid material ID: {args.material_id}. Must be an integer.")
            return None

    # Run pipeline with optional filter
    pipeline = MRPPipeline(filter_material_id=filter_material_id)
    result = pipeline.run()

    # Print summary
    print("\n" + "="*80)
    if filter_material_id:
        print(f"TEST MODE SUMMARY - Material ID: {filter_material_id}")
        print("="*80)

        # Find and print detailed information for the filtered material
        for keyword, data in result.items():
            for material in data['materials']:
                if int(material['material_id']) == filter_material_id:
                    print(f"\n📦 Material Details:")
                    print(f"  Material ID:        {material['material_id']}")
                    print(f"  Substrate Family:   {keyword}")
                    print(f"  Supplier:           {material['supplier_keyword']}")
                    print(f"  Description:        {material['description']}")
                    print(f"  Width:              {material['width']}")
                    print(f"  Length:             {material['length']}")
                    print(f"  Ref at Supplier:    {material['ref_at_supplier']}")
                    print(f"  Lead Time:          {material['lead_time']} days")
                    print(f"\n📊 Stock Information:")
                    print(f"  Safety Stock:       {material['safety_stock']:.2f}")
                    print(f"  Current Stock:      {material['current_stock']:.2f}")
                    print(f"  To Be Delivered:    {material['to_be_delivered']:.2f}")
                    print(f"  Reservations:       {material['reservations']:.2f}")
                    print(f"  Final Stock:        {material['final_stock']:.2f}  (= {material['current_stock']:.2f} + {material['to_be_delivered']:.2f} - {material['reservations']:.2f})")
                    print(f"  Expected Date:      {material['expected_date'] or 'No shortage'}")
                    print(f"  Historical Slit:    {material['historical_slit']}")

                    # Stock status indicator
                    if material['final_stock'] < 0:
                        print(f"\n⚠️  WARNING: Stock shortage detected! ({material['final_stock']})")
                    elif material['final_stock'] < material['safety_stock']:
                        print(f"\n⚠️  WARNING: Below safety stock level!")
                    else:
                        print(f"\n✅ Stock level is healthy")

                    break
    else:
        print("SUMMARY BY SUBSTRATE FAMILY")
        print("="*80)
        print(f"{'Keyword':<30} {'Materials':>10} {'Stock':>15} {'Reservations':>15} {'Final':>15}")
        print("-"*80)

        for keyword in sorted(result.keys())[:20]:  # Show first 20
            data = result[keyword]
            print(f"{keyword:<30} {data['material_count']:>10} {data['current_stock']:>15.2f} "
                  f"{data['total_reservations']:>15.2f} {data['total_final_stock']:>15.2f}")

        if len(result) > 20:
            print(f"... and {len(result) - 20} more substrate families")

    print("="*80 + "\n")

    return result


if __name__ == "__main__":
    main()
