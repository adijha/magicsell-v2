# Google Cloud Run Deployment Guide

Complete guide for deploying MagicSell v2 to Google Cloud Run with staging and production environments.

## Prerequisites

1. **Google Cloud Project**: round-folio-468620-j8
2. **GitHub Repository**: Set up with deployment workflows
3. **Database**: PostgreSQL (SQLite won't work on Cloud Run)
4. **GitHub Secrets**: Configure in repository settings

## Required GitHub Secrets

Add these secrets in GitHub: Settings → Secrets and variables → Actions

```
GCP_SERVICE_ACCOUNT_KEY
```

This should contain the JSON key for your GCP service account with the following permissions:
- Cloud Run Admin
- Cloud Build Editor
- Service Account User
- Storage Admin

## Infrastructure Overview

### Staging Environment
- **Service Name**: `magicsell-v2-staging`
- **Region**: us-central1
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Memory**: 512Mi
- **CPU**: 1
- **Environment**: STAGING

### Production Environment
- **Service Name**: `magicsell-v2`
- **Region**: us-central1
- **Min Instances**: 1 (always running)
- **Max Instances**: 100
- **Memory**: 1Gi
- **CPU**: 2
- **Environment**: PRODUCTION

## Database Setup (CRITICAL - Do This First!)

⚠️ **SQLite does NOT work on Cloud Run** (ephemeral storage)

### Option 1: Google Cloud SQL (PostgreSQL) - Recommended

1. **Create Cloud SQL instance:**
```bash
gcloud sql instances create magicsell-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=[YOUR_PASSWORD]
```

2. **Create databases:**
```bash
# Staging database
gcloud sql databases create magicsell_staging \
  --instance=magicsell-db

# Production database
gcloud sql databases create magicsell_production \
  --instance=magicsell-db
```

3. **Get connection string:**
```bash
gcloud sql instances describe magicsell-db \
  --format="value(connectionName)"
# Output: round-folio-468620-j8:us-central1:magicsell-db
```

4. **Update Prisma schema:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. **Run migrations:**
```bash
# Update .env with Cloud SQL connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@/magicsell_staging?host=/cloudsql/round-folio-468620-j8:us-central1:magicsell-db"

npx prisma migrate dev --name init
```

### Option 2: External PostgreSQL (Supabase, Neon, etc.)

1. **Create project** on your chosen provider
2. **Copy connection string**
3. **Update Prisma schema** (same as above)
4. **Run migrations**

## Deployment Process

### First-Time Setup

1. **Update Cloud Build configs with DATABASE_URL:**

Edit `cloudbuild-staging.yaml` and `cloudbuild-production.yaml` to add database connection:

```yaml
- '--set-env-vars'
- 'NODE_ENV=production,APP_ENVIRONMENT_NAME=STAGING,DATABASE_URL=postgresql://...'
```

Or use Cloud Run secrets (more secure):

```bash
# Create secret
echo -n "postgresql://..." | gcloud secrets create magicsell-db-staging --data-file=-

# Update cloudbuild to use secret
- '--set-secrets'
- 'DATABASE_URL=magicsell-db-staging:latest'
```

2. **Add other required environment variables:**
```yaml
--set-env-vars:
  - NODE_ENV=production
  - APP_ENVIRONMENT_NAME=STAGING
  - SHOPIFY_API_KEY=your-staging-api-key
  - SHOPIFY_API_SECRET=your-staging-api-secret
  - SCOPES=read_products,write_products,read_orders
```

### Deploy to Staging

1. **Go to GitHub Actions tab**
2. **Select "Deploy to Staging" workflow**
3. **Click "Run workflow"**
4. **Fill in the form:**
   - Branch: `main` (or your dev branch)
   - Deploy message: "Initial staging deployment"
5. **Click "Run workflow"**

The deployment will:
- ✅ Checkout your code
- ✅ Install dependencies
- ✅ Build Docker image
- ✅ Push to Google Container Registry
- ✅ Deploy to Cloud Run
- ✅ Verify deployment
- ✅ Output the service URL

### Deploy to Production

1. **Go to GitHub Actions tab**
2. **Select "Deploy to Production" workflow**
3. **Click "Run workflow"**
4. **Fill in the form:**
   - Branch: `main`
   - Confirmation: Type `DEPLOY` (required safety check)
   - Deploy message: "Production v1.0.0 deployment"
5. **Click "Run workflow"**

Production deployment includes:
- ✅ Confirmation validation
- ✅ All staging steps
- ✅ GitHub deployment tracking
- ✅ Production-grade resources (1Gi RAM, 2 CPUs)

## Environment Variables

### Staging (`cloudbuild-staging.yaml`)
```yaml
NODE_ENV=production
APP_ENVIRONMENT_NAME=STAGING
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=staging-api-key
SHOPIFY_API_SECRET=staging-secret
SCOPES=read_products,write_products,read_orders
```

### Production (`cloudbuild-production.yaml`)
```yaml
NODE_ENV=production
APP_ENVIRONMENT_NAME=PRODUCTION
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=production-api-key
SHOPIFY_API_SECRET=production-secret
SCOPES=read_products,write_products,read_orders
```

## Custom Domain Setup

### Staging
```bash
gcloud run services add-iam-policy-binding magicsell-v2-staging \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"

gcloud run domain-mappings create \
  --service=magicsell-v2-staging \
  --domain=staging.magicsell.ai \
  --region=us-central1
```

### Production
```bash
gcloud run domain-mappings create \
  --service=magicsell-v2 \
  --domain=api.magicsell.ai \
  --region=us-central1
```

## Monitoring & Logs

### View Logs
```bash
# Staging logs
gcloud run services logs read magicsell-v2-staging \
  --region=us-central1 \
  --limit=50

# Production logs
gcloud run services logs read magicsell-v2 \
  --region=us-central1 \
  --limit=50
```

### Cloud Console
- **Logs**: https://console.cloud.google.com/logs
- **Cloud Run**: https://console.cloud.google.com/run
- **Cloud Build**: https://console.cloud.google.com/cloud-build

## Troubleshooting

### Deployment Fails with "Container failed to start"

**Cause**: Usually DATABASE_URL not set or database unreachable

**Solution:**
```bash
# Check current env vars
gcloud run services describe magicsell-v2-staging \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

# Update env vars
gcloud run services update magicsell-v2-staging \
  --region=us-central1 \
  --set-env-vars DATABASE_URL="postgresql://..."
```

### "Error: Relations not found" during startup

**Cause**: Prisma migrations not run on database

**Solution:**
```bash
# Connect to Cloud SQL
gcloud sql connect magicsell-db --user=postgres

# Or run migrations via Cloud Build
# Add to cloudbuild.yaml before deploy step:
- name: 'node:20-alpine'
  entrypoint: /bin/sh
  args:
    - -c
    - |
      npm ci
      npx prisma migrate deploy
  env:
    - DATABASE_URL=postgresql://...
```

### Service URL returns 403/404

**Cause**: Service not public or route not configured

**Solution:**
```bash
# Make service public
gcloud run services add-iam-policy-binding magicsell-v2-staging \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### High latency / cold starts

**Cause**: Instance scaled to zero

**Solution:**
```bash
# Increase min instances (costs more)
gcloud run services update magicsell-v2 \
  --region=us-central1 \
  --min-instances=1
```

## Cost Optimization

### Staging
- Min instances: 0 (scales to zero when not used)
- Only charged for actual requests
- Expected cost: $5-10/month

### Production
- Min instances: 1 (always available)
- Auto-scales based on traffic
- Expected cost: $25-50/month for moderate traffic

## CI/CD Pipeline

```
GitHub Actions
    ↓
Manual Trigger (workflow_dispatch)
    ↓
Checkout Code
    ↓
Install Dependencies
    ↓
Authenticate to GCP
    ↓
Cloud Build
    ↓
  Build Docker Image
    ↓
  Push to GCR
    ↓
  Deploy to Cloud Run
    ↓
Verify Deployment
    ↓
Output Service URL
```

## Security Best Practices

1. **Use secrets for sensitive data**
   - Store DATABASE_URL in Google Secret Manager
   - Reference secrets in Cloud Run config

2. **Enable VPC connector** (optional)
   - For private database access
   - Adds security layer

3. **Set up Cloud Armor** (optional)
   - DDoS protection
   - Rate limiting

4. **Enable Cloud Run authentication** (for admin routes)
   ```bash
   gcloud run services update magicsell-v2 \
     --region=us-central1 \
     --no-allow-unauthenticated
   ```

## Rollback Strategy

### If deployment fails:
```bash
# List revisions
gcloud run revisions list \
  --service=magicsell-v2 \
  --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic magicsell-v2 \
  --region=us-central1 \
  --to-revisions=magicsell-v2-00001-abc=100
```

### Emergency rollback via GitHub Actions:
1. Go to Actions tab
2. Find previous successful deployment
3. Click "Re-run all jobs"

## Health Checks

Add to your app (e.g., `app/routes/health.tsx`):
```typescript
export async function loader() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENVIRONMENT_NAME,
  });
}
```

Test:
```bash
curl https://your-service-url/health
```

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Prisma PostgreSQL Setup](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For deployment issues:
1. Check Cloud Run logs in GCP Console
2. Check GitHub Actions logs
3. Review this documentation
4. Contact DevOps team
