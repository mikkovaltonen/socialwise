# Public Viewer Account Setup

This document explains how the public viewer account works and how to set it up.

## Overview

The application supports a special **public viewer** account that sees anonymized stock management data instead of real data. This allows you to safely share access to the application for demos, documentation, or external stakeholders without exposing sensitive business information.

## How It Works

### Collection Routing Logic

The application uses a collection routing function in `src/lib/firebase.ts`:

```typescript
export function getStockManagementCollection(userEmail: string | null | undefined): string {
  // Public viewer gets anonymized data
  if (userEmail === 'public@viewer.com') {
    return 'public_stock_management';
  }

  // All other users get real data
  return 'stock_management';
}
```

### Data Shown by Account Type

| User Account | Collection | Data Type | Use Case |
|--------------|------------|-----------|----------|
| `public@viewer.com` | `public_stock_management` | Anonymized | Demos, screenshots, documentation |
| All other users | `stock_management` | Real | Production use |

### What Gets Anonymized

When viewing data as `public@viewer.com`, you'll see:

- ✅ **Substrate families**: Real names like `ADH1001` → Anonymized codes like `SF_17001`
- ✅ **Material IDs**: Real IDs → Test strings like `MAT_TEST_0001`
- ✅ **Suppliers**: Real names → Generic codes like `SUPPLIER_001`
- ✅ **Descriptions**: Scrambled to generic test descriptions
- ✅ **References**: Random codes like `REF_A7B3X9`
- ❌ **Stock levels, dates, numeric data**: Unchanged (structure preserved)

## Setting Up the Public Viewer Account

### Step 1: Create the Firebase Account

You can create the `public@viewer.com` account in two ways:

#### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `demandmanager-f3efd`
3. Navigate to **Authentication** → **Users**
4. Click **Add User**
5. Enter:
   - Email: `public@viewer.com`
   - Password: Choose a secure password
6. Click **Add User**

#### Option B: Using the Application

1. Go to your application's login/registration page
2. Click **Register** or **Sign Up**
3. Enter:
   - Email: `public@viewer.com`
   - Password: Choose a secure password
4. Complete registration

### Step 2: Verify Anonymized Data Exists

Ensure you've run the anonymization script to populate `public_stock_management`:

```bash
node scripts/anonymize-stock-data.js
```

This should create 1,287 anonymized documents in the `public_stock_management` collection.

### Step 3: Test the Account

1. **Log out** of any existing account
2. **Log in** with:
   - Email: `public@viewer.com`
   - Password: [the password you set]
3. Navigate to the **Workbench** or **Stock Management** section
4. Verify you see anonymized data:
   - Substrate families should show codes like `SF_12345`
   - Material IDs should show `MAT_TEST_XXXX`
   - Suppliers should show `SUPPLIER_XXX`

## Components That Use Collection Routing

The following components automatically switch collections based on the logged-in user:

1. **`src/pages/Workbench.tsx`**
   - Line 52-53: Substrate family data loading

2. **`src/components/StockManagementTable.tsx`**
   - Line 81-82: Stock management table data

3. **`src/components/SubstrateFamilySelector.tsx`**
   - Line 37-38: Loading unique substrate families
   - Line 78-79: Loading family-specific records

All components use the `getStockManagementCollection()` helper with the current user's email from `useAuth()`.

## Security Considerations

### ✅ Safe for Public Sharing

- Anonymized data contains no real supplier names
- Material descriptions are scrambled
- All sensitive identifiers are masked
- Original data relationships preserved for demo purposes

### ⚠️ Not for Production Data

- The public viewer account should only be used for demos/documentation
- Do not grant write permissions to `public_stock_management`
- Keep the mapping files (`data-mappings/`) secure and private

### 🔒 Firestore Security Rules

Ensure your Firestore security rules allow read access to `public_stock_management`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Real data - authenticated users only
    match /stock_management/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Adjust based on your needs
    }

    // Public anonymized data - anyone can read
    match /public_stock_management/{document=**} {
      allow read: if true; // Or restrict to authenticated users: if request.auth != null
      allow write: if false; // Never allow writes to public collection
    }
  }
}
```

## Troubleshooting

### Public viewer sees real data

**Problem**: When logged in as `public@viewer.com`, you still see real substrate family names.

**Solution**:
1. Verify the email is exactly `public@viewer.com` (case-sensitive)
2. Check that the anonymization script ran successfully
3. Verify `public_stock_management` collection exists in Firestore
4. Clear browser cache and reload

### No data shown for public viewer

**Problem**: Public viewer sees empty tables or "No data found" messages.

**Solution**:
1. Run the anonymization script: `node scripts/anonymize-stock-data.js`
2. Verify documents were created in `public_stock_management` collection
3. Check Firestore security rules allow read access

### Regular users see anonymized data

**Problem**: Normal users are seeing anonymized data instead of real data.

**Solution**:
1. Verify they're not logged in as `public@viewer.com`
2. Check the `getStockManagementCollection()` function logic
3. Ensure `stock_management` collection has data

## Adding More Public Viewers

If you need multiple public viewer accounts, update the logic in `src/lib/firebase.ts`:

```typescript
export function getStockManagementCollection(userEmail: string | null | undefined): string {
  // List of public viewer emails
  const publicViewers = [
    'public@viewer.com',
    'demo@company.com',
    'guest@example.com'
  ];

  if (publicViewers.includes(userEmail || '')) {
    return 'public_stock_management';
  }

  return 'stock_management';
}
```

## Summary

- ✅ Created utility function `getStockManagementCollection()` in `firebase.ts`
- ✅ Updated 3 components to use collection routing
- ✅ Public viewer (`public@viewer.com`) sees anonymized data
- ✅ All other users see real data
- ✅ TypeScript compilation passes with no errors
- ✅ Zero configuration needed after initial setup

For questions or issues, refer to the main project documentation or check the mapping files in `data-mappings/`.
