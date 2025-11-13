# Vercel CORS Configuration Guide

## Important: Wildcard Origins Don't Work

Google Cloud Storage **does NOT support wildcards** in CORS origins. This means:

❌ **This doesn't work:**
```json
"https://*.vercel.app"
```

✅ **This works:**
```json
"https://socialwise.vercel.app"
```

---

## Current Configuration

Your `storage-cors.json` currently allows:

```json
{
  "origin": [
    "http://localhost:8080",           // Local development
    "http://localhost:5173",           // Vite default port
    "https://socialwise-c8ddc.web.app", // Firebase Hosting
    "https://socialwise-c8ddc.firebaseapp.com", // Firebase Hosting
    "https://socialwise.vercel.app"     // Vercel production
  ]
}
```

This configuration works for:
- ✅ Local development
- ✅ Firebase Hosting
- ✅ Vercel production URL (`socialwise.vercel.app`)

This configuration does NOT work for:
- ❌ Vercel preview deployments (`socialwise-abc123.vercel.app`)

---

## Solution 1: Custom Domain (Recommended)

### Why Use a Custom Domain?

- ✅ Professional appearance
- ✅ Works for all deployments (production + previews)
- ✅ One-time CORS setup
- ✅ No maintenance needed

### Steps

**1. Add Custom Domain to Vercel**

Go to your Vercel project:
1. Settings → Domains
2. Add your domain (e.g., `socialwise.fi`)
3. Follow Vercel's DNS setup instructions

**2. Update CORS Configuration**

Add your custom domain to `storage-cors.json`:

```json
{
  "origin": [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://socialwise.fi",            // Your custom domain
    "https://www.socialwise.fi",        // www subdomain
    "https://socialwise.vercel.app"     // Keep Vercel URL as backup
  ],
  "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
  "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-*", "x-firebase-*"],
  "maxAgeSeconds": 3600
}
```

**3. Apply CORS**

```bash
gcloud auth login
gsutil cors set storage-cors.json gs://socialwise-c8ddc.firebasestorage.app
```

**4. Configure Vercel to Use Custom Domain**

Vercel will automatically route your custom domain to deployments. Preview deployments will still have their own URLs, but your custom domain will always point to production.

---

## Solution 2: Production Only (Current Setup)

### When to Use This

- You only need production deployments to work
- Preview deployments are for internal testing only
- You don't have a custom domain yet

### Current Configuration

```json
{
  "origin": [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://socialwise.vercel.app"
  ]
}
```

### Limitations

- ❌ Preview deployments won't work with Storage
- ✅ Production deployment works
- ✅ Local development works

### When This Is Acceptable

- Internal team testing can be done locally
- Preview deployments test UI/logic but not Storage
- Production is the only public-facing deployment

---

## Solution 3: Add Preview URLs Manually (Not Recommended)

### Process

After each preview deployment:

1. Get preview URL from Vercel: `https://socialwise-abc123.vercel.app`
2. Add to `storage-cors.json`
3. Re-apply CORS: `gsutil cors set storage-cors.json gs://...`

### Why This Is Bad

- ⏰ Time-consuming for every deployment
- 🔄 High maintenance overhead
- 🐛 Easy to forget and break things
- 💰 Preview URLs expire anyway

---

## Recommended Approach

### For Development/Testing

**Use current setup:**
- Test locally: `localhost:8080` ✅
- Test production: `socialwise.vercel.app` ✅
- Skip preview deployments (they're temporary anyway)

### For Production

**Add custom domain:**
1. Purchase domain (e.g., from Namecheap, Google Domains)
2. Add to Vercel project
3. Update CORS with custom domain
4. All future deployments work automatically

---

## FAQ

### Q: Can I use environment variables to solve this?

**A:** No. CORS is configured on the Storage bucket (server-side), not in your application code. Environment variables won't help.

### Q: Can I disable CORS checking?

**A:** No. CORS is a browser security feature and cannot be disabled from the server side. You must configure allowed origins.

### Q: What if I need multiple Vercel projects?

**A:** Add each production URL to CORS:

```json
{
  "origin": [
    "https://socialwise-prod.vercel.app",
    "https://socialwise-staging.vercel.app",
    "https://socialwise-dev.vercel.app"
  ]
}
```

### Q: Does Firebase Authentication work without CORS?

**A:** Authentication API calls work, but Storage file downloads will be blocked by CORS if the origin isn't allowed.

### Q: How often do I need to update CORS?

**A:**
- **With custom domain**: Never (one-time setup)
- **With Vercel URL**: Only when you change deployment URLs
- **With preview URLs**: After every preview deployment (not recommended)

---

## Current Status

✅ **Working:**
- Local development (`localhost:8080`)
- Vercel production (`socialwise.vercel.app`)
- Firebase Authentication (all platforms)

⚠️ **Not Working:**
- Vercel preview deployments (by design, to avoid maintenance)

🎯 **Next Step:**
Apply CORS configuration with:

```bash
gcloud auth login
gsutil cors set storage-cors.json gs://socialwise-c8ddc.firebasestorage.app
```

---

## Summary

| Solution | Preview URLs | Maintenance | Cost | Recommendation |
|----------|--------------|-------------|------|----------------|
| Custom Domain | ✅ Yes | None | ~$10/year | ⭐ Best |
| Production Only | ❌ No | None | Free | ✅ Good |
| Manual Updates | ✅ Yes | High | Free | ❌ Avoid |

**Recommendation**: Start with **Production Only** (current setup), then add a **Custom Domain** when ready for public launch.
