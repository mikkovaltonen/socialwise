# CRM Data Preparation - Functional Specification

## Overview

This document describes the data preparation workflow for merging customer data with service history and uploading to Firestore for use in the Massify mass proposal generation platform.

## Purpose

**Business Goal**: Enable AI-powered mass tailored proposal generation by combining customer information with service history in a single, normalized database.

**Technical Goal**: Merge two Excel datasets into a unified JSON structure, then migrate to Firestore with `tampuurinumero` as the document ID.

## Data Sources

### 1. Customer Data (`customer_data.xlsx`)

**File**: `/Data_preparation/customer_data.xlsx`
**Records**: 6,462 customer records
**Primary Key**: `Tampuuri tunnus` (Customer ID)

#### Key Fields:
- **Tampuuri tunnus**: Unique customer identifier (required)
- **Account Name**: Customer/building name
- **Y-tunnus**: Finnish business ID
- **Address fields**: Katuosoite, Postal code, City
- **Contact info**: Isännöitsijä (property manager), Email
- **Building info**: Rakennusten lukumäärä, Huoneistojen lukumäärä
- **Dates**: Käyttöönottopäivä, Asiakkuus alkanut
- **Metadata**: Account ID, Row Checksum, Modified On

#### Sample Record:
```json
{
  "Tampuuri tunnus": "143051003",
  "Account Name": "Lammin paloasema",
  "Y-tunnus": "0146921-4",
  "Katuosoite": "Mommilantie 24",
  "Postal code": "16900",
  "City": "Lammi",
  "Isännöitsijä": "Satu Rajala",
  "Primary Email (Isännöitsijä) (User)": "satu.rajala@retta.fi",
  "Huoneistojen lukumäärä": 2,
  "Rakennusten lukumäärä": 0
}
```

### 2. Service History Data (`housing_company_history_data.xlsx`)

**File**: `/Data_preparation/housing_company_history_data.xlsx`
**Records**: 4,043 service history records
**Primary Key**: **MISSING** - needs `Tampuuri tunnus` field

#### Key Fields:
- **Code**: Service code
- **Nimi**: Service name
- **LTMPName**: Long-term maintenance plan name
- **Toimenpide**: Action/procedure
- **TarkkaKuvaus**: Detailed description
- **Status**: Service status
- **AlkamisPvm**: Start date
- **PäättymisPvm**: End date
- **Kustannusarvio**: Cost estimate
- **ToteutunutKustannus**: Actual cost
- **TasoaParantava**: Quality improvement flag

#### ⚠️ Critical Issue:
**The service history file is MISSING the `Tampuuri tunnus` field**, which is required to link service history to customers. This must be fixed before service history can be merged.

## Data Processing Workflow

### 1. Extract

```typescript
// Read Excel files
const customerData = readExcelFile('customer_data.xlsx');
const historyData = readExcelFile('housing_company_history_data.xlsx');
```

- Uses `xlsx` library to read Excel files
- Converts each sheet to JSON array
- Preserves all original field names and values

### 2. Transform

#### Field Normalization
All field names are normalized to:
- Lowercase
- Spaces → underscores
- Finnish characters → ASCII (ä→a, ö→o, å→a)
- Special characters removed

**Examples**:
- `Tampuuri tunnus` → `tampuuri_tunnus`
- `Y-tunnus` → `ytunnus`
- `Isännöitsijä` → `isannoitsija`
- `Käyttöönottopäivä` → `kayttoonottoppaiva`

#### Merge Logic
```typescript
for (const customer of customerData) {
  const tampuurinumero = getTampuurinumero(customer);

  if (tampuurinumero) {
    merged.set(tampuurinumero, {
      tampuurinumero,
      customerInfo: normalizeObject(customer),
      serviceHistory: {},
      mergedAt: new Date().toISOString()
    });
  }
}

for (const history of historyData) {
  const tampuurinumero = getTampuurinumero(history);

  if (tampuurinumero && merged.has(tampuurinumero)) {
    merged.get(tampuurinumero).serviceHistory = normalizeObject(history);
  }
}
```

