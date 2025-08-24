# Business Dashboard Integration Guide

## Overview

This document provides comprehensive information for integrating the feedback tracking and analytics system with your business dashboard. The system tracks user interactions with generated reviews and provides detailed analytics data.

## Database Schema Changes

### New Table: feedback_analytics

```sql
CREATE TABLE feedback_analytics (
  id SERIAL PRIMARY KEY,
  business_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  copy_count INTEGER DEFAULT 0,
  last_copy_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_business_language UNIQUE(business_id, language_code)
);

-- Indexes for performance
CREATE INDEX idx_feedback_analytics_business_id ON feedback_analytics(business_id);
CREATE INDEX idx_feedback_analytics_timestamp ON feedback_analytics(last_copy_timestamp);
CREATE INDEX idx_feedback_analytics_language ON feedback_analytics(language_code);
```

### Existing Table: business_language_preferences

```sql
-- This table should already exist in your business system
CREATE TABLE business_language_preferences (
  id SERIAL NOT NULL,
  business_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  language_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Get Analytics Data

**Endpoint:** `GET /api/businesses/{business_id}/analytics`

**Description:** Retrieves comprehensive analytics data for a specific business.

**Response Format:**
```json
{
  "totalCopies": 150,
  "languageBreakdown": {
    "en": {
      "count": 85,
      "language_name": "English"
    },
    "hi": {
      "count": 45,
      "language_name": "हिंदी"
    },
    "gu": {
      "count": 20,
      "language_name": "ગુજરાતી"
    }
  },
  "recentActivity": [
    {
      "date": "2025-01-20",
      "copies": 12
    },
    {
      "date": "2025-01-19", 
      "copies": 8
    }
  ],
  "lastUpdated": "2025-01-20T10:30:00.000Z"
}
```

**Usage Example:**
```javascript
// Fetch analytics for a business
const response = await fetch(`/api/businesses/${businessId}/analytics`);
const analytics = await response.json();

console.log(`Total reviews copied: ${analytics.totalCopies}`);
console.log('Language breakdown:', analytics.languageBreakdown);
```

### 2. Get Language Preferences

**Endpoint:** `GET /api/businesses/{business_id}/language-preferences`

**Description:** Retrieves available languages for a specific business.

**Response Format:**
```json
{
  "languages": [
    {
      "language_code": "en",
      "language_name": "English"
    },
    {
      "language_code": "hi",
      "language_name": "हिंदी"
    },
    {
      "language_code": "gu",
      "language_name": "ગુજરાતી"
    }
  ]
}
```

## Database Queries for Business Dashboard

### 1. Get Total Review Copies for a Business

```sql
SELECT SUM(copy_count) as total_copies
FROM feedback_analytics 
WHERE business_id = $1;
```

### 2. Get Language-wise Breakdown

```sql
SELECT 
  fa.language_code,
  fa.copy_count,
  blp.language_name,
  fa.last_copy_timestamp
FROM feedback_analytics fa
LEFT JOIN business_language_preferences blp 
  ON fa.business_id = blp.business_id 
  AND fa.language_code = blp.language_code
WHERE fa.business_id = $1
ORDER BY fa.copy_count DESC;
```

### 3. Get Recent Activity (Last 30 Days)

```sql
SELECT 
  DATE(last_copy_timestamp) as date,
  SUM(copy_count) as daily_copies
FROM feedback_analytics 
WHERE business_id = $1 
  AND last_copy_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(last_copy_timestamp)
ORDER BY date DESC;
```

### 4. Get Top Performing Languages

```sql
SELECT 
  fa.language_code,
  blp.language_name,
  fa.copy_count,
  ROUND((fa.copy_count * 100.0 / total.total_copies), 2) as percentage
FROM feedback_analytics fa
LEFT JOIN business_language_preferences blp 
  ON fa.business_id = blp.business_id 
  AND fa.language_code = blp.language_code
CROSS JOIN (
  SELECT SUM(copy_count) as total_copies 
  FROM feedback_analytics 
  WHERE business_id = $1
) total
WHERE fa.business_id = $1
ORDER BY fa.copy_count DESC;
```

### 5. Get Monthly Trends

```sql
SELECT 
  DATE_TRUNC('month', last_copy_timestamp) as month,
  SUM(copy_count) as monthly_copies
FROM feedback_analytics 
WHERE business_id = $1 
  AND last_copy_timestamp >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', last_copy_timestamp)
