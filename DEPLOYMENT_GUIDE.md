# Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] ESLint checks passing
- [ ] TypeScript compilation successful
- [ ] No console errors or warnings
- [ ] Code reviewed by team

### Security
- [ ] No hardcoded secrets
- [ ] Environment variables configured
- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] Dependencies updated and audited
- [ ] `.env` files excluded from git

### Performance
- [ ] Bundle size analyzed
- [ ] Lighthouse score > 90
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Caching configured

### Documentation
- [ ] API documentation updated
- [ ] README updated
- [ ] Environment variables documented
- [ ] Deployment steps documented
- [ ] Known issues documented

## Deployment Steps

### Development to Staging

1. **Prepare Release**
   ```bash
   # Create release branch
   git checkout -b release/v1.0.0
   git push origin release/v1.0.0
   ```

2. **Build for Staging**
   ```bash
   npm run build:dev
   # or
   bun run build:dev
   ```

3. **Deploy to Staging**
   ```bash
   # Using Docker (if configured)
   docker build -t migrationpath:staging .
   docker push registry.example.com/migrationpath:staging
   
   # Or use your deployment platform
   ```

4. **Verify Staging**
   - Test critical user flows
   - Verify API connectivity
   - Check error tracking
   - Monitor performance metrics

### Staging to Production

1. **Final Verification**
   ```bash
   # Re-run full test suite
   npm test -- --run
   
   # Verify build
   npm run build
   ```

2. **Database Migrations**
   ```bash
   # Apply any pending migrations
   supabase migration up
   ```

3. **Deploy to Production**
   ```bash
   # Tag release
   git tag v1.0.0
   git push origin v1.0.0
   
   # Build production
   npm run build
   
   # Deploy
   docker build -t migrationpath:v1.0.0 .
   docker push registry.example.com/migrationpath:v1.0.0
   ```

4. **Post-Deployment**
   - Monitor error tracking
   - Check performance metrics
   - Verify all critical features
   - Monitor user activity
   - Be ready for rollback

## Docker Deployment

### Dockerfile Example

```dockerfile
# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    networks:
      - migrationpath

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    networks:
      - migrationpath

networks:
  migrationpath:
    driver: bridge
```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main
      - release/*

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --run
      
      - name: Build
        run: npm run build
        env:
          VITE_ENV: production
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy
        if: github.ref == 'refs/heads/main'
        run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

## Environment Configuration for Deployment

### Production Environment Variables

```bash
# Set in your deployment platform's secrets

VITE_SUPABASE_URL=https://prod-supabase.example.com
VITE_SUPABASE_ANON_KEY=prod-key-here
VITE_API_BASE_URL=https://api.migrationpath.com/api/v1
VITE_ENV=production
VITE_LOG_LEVEL=warn
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_GA_ID=G-XXXXXXXXXX
```

## Database Migrations

### Running Migrations

```bash
# List pending migrations
supabase migration list

# Apply migrations
supabase migration up

# Rollback last migration
supabase migration down
```

### Creating New Migration

```bash
supabase migration new add_new_table

# Edit the generated file in supabase/migrations/
# Apply when ready
supabase migration up
```

## Monitoring & Health Checks

### Health Check Endpoint

```typescript
// src/pages/health.ts
export async function getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    environment: process.env.VITE_ENV,
  };
}
```

### Monitoring Setup

1. **Uptime Monitoring**
   - Configure health check endpoint
   - Set up alerting

2. **Error Tracking (Sentry)**
   - Configure Sentry DSN
   - Set up alerts for critical errors
   - Configure issue tracking

3. **Performance Monitoring**
   - Enable Google Analytics
   - Monitor Core Web Vitals
   - Track API performance

4. **Log Aggregation**
   - Configure centralized logging
   - Set up log alerts
   - Archive old logs

## Rollback Procedure

### If Deployment Issues Occur

1. **Immediate Rollback**
   ```bash
   # Redeploy previous version
   docker pull registry.example.com/migrationpath:v1.0.0
   docker run -d migrationpath:v1.0.0
   ```

2. **Database Rollback** (if needed)
   ```bash
   # Rollback migrations
   supabase migration down
   ```

3. **Notify Team**
   - Alert team of rollback
   - Document issue
   - Create post-mortem

4. **Post-Incident**
   - Root cause analysis
   - Fix issues
   - Update deployment process

## Production Support

### Common Issues

**High Memory Usage**
- Check for memory leaks
- Optimize query results
- Increase server resources

**Slow API Responses**
- Check database query times
- Review query indexes
- Implement caching

**Authentication Issues**
- Verify token configuration
- Check Supabase status
- Review auth logs

### Escalation Path

1. Check monitoring dashboards
2. Review error logs and stack traces
3. Check database status
4. Contact infrastructure team
5. If critical: initiate rollback

## Scaling Considerations

### Horizontal Scaling

- Use load balancer
- Run multiple app instances
- Share session state
- Use distributed caching

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize code
- Profile for bottlenecks

### Database Scaling

- Add read replicas
- Implement connection pooling
- Archive old data
- Optimize indexes

## Documentation & Runbooks

### Create Runbooks For

- [ ] Normal deployment process
- [ ] Rollback procedure
- [ ] Database migration process
- [ ] Emergency procedures
- [ ] Performance degradation response
- [ ] Security incident response

## Success Criteria

- ✅ All tests passing
- ✅ Deployment successful
- ✅ Health checks passing
- ✅ No critical errors (24 hours)
- ✅ Performance metrics normal
- ✅ User feedback positive