**Matching Strategy**:
- Primary key: `tampuurinumero`
- Field name variations supported:
  - `tampuurinumero`
  - `tampuuri_numero`
  - `tampuuri_tunnus`
  - `tampuuritunnus`

### 3. Load

#### JSON Output
```json
{
  "tampuurinumero": "143051003",
  "customerInfo": {
    "account_name": "Lammin paloasema",
    "ytunnus": "0146921-4",
    "katuosoite": "Mommilantie 24",
    "postal_code": "16900",
    "city": "Lammi",
    "isannoitsija": "Satu Rajala",
    "huoneistojen_luku": 2
  },
  "serviceHistory": {},
  "mergedAt": "2025-11-05T17:43:00.000Z"
}
```

#### Firestore Upload
- **Collection**: `crm_asikkaat_ja_palveluhistoria`
- **Document ID**: `tampuurinumero`
- **Authentication**: Email/password via Firebase Auth
- **Batch size**: Individual document uploads with progress tracking

## Output Specification

### File Structure

```
Data_preparation/
├── customer_data.xlsx           # Source: Customer data
├── housing_company_history_data.xlsx  # Source: Service history
├── merged_crm_data.json         # Output: Merged data
├── runlog.md                    # Output: Migration log
├── data_prep.md                 # This file: Functional specs
└── migration-run.log            # Output: Console log
```

### Firestore Collection

**Collection Name**: `crm_asikkaat_ja_palveluhistoria`

**Document Structure**:
```
crm_asikkaat_ja_palveluhistoria/
  {tampuurinumero}/
    - tampuurinumero: string
    - customerInfo: object
    - serviceHistory: object
    - mergedAt: timestamp
```

## Data Quality Requirements

### Required Fields

| Field | Source | Required | Validation |
|-------|--------|----------|------------|
| tampuurinumero | Both | Yes | Must be unique, non-empty |
| customerInfo | customer_data.xlsx | Yes | Must have at least 1 field |
| serviceHistory | housing_company_history_data.xlsx | No | Empty if no match |
| mergedAt | Generated | Yes | ISO 8601 timestamp |

### Data Integrity Rules

1. **Uniqueness**: Each `tampuurinumero` appears once in output
2. **Completeness**: All customer records with `tampuurinumero` are included
3. **Traceability**: `mergedAt` timestamp tracks when data was merged
4. **Normalization**: All field names follow normalization rules

### Handling Edge Cases

| Case | Behavior |
|------|----------|
| Customer without tampuurinumero | Skip record, log warning |
| History without tampuurinumero | Skip record, log warning |
| Customer with no history match | Include with empty serviceHistory |
| Duplicate tampuurinumero | Last one wins (overwrites) |
| Empty Excel file | Error and exit |
| Missing Excel file | Error and exit |

## Technical Architecture

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Excel Parser**: `xlsx` library
- **Database**: Firebase Firestore
- **Authentication**: Firebase Email/Password Auth
- **Environment**: Vite development environment

### Dependencies

```json
{
  "xlsx": "^0.18.5",
  "firebase": "^11.9.0",
  "dotenv": "^16.6.1",
  "tsx": "^4.20.6"
}
```

### Environment Variables

```env
# Firebase Config
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=retta-laskutusapuri.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=retta-laskutusapuri
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Database Credentials
DB_USERNAME=admin@retta.fi
DB_PASSWORD=your-password
```

## Migration Script Usage

### Command

```bash
npm run migrate:crm
```

### Execution Flow

1. ✅ Load environment variables from `.env`
2. ✅ Read `customer_data.xlsx` → Parse to JSON
3. ✅ Read `housing_company_history_data.xlsx` → Parse to JSON
4. ✅ Merge data by `tampuurinumero`
5. ✅ Normalize all field names
6. ✅ Save merged data to `merged_crm_data.json`
7. ⏸️ Authenticate with Firebase (if credentials provided)
8. ⏸️ Upload to Firestore collection `crm_asikkaat_ja_palveluhistoria`
9. ✅ Generate migration log