ORDER BY month DESC;
```

## Dashboard Widget Examples

### 1. Total Reviews Widget

```javascript
// Dashboard widget to display total reviews
async function getTotalReviews(businessId) {
  const response = await fetch(`/api/businesses/${businessId}/analytics`);
  const data = await response.json();
  
  return {
    title: "Total Reviews Generated",
    value: data.totalCopies,
    trend: calculateTrend(data.recentActivity)
  };
}
```

### 2. Language Performance Chart

```javascript
// Chart data for language performance
async function getLanguageChartData(businessId) {
  const response = await fetch(`/api/businesses/${businessId}/analytics`);
  const data = await response.json();
  
  const chartData = Object.entries(data.languageBreakdown).map(([code, info]) => ({
    language: info.language_name,
    count: info.count,
    percentage: (info.count / data.totalCopies * 100).toFixed(1)
  }));
  
  return chartData;
}
```

### 3. Recent Activity Timeline

```javascript
// Timeline widget for recent activity
async function getRecentActivityData(businessId) {
  const response = await fetch(`/api/businesses/${businessId}/analytics`);
  const data = await response.json();
  
  return data.recentActivity.map(activity => ({
    date: new Date(activity.date).toLocaleDateString(),
    copies: activity.copies,
    label: `${activity.copies} reviews copied`
  }));
}
```

## Integration Steps

### Step 1: Database Setup

1. Run the SQL commands from `database-schema-update.sql` to create the required tables
2. Ensure your `business_language_preferences` table is populated with language preferences for each business

### Step 2: API Integration

1. Use the analytics API endpoint to fetch data for your dashboard
2. Implement caching if needed to reduce database load
3. Set up periodic data refresh (recommended: every 5-10 minutes)

### Step 3: Dashboard Widgets

1. Create widgets using the provided query examples
2. Implement real-time updates using WebSockets or polling
3. Add filters for date ranges, languages, etc.

### Step 4: Monitoring

1. Monitor API response times and database performance
2. Set up alerts for unusual activity patterns
3. Track API usage and implement rate limiting if needed

## Performance Considerations

### Database Optimization

- The `feedback_analytics` table uses a composite unique constraint on `(business_id, language_code)`
- Indexes are created on frequently queried columns
- Consider partitioning by date for large datasets

### Caching Strategy

```javascript
// Example caching implementation
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedAnalytics(businessId) {
  const cacheKey = `analytics_${businessId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchAnalytics(businessId);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}
```

### Rate Limiting

- Implement rate limiting on analytics endpoints
- Recommended: 100 requests per minute per business
- Use Redis or similar for distributed rate limiting

## Security Considerations

### Authentication

- Ensure proper authentication for analytics endpoints
- Verify business ownership before returning data
- Use JWT tokens or similar for API authentication

### Data Privacy

- Only return data for businesses the user owns
- Implement proper access controls
- Consider data anonymization for sensitive information

### Example Security Middleware

```javascript
// Middleware to verify business ownership
async function verifyBusinessOwnership(req, res, next) {
  const { businessId } = req.params;
  const userId = req.user.id;
  
  // Check if user owns the business
  const business = await db.query(
    'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
    [businessId, userId]
  );
  
  if (business.rows.length === 0) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}
```

## Troubleshooting

### Common Issues

1. **No analytics data showing**
   - Check if `feedback_analytics` table exists
   - Verify business_id format (should be UUID)
   - Ensure tracking API is being called on copy actions

2. **Language preferences not loading**
   - Verify `business_language_preferences` table has data
   - Check business_id matches exactly
   - Ensure language_code format is correct

3. **Performance issues**
   - Check database indexes are created
   - Monitor query execution times
   - Consider implementing caching

### Debug Queries

```sql
-- Check if analytics data exists for a business
SELECT * FROM feedback_analytics WHERE business_id = 'your-business-id';

-- Check language preferences
SELECT * FROM business_language_preferences WHERE business_id = 'your-business-id';

-- Check recent tracking activity
SELECT * FROM feedback_analytics 
WHERE business_id = 'your-business-id' 
  AND last_copy_timestamp >= CURRENT_DATE - INTERVAL '7 days';
```

## Support

For technical support or questions about the integration:

1. Check the API response for error messages
2. Review database logs for query issues
3. Monitor application logs for tracking failures
4. Verify network connectivity between systems

## Version History

- **v1.0** - Initial implementation with basic tracking
- **v1.1** - Added language-specific analytics
- **v1.2** - Enhanced performance with better indexing
- **v1.3** - Added comprehensive dashboard integration support