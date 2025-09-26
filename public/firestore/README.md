# Firestore Data Migration Guide

## Overview

This directory contains Excel files and migration scripts to import data into Firestore collections.

## Files

### Source Data (Excel)
- `Invoices 2023 Training subcategory.xlsx` - Training invoice data from 2023
- `iPRO conrtacts.xlsx` - iPRO contract information
- `Training_suppliers_training_attributes.xlsx` - Training supplier details and attributes

### Generated Files (JSON)
- `invoices_2023_training.json` - Converted invoice data
- `ipro_contracts.json` - Converted contract data
- `training_suppliers_attributes.json` - Converted training supplier data

### Migration Scripts
- `convert_excel_to_json.py` - Python script to convert Excel to JSON
- `migrate_to_firestore.js` - JavaScript migration script for Firestore

## Migration Process

### Step 1: Convert Excel to JSON

```bash
# Install Python dependencies
pip install pandas openpyxl

# Run conversion script
python3 convert_excel_to_json.py
```

This will create JSON files from the Excel data with proper formatting for Firestore.

### Step 2: Configure Firebase

Ensure your `.env` file contains the necessary Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=valmet-buyer.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=valmet-buyer
VITE_FIREBASE_STORAGE_BUCKET=valmet-buyer.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=737944042802
VITE_FIREBASE_APP_ID=your-app-id-here
```

### Step 3: Run Migration to Firestore

```bash
# From the project root directory
node migrate_to_firestore.js
```

## Firestore Collections

The migration creates the following collections:

### `invoices_training_2023`
Contains training invoice data with fields:
- `ERP_ID` - ERP system identifier
- `Invoice_ID` - Unique invoice number
- `Status` - Invoice status (Completed, etc.)
- `Business_Partner` - Supplier/vendor name
- `Net_Amount` - Invoice amount
- `Reporting_Currency` - Currency code
- `Invoice_Date` - Date of invoice
- `Type_Description` - Invoice type
- `Approver` - Person who approved
- `Reviewer` - Person who reviewed
- `URL_Link` - Link to invoice in Basware

### `ipro_contracts`
Contains iPRO contract data with fields specific to contract management.

### `training_suppliers`
Contains training supplier information with fields:
- Company name and supplier code
- Training supplier status (Y/N)
- Pricing information (per day in EUR)
- Country and delivery locations
- Contract availability
- Classification (A/B/C)
- Nature of service and training areas
- HSE training provider status
- Valmet contact persons
- Basware catalog status
- Preferred supplier status

## Data Structure

Each document includes metadata fields:
- `_importedAt` - Original import timestamp from Excel
- `_sourceFile` - Source Excel filename
- `_sheetName` - Excel sheet name
- `_rowIndex` - Original row number
- `_migratedAt` - Firestore migration timestamp

## Document IDs

Documents are assigned IDs based on:
1. Existing ID fields (if present)
2. Invoice/Contract numbers
3. Supplier codes
4. Auto-generated from sheet name and row index

## Security Rules

After migration, configure Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Invoice data - read access for authenticated users
    match /invoices_training_2023/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.email.matches('.*@valmet.com');
    }

    // Contract data - restricted access
    match /ipro_contracts/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.auth.token.email.matches('.*@valmet.com');
    }
  }
}
```

## Verification

After migration:
1. Check Firestore Console: https://console.firebase.google.com/project/valmet-buyer/firestore
2. Verify document counts match source data
3. Test data retrieval in application
4. Set up any required indexes for queries

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Ensure Firebase API key is correct in `.env`
   - Check Firebase project settings

2. **Permission Denied**
   - Update Firestore security rules
   - Ensure user has write permissions

3. **JSON Files Not Found**
   - Run `python3 convert_excel_to_json.py` first
   - Check that Excel files exist in this directory

4. **Module Not Found**
   - Install dependencies: `npm install firebase dotenv`
   - For Python: `pip install pandas openpyxl`

## Data Summary

- **Invoices 2023 Training**: 587 records
- **iPRO Contracts**: 104 records
- **Training Suppliers**: 100 records
- **Total Documents**: 791

## Support

For issues or questions, contact the development team or check the project documentation.