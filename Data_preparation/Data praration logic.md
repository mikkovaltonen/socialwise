# MaterialStockMovements aggregation at the Material Requirements Planning (MRP) level

The target is to aggregate data from **MaterialStockMovements.xlsx** and enrich the aggregates with material attributes from **MaterialModule.xlsx**.

Read material stock movements and aggregate the data into the following target structure:

| Material ID | Supplier Keyword | Keyword | Width | Length | Ref. at Supplier | Description | Lead Time | Min Stock | Available (In Stock) | Reservations | Final Stock | Expected Date | Historical Slit |
|---|---:|---:|---:|---|---|
| 100026 | 198 | 157 | 41 | # | No corrections |

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
- **Available (In Stock)**: The value of `StockAfter` after the last historical movement and before the first future reservation, from `MaterialStockMovement.xlsx`.
- **Reservations**: The total sum where `KindOfMovement = "Reservation"` in `MaterialStockMovement.xlsx`.
- **Final Stock**: Calculated as **Available (In Stock) − Reservations**. This should match the `StockAfter` value of the last movement in `MaterialStockMovement.xlsx`.
- **Expected Date**: In case of a future shortage, this is the date when the first shortage occurs. Determined by identifying the first `Reservation` that causes a negative `StockAfter` value.
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

```bash
python3 mrp_pipeline.py
```

This will:
1. Extract data from `MaterialStockMovement.xlsx` and `MaterialModule.xlsx`
2. Aggregate and join the data
3. Full reload to Firestore collection `stock_management`
4. Save backup to `output/mrp_summary.json`

### Output Structure (JSON)

**Grouped by Substrate Family (Keyword)**

The data is structured with **keyword as header level** and **materials as item level**:

```json
{
  "_MAD_GF_0033": {
    "keyword": "_MAD_GF_0033",
    "material_count": 1,
    "total_stock": 198,
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
        "total_stock": 198,
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
    "total_stock": 9859,
    "total_reservations": 6563,
    "total_final_stock": 3296,
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
  - `total_stock`: Sum of all material stocks
  - `total_reservations`: Sum of all reservations
  - `total_final_stock`: Sum of all final stocks
  - `updated_at`: Pipeline execution timestamp
  - `pipeline_version`: Version identifier