### Success Criteria

- [x] Read customer data successfully
- [x] Read service history successfully
- [x] Merge data by tampuurinumero
- [x] Normalize field names
- [x] Save JSON file
- [ ] Upload to Firestore (pending valid credentials)

## Current Status

### ✅ Completed

- Customer data extraction (6,462 records)
- Service history extraction (4,043 records)
- Data merging (6,433 records)
- Field normalization
- JSON output generation
- Migration logging

### ⚠️ Issues

1. **Service History Not Linked**
   - Cause: Missing `tampuurinumero` in service history Excel
   - Impact: All 4,043 service history records skipped
   - Fix: Add `Tampuuri tunnus` column to Excel file

2. **Firestore Upload Failed**
   - Cause: Invalid Firebase Auth credentials
   - Impact: Data not uploaded to cloud
   - Fix: Update `DB_USERNAME`/`DB_PASSWORD` in `.env`

3. **26 Customer Records Skipped**
   - Cause: Missing `tampuurinumero` field
   - Impact: Minor data loss (0.4%)
   - Fix: Review source data and add missing IDs

## Next Steps

### Immediate Actions

1. **Fix Service History Excel File**
   - Add `Tampuuri tunnus` column
   - Populate with correct customer IDs
   - Re-run migration

2. **Fix Firebase Authentication**
   - Create user `admin@retta.fi` in Firebase Auth
   - OR update `.env` with valid credentials
   - Re-run migration

3. **Review Merged Data**
   - Open `merged_crm_data.json`
   - Verify data quality
   - Check field normalization

### Future Enhancements

1. **Incremental Updates**
   - Detect changes since last migration
   - Only update modified records

2. **Data Validation**
   - Add schema validation
   - Validate email formats, dates, etc.

3. **Error Handling**
   - Retry failed Firestore uploads
   - Better logging for skipped records

4. **Performance**
   - Batch Firestore uploads (500 at a time)
   - Add progress bar
   - Parallel processing

## Integration with Massify

### Use Case: Mass Proposal Generation

1. **Lead Identification**
   - Query Firestore for customers matching campaign criteria
   - Filter by location, building type, service history, etc.

2. **Personalization**
   - Use `customerInfo` for proposal personalization
   - Reference `serviceHistory` for context

3. **Price Calculation**
   - Calculate prices based on:
     - Huoneistojen lukumäärä (number of apartments)
     - Rakennusten lukumäärä (number of buildings)
     - Service history complexity

4. **Campaign Execution**
   - Generate personalized proposals for thousands
   - Send via email with PDF attachments
   - Track in CRM

## Support & Troubleshooting

### Common Issues

**Q: Migration says "0 records merged"**
- A: Check that Excel files have `Tampuuri tunnus` column
- A: Verify field name normalization is working

**Q: Firestore upload fails with auth error**
- A: Check `DB_USERNAME` and `DB_PASSWORD` in `.env`
- A: Verify user exists in Firebase Authentication

**Q: Some records are skipped**
- A: Check console warnings for missing fields
- A: Review source Excel data for completeness

### Logs & Debugging

- **Migration Log**: `Data_preparation/runlog.md`
- **Console Log**: `Data_preparation/migration-run.log`
- **Output Data**: `Data_preparation/merged_crm_data.json`
- **Script Location**: `scripts/migrate-crm-data.ts`

### Contact

For issues or questions about the migration:
- Review documentation: `scripts/README-MIGRATION.md`
- Check logs: `Data_preparation/runlog.md`
- Inspect output: `Data_preparation/merged_crm_data.json`

---

**Document Version**: 1.0
**Last Updated**: 2025-11-05
**Status**: Migration script operational, Firestore upload pending
