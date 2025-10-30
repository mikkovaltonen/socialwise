# MaterialStockMovements aggregation at the Material Requirements Planning (MRP) level

The target is to aggregate data from **MaterialStockMovements.xlsx** and enrich the aggregates with material attributes from **MaterialModule.xlsx**.

Read material stock movements and aggregate the data into the following target structure:

| Material ID | Supplier Keyword | Keyword | Width | Length | Ref. at Supplier | Description | Lead Time | Min Stock | Current Stock | To Be Delivered | Reservations | Final Stock | Expected Date | Historical Slit |
|---|---:|---:|---:|---|---|
| 100026 | 198 | 0 | 157 | 41 | # | No corrections |

**Column definitions**

- **Material ID**: The only key. Comes from the `MaterialID` column in the source Excel file `MaterialStockMovement.xlsx`.
- **Supplier Keyword**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Keyword**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Width**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Length**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Ref. at Supplier**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Description**: Field `MaterialDescription`, read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Lead Time**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Min Stock**: Read from `MaterialModule.xlsx` and joined with `Material ID`.
- **Current Stock**: The current stock level calculated from `MaterialStockMovement.xlsx`. If historical movements exist, uses `StockAfter` from the last historical movement. If only future movements exist, uses `StockBefore` from the first future movement.
- **To Be Delivered**: The total sum of **ALL** future incoming movements (`In` column sum for future dates). Includes: Purchase Orders (on time/late), Deliveries, Goods returned, Corrections (with In), and any other movements that increase stock.
- **Reservations**: The total sum of **ALL** future outgoing movements (`Out` column sum for future dates). Includes: Reservations (on time/late), Consumption, Material waste, Corrections (with Out), and any other movements that decrease stock.
- **Final Stock**: Calculated as **Current Stock + To Be Delivered − Reservations**. This represents the expected stock after all future incoming and outgoing movements.
- **Expected Date**: The first date (YYYY-MM-DD format, without time) when stock goes negative in the future timeline. Determined by chronologically simulating all future movements and detecting when `StockAfter < 0`. Returns `null` if no shortage is expected.
- **Historical Slit**: Assessment of past `KindOfMovement` values in `MaterialStockMovement.xlsx`.  
  - If a movement with `Correction` led to a positive **In**, then **Historical Slit** = “Slit output”.  
  - If a movement with `Correction` led to a positive **Out**, then **Historical Slit** = “Consumed by slit”.

**Output & loading**

- Store the output as **JSON** in **Google Firestore**, collection **`stock_management`**.
- The loader authenticates to Firestore using a **username and password** stored in **environment variables**.
- Perform a **full reload** and delete old records from the collection when running.

---

## Implementation

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

**Setup Firestore Credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `valmet-buyer`
3. Navigate to: **Project Settings** → **Service Accounts**
4. Click: **Generate New Private Key**
5. Download the JSON file
6. Save as: `firebase-service-account.json` in the `Data_preparation/` directory

**Note:** The existing `.env` file contains `VITE_*` credentials for the frontend app. The Python pipeline requires Firebase Admin SDK credentials (service account) for Firestore write access.

### Running the Pipeline

**Process all materials (production mode):**
```bash
python3 mrp_pipeline.py
```

**Test with a specific material ID (debug mode):**
```bash
# Test with material ID 100026
python3 mrp_pipeline.py --material-id 100026

# Or use short form
python3 mrp_pipeline.py -m 106910
```

**Test mode features:**
- Processes only the specified material ID
- Shows detailed material information and movement history
- Shows decimal values with 2-digit precision
- Skips Firestore upload (local JSON only)
- Faster execution for debugging
- Shows stock status warnings

### Decimal Handling

The pipeline automatically handles European decimal format (comma as separator):
- Input: `1,32` → Converted to: `1.32`
- Works for: `In`, `Out`, `StockBefore`, `StockAfter` columns
- All stock values stored with 2 decimal precision
- Test script available: `test_decimal_parsing.py`

This will:
1. Extract data from `MaterialStockMovement.xlsx` and `MaterialModule.xlsx`
2. Aggregate and join the data
3. Full reload to Firestore collection `stock_management` (skipped in test mode)
4. Save backup to `output/mrp_summary.json`

### Output Structure (JSON)

**Grouped by Substrate Family (Keyword)**

The data is structured with **keyword as header level** and **materials as item level**:

```json
{
  "_MAD_GF_0033": {
    "keyword": "_MAD_GF_0033",
    "material_count": 1,
    "current_stock": 198,
    "total_to_be_delivered": 0,
    "total_reservations": 157,
    "total_final_stock": 41,
    "materials": [
      {
        "material_id": "100026",
        "supplier_keyword": "VINK PLAST",
        "width": "700.0 mm",
        "length": "1000.0 mm",
        "ref_at_supplier": "Oracal 1640G White brillant",
        "description": "PVC + ADH 001 135 700 x 1000",
        "lead_time": "10",
        "safety_stock": 0,
        "current_stock": 198,
        "to_be_delivered": 0,
        "reservations": 157,
        "final_stock": 41,
        "expected_date": null,
        "historical_slit": "No corrections"
      }
    ],
    "updated_at": "2025-10-29T11:10:59.998793",
    "pipeline_version": "1.0"
  },
  "_MAD_GR_0083": {
    "keyword": "_MAD_GR_0083",
    "material_count": 7,
    "current_stock": 9859,
    "total_to_be_delivered": 500,
    "total_reservations": 6563,
    "total_final_stock": 3796,
    "materials": [
      { "material_id": "100059", ... },
      { "material_id": "100701", ... }
    ]
  }
}
```

### Firestore Collection Structure

- **Collection**: `stock_management`
- **Document ID**: Substrate family keyword (e.g., `_MAD_GF_0033`)
- **Document Fields**:
  - `keyword`: Substrate family identifier
  - `materials`: Array of material objects
  - `material_count`: Total materials in this family
  - `current_stock`: Sum of all material stocks (current, available)
  - `total_to_be_delivered`: Sum of all future deliveries/purchase orders
  - `total_reservations`: Sum of all future reservations
  - `total_final_stock`: Sum of all final stocks (stock + deliveries - reservations)
  - `updated_at`: Pipeline execution timestamp
  - `pipeline_version`: Version identifier
