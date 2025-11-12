# Momentum Tasks Deployment Guide

This guide walks you through deploying Momentum Tasks to production, including Firebase setup, Google Cloud configuration, and environment variables.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Google Cloud Console Setup](#google-cloud-console-setup)
4. [Environment Variables](#environment-variables)
5. [Firestore Configuration](#firestore-configuration)
6. [Deploying Cloud Functions](#deploying-cloud-functions)
7. [Deploying the Web App](#deploying-the-web-app)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Firebase CLI** installed (`npm install -g firebase-tools`)
- **Google Cloud Platform** account
- **Firebase** project (free tier or higher)
- **Git** for version control

**Install Firebase CLI:**

```bash
npm install -g firebase-tools
firebase --version
```

**Login to Firebase:**

```bash
firebase login
```

---

## Firebase Project Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: e.g., `momentum-tasks-prod`
4. Enable Google Analytics (optional but recommended)
5. Click **"Create project"**

### Step 2: Enable Firebase Services

**Authentication:**

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** sign-in method
4. Enable **Google** sign-in method (optional)
5. Configure authorized domains (add your production domain)

**Firestore Database:**

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Start in **Production mode** (security rules will be deployed later)
4. Choose a location (select closest to your users)
5. Click **"Enable"**

**Cloud Functions:**

1. Go to **Functions**
2. Click **"Get started"**
3. Upgrade to **Blaze plan** (pay-as-you-go, required for outbound networking)
4. Cloud Functions will be deployed in a later step

### Step 3: Initialize Firebase in Your Project

```bash
cd /path/to/fs-momentum-tasks

# Initialize Firebase (if not already done)
firebase init

# Select:
# - Firestore: Deploy rules and indexes
# - Functions: Configure Cloud Functions
# - Hosting: Deploy web app (if using Firebase Hosting)

# Choose existing project: momentum-tasks-prod
```

**Configuration Files Created:**

- `.firebaserc` - Project aliases
- `firebase.json` - Firebase configuration
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Composite indexes
- `functions/` - Cloud Functions directory

### Step 4: Configure Firebase Project

Edit `.firebaserc`:

```json
{
  "projects": {
    "default": "momentum-tasks-prod"
  }
}
```

Edit `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix functions run build"],
    "runtime": "nodejs18"
  },
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## Google Cloud Console Setup

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (e.g., `momentum-tasks-prod`)
3. This should be automatically linked to your Firebase project

### Step 2: Enable Google Tasks API

1. Go to **APIs & Services → Library**
2. Search for **"Google Tasks API"**
3. Click on it and click **"Enable"**
4. Wait for activation (usually instant)

### Step 3: Create OAuth 2.0 Credentials

**Create OAuth Consent Screen:**

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Click **"Create"**
4. Fill in required fields:
   - **App name:** Momentum Tasks
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click **"Save and Continue"**

**Add Scopes:**

1. Click **"Add or Remove Scopes"**
2. Add the following scopes:
   - `https://www.googleapis.com/auth/tasks` (Google Tasks API)
   - `https://www.googleapis.com/auth/tasks.readonly` (optional, for read-only access)
3. Click **"Update"** and **"Save and Continue"**

**Add Test Users (if External):**

1. Add your email and any test user emails
2. Click **"Save and Continue"**
3. Review and click **"Back to Dashboard"**

**Create OAuth Client ID:**

1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials" → "OAuth client ID"**
3. Application type: **Web application**
4. Name: `Momentum Tasks Web Client`
5. **Authorized JavaScript origins:**
   - `http://localhost:3000` (development)
   - `https://your-production-domain.com` (production)
6. **Authorized redirect URIs:**
   - `http://localhost:3000/auth/callback/google` (development)
   - `https://your-production-domain.com/auth/callback/google` (production)
7. Click **"Create"**
8. **Copy the Client ID and Client Secret** (you'll need these for environment variables)

### Step 4: Configure Cloud Scheduler

Cloud Scheduler is required for scheduled Cloud Functions.

1. Go to **Cloud Scheduler** in Google Cloud Console
2. Click **"Enable API"** if prompted
3. Choose a region (same as your Cloud Functions region)
4. Note: Scheduler jobs will be created automatically when you deploy functions

---

## Environment Variables

### Step 1: Create `.env.local` for Development

Create a `.env.local` file in the project root:

```bash
# Firebase Client Config (from Firebase Console → Project Settings → General)
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# OAuth Redirect URI
OAUTH_REDIRECT_URI="http://localhost:3000/auth/callback/google"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Get Firebase Config:**

1. Go to Firebase Console → Project Settings → General
2. Scroll down to **Your apps**
3. Click on the web app (or create one if needed)
4. Copy the config values

### Step 2: Set Firebase Functions Environment Variables

For Cloud Functions, set environment variables using Firebase CLI:

```bash
firebase functions:config:set \
  google.client_id="your-client-id.apps.googleusercontent.com" \
  google.client_secret="your-client-secret" \
  app.url="https://your-production-domain.com"

# Verify
firebase functions:config:get
```

**Alternative: Use .env file in functions/**

Create `functions/.env`:

```
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
APP_URL="https://your-production-domain.com"
```

Then load in your functions:

```typescript
import * as dotenv from "dotenv";
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
```

### Step 3: Configure Production Environment Variables

**For Next.js Deployment (Vercel, Netlify, etc.):**

Add environment variables in your hosting provider's dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add all variables from `.env.local`
4. Change `NEXT_PUBLIC_APP_URL` to your production URL
5. Change `OAUTH_REDIRECT_URI` to your production callback URL

**For Firebase Hosting:**

Environment variables are baked into the build. Update `.env.production`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
# ... other variables
NEXT_PUBLIC_APP_URL="https://your-production-domain.com"
OAUTH_REDIRECT_URI="https://your-production-domain.com/auth/callback/google"
```

---

## Firestore Configuration

### Step 1: Review Firestore Security Rules

**File:** `firestore.rules`

Ensure your rules are production-ready:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Tasks subcollection
      match /tasks/{taskId} {
        allow read, write: if isOwner(userId);
      }
    }

    // OAuth tokens (server-only access via Admin SDK)
    match /user_tokens/{userId} {
      allow read, write: if false; // Only accessible via Admin SDK
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read, update, delete: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
      allow create: if false; // Only Cloud Functions can create
    }
  }
}
```

### Step 2: Review Firestore Indexes

**File:** `firestore.indexes.json`

Ensure all required composite indexes are defined:

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "source", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isCompleted", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### Step 3: Deploy Firestore Configuration

```bash
# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Verify deployment
firebase firestore:indexes
```

**Note:** Index creation can take several minutes. Check status in Firebase Console → Firestore → Indexes.

---

## Deploying Cloud Functions

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

### Step 2: Build Functions

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### Step 3: Deploy Functions

**Deploy all functions:**

```bash
cd ..  # Back to project root
firebase deploy --only functions
```

**Deploy specific function:**

```bash
firebase deploy --only functions:scheduledTaskSync
firebase deploy --only functions:checkReminders
```

**Verify Deployment:**

1. Go to Firebase Console → Functions
2. You should see:
   - `scheduledTaskSync` (scheduled, every 3 minutes)
   - `manualTaskSync` (callable)
   - `checkReminders` (scheduled, every 1 minute)
   - `manualReminderCheck` (callable)
3. Check Cloud Scheduler in Google Cloud Console for cron jobs

### Step 4: Configure Function Settings

**Increase Memory (if needed):**

Edit `functions/src/index.ts`:

```typescript
export const scheduledTaskSync = functions
  .runWith({ memory: "512MB", timeoutSeconds: 300 })
  .pubsub.schedule("every 3 minutes")
  .onRun(async () => {
    // ...
  });
```

Redeploy after changes.

### Step 5: Test Cloud Functions

**Test Manual Sync (Callable Function):**

```bash
firebase functions:shell

# In the shell:
manualTaskSync({ provider: "google-tasks" }, { auth: { uid: "test-user-id" } })
```

**Check Function Logs:**

```bash
firebase functions:log
```

Or view in Firebase Console → Functions → Logs.

---

## Deploying the Web App

### Option 1: Deploy to Vercel (Recommended for Next.js)

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Login and Deploy**

```bash
vercel login
vercel
```

Follow the prompts:

- Link to existing project or create new
- Set project name
- Configure build settings (Next.js detected automatically)

**Step 3: Set Environment Variables**

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# Enter value when prompted

# Or add in Vercel Dashboard:
# Settings → Environment Variables
```

**Step 4: Deploy to Production**

```bash
vercel --prod
```

**Step 5: Configure Custom Domain (Optional)**

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` and `OAUTH_REDIRECT_URI` environment variables
5. Update Google OAuth redirect URIs in Google Cloud Console

### Option 2: Deploy to Firebase Hosting

**Step 1: Build Next.js for Static Export**

Edit `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
```

**Note:** Static export has limitations (no API routes, no server components). Consider using Vercel or custom server for full Next.js features.

**Step 2: Build the App**

```bash
npm run build
```

This creates an `out/` directory with static files.

**Step 3: Deploy to Firebase Hosting**

```bash
firebase deploy --only hosting
```

**Step 4: Access Your App**

```bash
firebase hosting:channel:open live
```

Or visit: `https://your-project-id.web.app`

### Option 3: Deploy to Custom Server (Node.js)

**Step 1: Build the App**

```bash
npm run build
```

**Step 2: Start Production Server**

```bash
npm start
```

**Step 3: Configure Reverse Proxy (Nginx)**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 4: Configure SSL (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Step 5: Set Up Process Manager (PM2)**

```bash
npm install -g pm2
pm2 start npm --name "momentum-tasks" -- start
pm2 save
pm2 startup
```

---

## Post-Deployment Verification

### Step 1: Test User Authentication

1. Visit your production URL
2. Create a new account
3. Verify email/password login works
4. Test Google sign-in (if enabled)
5. Check Firebase Authentication console for new user

### Step 2: Test Task Management

1. Create a new task
2. Edit the task
3. Mark task as complete
4. Delete the task
5. Verify all operations in Firestore console

### Step 3: Test Google Tasks Integration

1. Go to Settings → Integrations
2. Click "Connect Google Tasks"
3. Complete OAuth flow
4. Verify connection status shows "Connected"
5. Click "Sync Now"
6. Check if Google Tasks appear in task list
7. Create a task in Google Tasks, wait 3 minutes, verify it syncs
8. Disconnect Google Tasks
9. Verify tasks remain but sync stops

### Step 4: Test Time Blocking

1. Create a task with time block (start time + end time)
2. Go to Day View
3. Verify task appears in correct time slot
4. Navigate to different dates
5. Check for time conflict detection

### Step 5: Test Reminders & Notifications

1. Create a task with time block starting in 20 minutes
2. Wait for 15-minute reminder to fire
3. Check notification bell for new notification
4. Mark notification as read
5. Wait for 5-minute reminder
6. Verify second notification appears

### Step 6: Monitor Cloud Functions

**Check Scheduled Sync:**

1. Go to Google Cloud Console → Cloud Scheduler
2. Verify `scheduledTaskSync` job is running every 3 minutes
3. Check logs for successful executions

**Check Reminder Function:**

1. Verify `checkReminders` job is running every 1 minute
2. Check logs for notifications being created

**View Function Logs:**

```bash
firebase functions:log --only scheduledTaskSync
firebase functions:log --only checkReminders
```

Or view in Firebase Console → Functions → Logs.

---

## Monitoring & Logging

### Firebase Console Monitoring

1. Go to **Firebase Console → Functions**
2. View function invocations, errors, and execution time
3. Set up alerts for function failures

### Google Cloud Logging

1. Go to **Google Cloud Console → Logging**
2. Filter by resource: **Cloud Function**
3. Set up log-based metrics and alerts

### Error Tracking

**Install Sentry (Optional):**

```bash
npm install @sentry/nextjs
```

Initialize Sentry:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Usage Analytics

**Firebase Analytics:**

Already configured if enabled during project setup. View in Firebase Console → Analytics.

**Custom Events:**

```typescript
import { logEvent } from "firebase/analytics";

logEvent(analytics, "task_created", {
  source: "google-tasks",
  has_time_block: true,
});
```

---

## Troubleshooting

### Issue: OAuth Redirect Not Working

**Symptoms:** After clicking "Connect Google Tasks", redirect fails or shows error.

**Solutions:**

1. Verify OAuth redirect URI in Google Cloud Console matches exactly:
   - `https://your-domain.com/auth/callback/google`
2. Check that domain is added to Firebase Authentication authorized domains
3. Ensure `OAUTH_REDIRECT_URI` environment variable is correct
4. Clear browser cache and cookies
5. Check browser console for errors

### Issue: Cloud Functions Not Running

**Symptoms:** Scheduled functions not executing, sync not happening.

**Solutions:**

1. Verify Cloud Scheduler is enabled in Google Cloud Console
2. Check function logs for errors:
   ```bash
   firebase functions:log --only scheduledTaskSync
   ```
3. Verify functions are deployed:
   ```bash
   firebase functions:list
   ```
4. Check if Firebase project is on Blaze plan (required for scheduled functions)
5. Manually trigger function to test:
   ```bash
   firebase functions:shell
   ```

### Issue: Firestore Permission Denied

**Symptoms:** Users can't read/write their own data.

**Solutions:**

1. Verify Firestore security rules are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Check rules in Firebase Console → Firestore → Rules
3. Test rules with Rules Playground in Firebase Console
4. Ensure user is authenticated (check `request.auth.uid`)

### Issue: Composite Index Required

**Symptoms:** Firestore query fails with "index required" error.

**Solutions:**

1. Click the link in the error message to create the index
2. Or deploy indexes from `firestore.indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Wait for index creation to complete (check Firestore → Indexes)

### Issue: Environment Variables Not Set

**Symptoms:** App crashes or features don't work due to missing config.

**Solutions:**

1. Verify all required variables are set:
   ```bash
   # For Vercel:
   vercel env ls

   # For Firebase Functions:
   firebase functions:config:get
   ```
2. Check `.env.local` (development) or hosting provider dashboard (production)
3. Rebuild and redeploy after adding variables

### Issue: Google Tasks API Quota Exceeded

**Symptoms:** Sync fails with "quota exceeded" error.

**Solutions:**

1. Check quota usage in Google Cloud Console → APIs & Services → Dashboard
2. Increase quota if needed (may require billing)
3. Reduce sync frequency (change from 3 minutes to 5 or 10 minutes)
4. Implement request batching and caching

### Issue: Token Refresh Failing

**Symptoms:** Users getting "reconnect account" errors frequently.

**Solutions:**

1. Verify token refresh logic in `google-oauth.ts`
2. Check token expiration time (should be ~1 hour for Google)
3. Ensure refresh token is stored and retrieved correctly
4. Test token refresh manually:
   ```typescript
   await oauthService.refreshAccessToken(refreshToken);
   ```
5. Check Google Cloud Console for OAuth consent screen status

---

## Deployment Checklist

Use this checklist before deploying to production:

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Google OAuth credentials created and configured
- [ ] OAuth redirect URIs added to Google Cloud Console
- [ ] Firebase project upgraded to Blaze plan
- [ ] Firestore security rules reviewed and tested
- [ ] Firestore indexes defined and deployed
- [ ] Cloud Scheduler enabled
- [ ] All tests passing (`npm test`)
- [ ] Code reviewed and approved

### Deployment

- [ ] Cloud Functions deployed (`firebase deploy --only functions`)
- [ ] Firestore rules and indexes deployed (`firebase deploy --only firestore`)
- [ ] Web app built and deployed (Vercel, Firebase Hosting, or custom)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate configured

### Post-Deployment

- [ ] User authentication tested
- [ ] Task CRUD operations tested
- [ ] Google Tasks OAuth flow tested
- [ ] Task sync tested (auto and manual)
- [ ] Time blocking tested
- [ ] Reminders and notifications tested
- [ ] Cloud Functions logs checked for errors
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery plan documented

---

## Backup and Disaster Recovery

### Firestore Backups

**Automated Backups:**

1. Go to Google Cloud Console → Firestore → Backups
2. Click **"Create Backup"**
3. Configure scheduled backups (daily recommended)

**Manual Backup:**

```bash
gcloud firestore export gs://your-backup-bucket --async
```

### Restore from Backup

```bash
gcloud firestore import gs://your-backup-bucket/backup-folder --async
```

### Database Migration

If you need to migrate data:

1. Export data from Firestore
2. Transform data structure (if needed)
3. Import to new Firestore instance
4. Update security rules and indexes
5. Test thoroughly before switching

---

## Scaling Considerations

### Firestore Scaling

- Firestore scales automatically
- Monitor read/write operations in Firebase Console
- Optimize queries to reduce reads
- Use batch writes for bulk operations
- Consider using Firestore in Datastore mode for heavy workloads

### Cloud Functions Scaling

- Functions scale automatically up to quotas
- Increase function memory if needed (256MB → 512MB → 1GB)
- Increase timeout for long-running functions (default 60s, max 540s)
- Monitor function execution time and memory usage
- Consider using Cloud Run for long-running processes

### Sync Optimization

- Increase sync interval during low usage periods
- Implement delta sync (only fetch changed tasks)
- Use webhooks instead of polling (if supported by provider)
- Cache frequently accessed data in memory

---

## Cost Optimization

### Firebase Pricing

- **Firestore:** Free tier: 50K reads, 20K writes, 20K deletes per day
- **Cloud Functions:** Free tier: 2M invocations, 400K GB-seconds per month
- **Authentication:** Free for most use cases

**Optimization Tips:**

1. Reduce Firestore reads by using real-time listeners efficiently
2. Cache data client-side with service workers
3. Use composite indexes to avoid full collection scans
4. Batch Cloud Function invocations when possible
5. Monitor usage in Firebase Console → Usage and billing

### Google Tasks API Pricing

- **Free tier:** 1M requests per day
- Monitor usage in Google Cloud Console → APIs & Services → Dashboard

---

## Security Best Practices

1. **Never commit secrets** to version control (use `.gitignore` for `.env*` files)
2. **Use environment variables** for all sensitive data
3. **Enable Firestore security rules** (never use allow all)
4. **Validate all user input** (use Zod schemas)
5. **Encrypt OAuth tokens** before storing (use Firebase Admin SDK encryption)
6. **Rotate secrets regularly** (OAuth credentials, API keys)
7. **Monitor access logs** for suspicious activity
8. **Enable 2FA** for all admin accounts
9. **Keep dependencies updated** (`npm audit` regularly)
10. **Use HTTPS everywhere** (no plain HTTP in production)

---

## Continuous Deployment

### GitHub Actions (Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci

      - name: Build functions
        run: cd functions && npm run build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions,firestore
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

**Get Firebase Token:**

```bash
firebase login:ci
```

Add the token to GitHub repository secrets.

---

**Version:** 1.0 (MVP)
**Last Updated:** 2025-11-12
**For User Documentation:** See USER_GUIDE.md
**For Developer Documentation:** See DEVELOPER.md
