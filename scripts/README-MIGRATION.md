# CRM Data Migration Script

This script merges customer data with service history and uploads to Firestore.

## Overview

The migration script:
1. ✅ Reads `customer_data.xlsx` (customer information)
2. ✅ Reads `housing_company_history_data.xlsx` (service history)
3. ✅ Merges data based on `tampuurinumero` (unique customer ID)
4. ✅ Normalizes field names (lowercase, no special chars)
5. ✅ Saves merged data as JSON
6. ✅ Uploads to Firestore collection `crm_asikkaat_ja_palveluhistoria`

## Prerequisites

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure Firebase authentication** in `.env`:
   ```env
   DB_USERNAME=your-email@example.com
   DB_PASSWORD=your-password
   ```

   The script uses Firebase email/password authentication. Make sure:
   - You have a Firebase user account with write permissions
   - The `DB_USERNAME` and `DB_PASSWORD` are set in `.env` file

## Data Structure

### Input Files

**customer_data.xlsx**
- Contains customer information
- Must have a column for `tampuurinumero` (or `Tampuuri numero`)

**housing_company_history_data.xlsx**
- Contains service history records
- Must have a column for `tampuurinumero` (or `Tampuuri numero`)

### Output Structure

Each document in Firestore will have:
```json
{
  "tampuurinumero": "12345",
  "customerInfo": {
    "field1": "value1",
    "field2": "value2",
    ...
  },
  "serviceHistory": {
    "field1": "value1",
    "field2": "value2",
    ...
  },
  "mergedAt": "2025-01-05T14:30:00.000Z"
}
```

- **Document ID**: `tampuurinumero` (customer ID)
- **customerInfo**: All fields from customer_data.xlsx (normalized)
- **serviceHistory**: All fields from housing_company_history_data.xlsx (normalized)
- **mergedAt**: Timestamp of merge operation

## Usage

### Step 1: Update .env with credentials

Make sure these lines exist in your `.env` file:
```env
DB_USERNAME=admin@retta.fi
DB_PASSWORD=your-password
```

### Step 2: Run the migration

```bash
npm run migrate:crm
```

This will:
1. Read both Excel files from `Data_preparation/` folder
2. Merge the data
3. Save to `Data_preparation/merged_crm_data.json`
4. Upload to Firestore (if credentials are set)

### Step 3: Verify the migration

Check Firestore console:
- Collection: `crm_asikkaat_ja_palveluhistoria`
- Documents should use `tampuurinumero` as document ID
- Each document contains `customerInfo`, `serviceHistory`, and `mergedAt`

## Field Normalization

Field names are normalized to:
- Lowercase
- Spaces replaced with underscores
- Finnish characters (ä, ö, å) converted to ASCII
- Special characters removed

Examples:
- `Tampuuri numero` → `tampuurinumero` or `tampuuri_numero`
- `Asiakkaan nimi` → `asiakkaan_nimi`
- `Osoite` → `osoite`

## Troubleshooting

### Missing tampuurinumero

If a record is missing `tampuurinumero`:
- The script will log a warning
- The record will be skipped
- Check the Excel files to ensure all rows have this field

### Authentication failed

If you get authentication errors:
- Verify `DB_USERNAME` and `DB_PASSWORD` in `.env`
- Make sure the user exists in Firebase Authentication
- Ensure the user has write permissions in Firestore

### File not found

If Excel files are not found:
- Check that files exist in `Data_preparation/` folder:
  - `customer_data.xlsx`
  - `housing_company_history_data.xlsx`
- Verify the file names match exactly (case-sensitive)

## Output Files

- **merged_crm_data.json**: Local backup of merged data
  - Located in `Data_preparation/merged_crm_data.json`
  - Array of all merged records
  - Use this to verify data before upload

## Script Options

### Skip Firestore upload

If you only want to merge and save JSON without uploading:
1. Remove or comment out `DB_USERNAME` and `DB_PASSWORD` in `.env`
2. Run the script - it will merge and save JSON only

### Manual JSON upload

If you want to upload the JSON file manually:
1. Run the script without auth credentials (creates JSON)
2. Review `Data_preparation/merged_crm_data.json`
3. Add credentials to `.env`
4. Run the script again to upload

## Firestore Collection Structure

**Collection**: `crm_asikkaat_ja_palveluhistoria`

**Document ID**: `tampuurinumero` (e.g., "12345")

**Fields**:
- `tampuurinumero`: string
- `customerInfo`: object (all customer fields)
- `serviceHistory`: object (all history fields)
- `mergedAt`: timestamp

## Example

```bash
# 1. Verify credentials in .env
# DB_USERNAME=admin@retta.fi
# DB_PASSWORD=your-secure-password

# 2. Run migration
npm run migrate:crm

# Output:
# 🚀 Starting CRM data migration...
# 📖 Reading Excel file: customer_data.xlsx
# ✅ Read 150 rows from customer_data.xlsx
# 📖 Reading Excel file: housing_company_history_data.xlsx
# ✅ Read 120 rows from housing_company_history_data.xlsx
# 🔄 Merging customer data with service history...
# ✅ Merged 150 records
# 💾 Saved merged data to: Data_preparation/merged_crm_data.json
# 📊 Total records: 150
# 🔐 Authenticating with Firebase...
# ✅ Authentication successful
# ☁️  Uploading to Firestore collection: crm_asikkaat_ja_palveluhistoria
# 📤 Uploaded 10/150 documents...
# 📤 Uploaded 20/150 documents...
# ...
# ✅ Upload complete: 150 successful, 0 errors
# 🎉 Migration completed successfully!
```

## Security Notes

⚠️ **Important**:
- Never commit `.env` file with real credentials
- Use environment variables in production
- Limit Firebase user permissions to minimum required
- Review merged data before uploading to production Firestore

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify Excel file structure (column names)
3. Review `merged_crm_data.json` for data quality
4. Check Firebase Authentication and Firestore rules
