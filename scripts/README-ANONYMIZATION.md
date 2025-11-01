# Stock Management Data Anonymization Script

This script creates a public-safe version of your stock management data by copying from `stock_management` to `public_stock_management` collection with anonymized sensitive information.

## What Gets Anonymized

| Field | Original | Anonymized | Consistency |
|-------|----------|------------|-------------|
| `supplier_keyword` | "AVERY DENN" | "SUPPLIER_001" | ✅ Same supplier always gets same ID |
| `keyword` (substrate family) | "_MAD_GR_0209" | "SF_12345" | ✅ Same family always gets same number |
| `material_id` | "100906" | "MAT_TEST_0001" | ✅ Same material always gets same ID |
| `description` | "Avery Dennison Label..." | "Test Material 1 - Material XXX..." | ✅ Consistent per description |
| `ref_at_supplier` | "Slit by Gravic" | "REF_A7B3X9" | ❌ Random each time |

## What Stays the Same

- `width`, `length`, `lead_time`
- `safety_stock`, `current_stock`, `reservations`, `final_stock`
- `expected_date`, `historical_slit`

## Prerequisites

1. **Firebase Admin SDK Credentials**
   ```bash
   # You need serviceAccountKey.json in the project root
   # Download from: Firebase Console → Project Settings → Service Accounts
   ```

2. **Node.js Dependencies**
   ```bash
   npm install firebase-admin
   ```

## Usage

### 1. Ensure you have the service account key
```bash
# Check if serviceAccountKey.json exists
ls serviceAccountKey.json
```

### 2. Run the anonymization script
```bash
node scripts/anonymize-stock-data.js
```

### 3. Review the output
The script will:
- ✅ Read all documents from `stock_management`
- ✅ Create anonymized copies in `public_stock_management`
- ✅ Save mapping files to `data-mappings/` directory
- ✅ Display summary statistics

### 4. Verify the results
Check your Firebase Console:
- Navigate to Firestore Database
- Look for `public_stock_management` collection
- Verify anonymized data looks correct

## Output Files

The script creates mapping files in `data-mappings/`:

```
data-mappings/
├── supplier-mappings.json      # Original supplier → SUPPLIER_XXX
├── substrate-mappings.json     # Original keyword → SF_XXXXX
└── material-mappings.json      # Original material_id → MAT_TEST_XXXX
```

**⚠️ IMPORTANT**: Keep these mapping files **SECURE** and **PRIVATE**. They contain the keys to reverse the anonymization.

## Example Output

```
🚀 Starting data anonymization process...

📖 Reading from stock_management collection...
✅ Found 247 documents

🔄 Processing and anonymizing documents...
  ✓ Committed batch (247 documents processed)

💾 Saving mapping files...

✨ Anonymization complete!

📊 Summary:
  • Total documents processed: 247
  • Unique suppliers masked: 12
  • Unique substrate families masked: 8
  • Unique material IDs masked: 156
  • Target collection: public_stock_management
  • Mapping files saved to: data-mappings
```

## Safety Features

1. **Non-Destructive**: Original `stock_management` collection is never modified
2. **Consistent Mappings**: Same values always map to same anonymized values
3. **Audit Trail**: Each anonymized document includes:
   - `anonymized: true` flag
   - `anonymized_at` timestamp
   - `original_id` reference

## Cleanup (Optional)

If you need to re-run the anonymization:

```javascript
// Delete all documents in public_stock_management
// WARNING: This is destructive!
const deleteCollection = async () => {
  const snapshot = await db.collection('public_stock_management').get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};
```

## Integration with Frontend

To use the anonymized data in your application, update the collection reference:

```typescript
// In your component or service
const collectionName = import.meta.env.VITE_USE_PUBLIC_DATA === 'true'
  ? 'public_stock_management'
  : 'stock_management';

const stockRef = collection(db, collectionName);
```

## Security Considerations

### DO ✅
- Keep mapping files in `.gitignore`
- Review anonymized data before making public
- Use for demos, testing, and public documentation
- Keep Firebase security rules restrictive

### DON'T ❌
- Commit mapping files to version control
- Share mapping files publicly
- Assume anonymization is perfect - review manually
- Use for production data without legal review

## Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "serviceAccountKey.json not found"
Download from Firebase Console:
1. Go to Project Settings
2. Service Accounts tab
3. Click "Generate new private key"
4. Save as `serviceAccountKey.json` in project root

### "Permission denied"
Ensure your service account has Firestore read/write permissions.

### Script hangs or times out
Check your internet connection and Firebase project status.

## Questions?

For issues or questions about this script, review the code in:
- `scripts/anonymize-stock-data.js`

The script includes detailed comments and error handling.
