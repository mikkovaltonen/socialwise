# Apply CORS Configuration to Firebase Storage

## Problem
Firebase Storage has CORS restrictions that block requests from web applications. Even when using Firebase SDK, the underlying XMLHttpRequest needs proper CORS headers.

## Solution
Apply CORS configuration to your Firebase Storage bucket using `gsutil` (Google Cloud SDK).

## Prerequisites
1. Install Google Cloud SDK (includes `gsutil`):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use Firebase CLI with `firebase storage:rules:deploy` (doesn't support CORS)

## Steps

### 1. Install Google Cloud SDK (if not installed)

**Windows:**
```bash
# Download and run installer from:
# https://cloud.google.com/sdk/docs/install#windows
```

**Mac/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project socialwise-c8ddc
```

### 3. Apply CORS Configuration

```bash
gsutil cors set storage-cors.json gs://socialwise-c8ddc.firebasestorage.app
```

### 4. Verify CORS Configuration

```bash
gsutil cors get gs://socialwise-c8ddc.firebasestorage.app
```

## Alternative: Firebase Console (Manual Method)

If you prefer not to install Google Cloud SDK, you can use Firebase Console:

1. Go to: https://console.firebase.google.com/project/socialwise-c8ddc/storage
2. Unfortunately, Firebase Console doesn't support CORS configuration directly
3. You MUST use `gsutil` for CORS configuration

## CORS Configuration Explanation

The `storage-cors.json` file allows:

- **Origins**: localhost:8080, localhost:5173, and your Firebase hosting URLs
- **Methods**: GET, HEAD, PUT, POST, DELETE
- **Headers**: Content-Type, Authorization, and Google-specific headers
- **Max Age**: 3600 seconds (1 hour cache)

## Troubleshooting

### Error: "gsutil command not found"
- Make sure Google Cloud SDK is installed and in your PATH
- Restart your terminal after installation

### Error: "AccessDeniedException: 403"
- Make sure you're authenticated: `gcloud auth login`
- Make sure you have permission on the Firebase project

### Still seeing CORS errors after applying?
- Clear browser cache and hard reload (Ctrl+Shift+R)
- Wait a few minutes for changes to propagate
- Check that your app is running on an allowed origin (localhost:8080)

## After Applying CORS

Once CORS is configured, your app should be able to:
- ✅ Fetch files from Firebase Storage without CORS errors
- ✅ Use Firebase SDK methods like `getBytes()` successfully
- ✅ Load client data from Storage in the browser
