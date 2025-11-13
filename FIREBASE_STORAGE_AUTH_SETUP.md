# Firebase Storage Authentication Setup

## Overview

Your application now uses **Firebase Authentication** to secure Firebase Storage access. Users must log in with email/password before accessing client data from Storage.

## How It Works

1. **User logs in** with email and password via Firebase Auth
2. **Firebase automatically generates** an authentication token
3. **Storage requests include** the auth token automatically
4. **Storage rules verify** the token and allow/deny access
5. **Files are served** with proper authentication

## Benefits

✅ **Secure**: Only authenticated users can access sensitive client data
✅ **Platform-agnostic**: Works on Vercel, Firebase Hosting, or any platform
✅ **Automatic**: Auth tokens are managed by Firebase SDK
✅ **CORS-ready**: Supports localhost, Firebase Hosting, and Vercel domains

---

## Setup Steps

### 1. Configure CORS on Firebase Storage

CORS (Cross-Origin Resource Sharing) must be configured to allow your web app to access Storage.

#### Option A: Using `gsutil` (Recommended)

**Install Google Cloud SDK** (if not installed):
- Windows: https://cloud.google.com/sdk/docs/install#windows
- Mac/Linux: `curl https://sdk.cloud.google.com | bash`

**Apply CORS configuration:**

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project socialwise-c8ddc

# Apply CORS
cd "C:\Users\mikbu\Documents\SocialWise"
gsutil cors set storage-cors.json gs://socialwise-c8ddc.firebasestorage.app

# Verify
gsutil cors get gs://socialwise-c8ddc.firebasestorage.app
```

#### Option B: Using Firebase CLI (Alternative)

```bash
# Note: Firebase CLI doesn't support CORS directly
# You MUST use gsutil for CORS configuration
```

### 2. Verify Storage Rules

Your Storage rules should allow authenticated users to read from `Aineisto/`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write Aineisto files
    match /Aineisto/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Set Up User Authentication

#### Create User Accounts

Use Firebase Console or Firebase Admin SDK to create user accounts:

**Firebase Console:**
1. Go to https://console.firebase.google.com/project/socialwise-c8ddc/authentication
2. Click "Add user"
3. Enter email and password
4. Click "Add user"

**Using Firebase Admin (programmatically):**

```typescript
import { getAuth } from 'firebase-admin/auth';

await getAuth().createUser({
  email: 'user@example.com',
  password: 'securePassword123',
  displayName: 'User Name'
});
```

#### Users Can Log In

Your app already has a login form. Users can log in with their email and password:

```typescript
import { useAuth } from '@/hooks/useAuth';

const { login } = useAuth();
await login('user@example.com', 'password');
```

### 4. Deploy to Vercel

Your CORS configuration already includes Vercel domains:

```json
{
  "origin": [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://*.vercel.app",
    "https://socialwise.vercel.app"
  ]
}
```

**Deploy to Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or link to existing project
vercel link
vercel --prod
```

**Set Environment Variables in Vercel:**

Go to your Vercel project settings and add:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=socialwise-c8ddc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=socialwise-c8ddc
VITE_FIREBASE_STORAGE_BUCKET=socialwise-c8ddc.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Code Changes Made

### 1. Updated `aineistoStorageService.ts`

Added authentication check before accessing Storage:

```typescript
async function ensureAuthenticated(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve();
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        resolve();
      } else {
        reject(new Error('User not authenticated'));
      }
    });
  });
}
```

All Storage access now calls `await ensureAuthenticated()` first.

### 2. Updated `storage-cors.json`

Added Vercel domains to allowed origins:

```json
{
  "origin": [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://socialwise-c8ddc.web.app",
    "https://socialwise-c8ddc.firebaseapp.com",
    "https://*.vercel.app",
    "https://socialwise.vercel.app"
  ]
}
```

---

## Testing

### Local Testing

1. **Start dev server**: `npm run dev`
2. **Navigate to**: http://localhost:8080
3. **Log in** with valid credentials
4. **Verify** client data loads without CORS errors

### Production Testing (Vercel)

1. **Deploy to Vercel**: `vercel --prod`
2. **Set environment variables** in Vercel dashboard
3. **Visit your Vercel URL**
4. **Log in** and verify data loads

---

## Troubleshooting

### CORS Errors Still Appearing

**Problem**: Browser shows CORS errors despite configuration

**Solution**:
1. Verify CORS is applied: `gsutil cors get gs://socialwise-c8ddc.firebasestorage.app`
2. Clear browser cache (Ctrl+Shift+R)
3. Wait 5-10 minutes for changes to propagate
4. Check that your origin is in the allowed list

### Authentication Errors

**Problem**: "User not authenticated" errors

**Solution**:
1. Verify user is logged in: Check `useAuth()` hook
2. Check Firebase Auth console for user accounts
3. Verify Storage rules allow authenticated reads
4. Check browser console for auth state changes

### Files Not Loading

**Problem**: Files return 404 or null

**Solution**:
1. Verify files exist in Storage: Firebase Console → Storage
2. Check file paths in `KNOWN_FILES` constant
3. Verify Storage rules allow read access
4. Check authentication is working

### Vercel Deployment Issues

**Problem**: Works locally but not on Vercel

**Solution**:
1. Verify all environment variables are set in Vercel
2. Ensure Vercel domain is in CORS allowed origins
3. Rebuild and redeploy: `vercel --prod --force`
4. Check Vercel logs for errors

---

## Security Best Practices

✅ **Never commit** `.env` file to git
✅ **Use strong passwords** for user accounts
✅ **Rotate API keys** periodically
✅ **Monitor Storage access** via Firebase Console
✅ **Set up Firebase App Check** for additional security (optional)

---

## Next Steps

1. ✅ Apply CORS configuration using `gsutil`
2. ✅ Create user accounts in Firebase Auth
3. ✅ Test login flow locally
4. ✅ Deploy to Vercel
5. ✅ Test on production URL

---

## Support

**Firebase Storage CORS Documentation**:
https://firebase.google.com/docs/storage/web/download-files#cors_configuration

**Firebase Auth Documentation**:
https://firebase.google.com/docs/auth/web/start

**Vercel Deployment**:
https://vercel.com/docs/deployments/overview
